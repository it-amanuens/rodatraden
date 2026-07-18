"""
Management command to merge duplicate user accounts that share the same email.

Users are identified by username in this application, which has led to some
users creating multiple accounts with the same email address. This command
finds those duplicates, keeps the most recently active account, and migrates
all data (block schedules and private courses) to that account.

Old accounts are deactivated (not deleted) so data can be recovered if needed.

Usage:
    # Preview what would happen (no changes made):
    python manage.py merge_users_by_email --dry-run

    # Perform the merge:
    python manage.py merge_users_by_email

    # Perform the merge and email affected users:
    python manage.py merge_users_by_email --send-emails

    # Skip interactive confirmation:
    python manage.py merge_users_by_email --no-input
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db.models import Count
from django.core.mail import send_mail
from django.conf import settings
from django.utils.text import slugify

import smtplib

User = get_user_model()


class Command(BaseCommand):
    help = (
        'Merge duplicate user accounts that share the same email address. '
        'Keeps the most recently logged-in account, migrates blocks and '
        'private courses, and deactivates old accounts.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview what would happen without making any changes.',
        )
        parser.add_argument(
            '--send-emails',
            action='store_true',
            help='Send email notifications to affected users after merging.',
        )
        parser.add_argument(
            '--no-input',
            action='store_true',
            help='Skip interactive confirmation prompts.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        send_emails = options['send_emails']
        no_input = options['no_input']

        if dry_run:
            self.stdout.write(self.style.WARNING(
                '\n=== DRY RUN MODE — no changes will be made ===\n'
            ))

        # Import models here to avoid circular imports
        from rodatraden.models import Block, PrivateCourse

        # Find emails that have more than one user account
        duplicate_emails = (
            User.objects
            .exclude(email='')
            .exclude(email__isnull=True)
            .values('email')
            .annotate(user_count=Count('id'))
            .filter(user_count__gt=1)
            .order_by('-user_count')
        )

        if not duplicate_emails.exists():
            self.stdout.write(self.style.SUCCESS(
                'No duplicate email addresses found. Nothing to do.'
            ))
            return

        # Summary of what we found
        total_groups = duplicate_emails.count()
        total_extra_users = sum(
            d['user_count'] - 1 for d in duplicate_emails
        )
        self.stdout.write(self.style.NOTICE(
            f'\nFound {total_groups} email(s) with duplicate accounts '
            f'({total_extra_users} extra accounts to merge).\n'
        ))

        # Build a detailed plan
        merge_plan = []
        for entry in duplicate_emails:
            email = entry['email']
            users = list(
                User.objects.filter(email=email)
                .order_by('-last_login', '-date_joined')
            )

            # Target: most recently logged-in user (fallback to most recently
            # joined if none have logged in)
            target = users[0]
            old_users = users[1:]

            group_info = {
                'email': email,
                'target': target,
                'old_users': old_users,
                'migrations': [],
            }

            for old_user in old_users:
                blocks = Block.objects.filter(user=old_user)
                private_courses = PrivateCourse.objects.filter(user=old_user)
                group_info['migrations'].append({
                    'user': old_user,
                    'blocks': list(blocks),
                    'private_courses': list(private_courses),
                })

            merge_plan.append(group_info)

        # Print the plan
        self._print_plan(merge_plan)

        if dry_run:
            self.stdout.write(self.style.WARNING(
                '\n=== DRY RUN COMPLETE — no changes were made ===\n'
                'Run without --dry-run to perform the merge.\n'
            ))
            return

        # Confirm with user
        if not no_input:
            confirm = input(
                '\nProceed with the merge? This will deactivate old accounts '
                'and reassign their data. [y/N]: '
            )
            if confirm.lower() != 'y':
                self.stdout.write(self.style.WARNING('Merge cancelled.'))
                return

        # Perform the merge
        email_notifications = []
        for group in merge_plan:
            notifications = self._merge_group(group)
            email_notifications.extend(notifications)

        self.stdout.write(self.style.SUCCESS(
            f'\nMerge complete! {total_extra_users} account(s) deactivated.'
        ))

        # Send emails if requested
        if send_emails:
            self._send_notifications(email_notifications)

    def _print_plan(self, merge_plan):
        """Print a human-readable merge plan."""

        for group in merge_plan:
            email = group['email']
            target = group['target']
            self.stdout.write(self.style.HTTP_INFO(
                f'━━━ Email: {email} ━━━'
            ))
            self.stdout.write(
                f'  ✓ Keep: {target.username} '
                f'(last login: {target.last_login or "never"}, '
                f'joined: {target.date_joined})'
            )

            for migration in group['migrations']:
                old_user = migration['user']
                blocks = migration['blocks']
                private_courses = migration['private_courses']
                self.stdout.write(self.style.WARNING(
                    f'  ✗ Deactivate: {old_user.username} '
                    f'(last login: {old_user.last_login or "never"}, '
                    f'joined: {old_user.date_joined})'
                ))
                if blocks:
                    self.stdout.write(
                        f'    → Migrate {len(blocks)} block schedule(s):'
                    )
                    for block in blocks:
                        new_title = f'{old_user.username} - {block.title}'
                        self.stdout.write(
                            f'      "{block.title}" → "{new_title}"'
                        )
                if private_courses:
                    self.stdout.write(
                        f'    → Migrate {len(private_courses)} '
                        f'private course(s):'
                    )
                    for pc in private_courses:
                        new_title = f'{old_user.username} - {pc.title}'
                        self.stdout.write(
                            f'      "{pc.title}" → "{new_title}"'
                        )
                if not blocks and not private_courses:
                    self.stdout.write('    → No data to migrate')

    def _merge_group(self, group):
        """Merge a single group of duplicate accounts.

        Returns a list of email notification dicts.
        """

        from rodatraden.models import Block, PrivateCourse, get_unique_slug

        target = group['target']
        notifications = []

        for migration in group['migrations']:
            old_user = migration['user']
            migrated_blocks = []
            migrated_courses = []

            # Migrate block schedules
            for block in migration['blocks']:
                old_title = block.title
                # Prefix with old username to avoid naming collisions
                new_title = f'{old_user.username} - {old_title}'
                block.title = new_title
                block.user = target
                # Regenerate slug to avoid collisions under the new user
                block.slug = get_unique_slug(
                    to_slug=new_title, model=Block
                )
                block.save()
                migrated_blocks.append({
                    'old_title': old_title,
                    'new_title': new_title,
                })
                self.stdout.write(self.style.SUCCESS(
                    f'  Migrated block "{old_title}" → "{new_title}" '
                    f'(from {old_user.username} to {target.username})'
                ))

            # Migrate private courses
            for pc in migration['private_courses']:
                old_title = pc.title
                # Prefix with old username to avoid naming collisions
                new_title = f'{old_user.username} - {old_title}'
                pc.title = new_title
                pc.user = target
                # Regenerate slug to avoid collisions under the new user
                pc.slug = get_unique_slug(
                    to_slug=new_title, model=PrivateCourse
                )
                pc.save()
                migrated_courses.append({
                    'old_title': old_title,
                    'new_title': new_title,
                })
                self.stdout.write(self.style.SUCCESS(
                    f'  Migrated private course "{old_title}" → '
                    f'"{new_title}" '
                    f'(from {old_user.username} to {target.username})'
                ))

            # Deactivate the old user (do NOT delete — keep for reference)
            old_user.is_active = False
            old_user.save()
            self.stdout.write(self.style.WARNING(
                f'  Deactivated user: {old_user.username}'
            ))

            notifications.append({
                'email': group['email'],
                'target_username': target.username,
                'old_username': old_user.username,
                'migrated_blocks': migrated_blocks,
                'migrated_courses': migrated_courses,
            })

        return notifications

    def _send_notifications(self, notifications):
        """Send email notifications to affected users."""

        # Group notifications by email so each user gets one email
        by_email = {}
        for n in notifications:
            email = n['email']
            if email not in by_email:
                by_email[email] = {
                    'target_username': n['target_username'],
                    'merged_accounts': [],
                }
            by_email[email]['merged_accounts'].append(n)

        sent = 0
        failed = 0
        for email, data in by_email.items():
            target = data['target_username']
            body_lines = [
                'Hej!',
                '',
                'Vi har upptäckt att du har flera konton på Röda Tråden '
                'med samma e-postadress. För att förenkla har vi slagit '
                'ihop dina konton till ett.',
                '',
                f'Ditt aktiva konto är: {target}',
                '',
                'Följande konton har avaktiverats och deras data har '
                'flyttats till ditt aktiva konto:',
                '',
            ]

            for account in data['merged_accounts']:
                body_lines.append(
                    f'  • {account["old_username"]}'
                )
                if account['migrated_blocks']:
                    body_lines.append('    Blockscheman som flyttats:')
                    for b in account['migrated_blocks']:
                        body_lines.append(
                            f'      - "{b["old_title"]}" '
                            f'(nytt namn: "{b["new_title"]}")'
                        )
                if account['migrated_courses']:
                    body_lines.append('    Privata kurser som flyttats:')
                    for c in account['migrated_courses']:
                        body_lines.append(
                            f'      - "{c["old_title"]}" '
                            f'(nytt namn: "{c["new_title"]}")'
                        )

            body_lines.extend([
                '',
                'Du kan logga in med ditt aktiva konto och byta namn '
                'på de flyttade blockschemana och kurserna om du vill.',
                '',
                'Om du har frågor, kontakta oss genom att svara på '
                'detta mail.',
                '',
                'Med vänliga hälsningar,',
                'Röda Tråden',
            ])

            body = '\n'.join(body_lines)

            try:
                send_mail(
                    subject='Röda Tråden — Dina konton har slagits ihop',
                    message=body,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )
                sent += 1
                self.stdout.write(self.style.SUCCESS(
                    f'  Email sent to {email}'
                ))
            except (smtplib.SMTPException, ConnectionError, OSError) as e:
                failed += 1
                self.stdout.write(self.style.ERROR(
                    f'  Failed to send email to {email}: {e}'
                ))

        self.stdout.write(self.style.SUCCESS(
            f'\nEmails sent: {sent}, failed: {failed}'
        ))
