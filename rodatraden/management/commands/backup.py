import json
import os
import shutil
import tempfile
import codecs
from datetime import datetime
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.core.management import call_command
from io import StringIO


class Command(BaseCommand):
    help = 'Create a backup of the database and media files (profiles and ISP templates)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--no-media',
            action='store_true',
            help='Skip media folder backup (database only)',
        )
        parser.add_argument(
            '--output',
            type=str,
            default=None,
            help='Custom output directory (defaults to backups/ folder)',
        )

    def handle(self, *args, **options):
        no_media = options.get('no_media', False)
        output_dir = options.get('output', None)

        # Determine backup directory
        if output_dir is None:
            backup_root = Path(__file__).resolve().parent.parent.parent.parent / 'backups'
        else:
            backup_root = Path(output_dir)

        # Create backups directory if it doesn't exist
        backup_root.mkdir(exist_ok=True)

        # Create timestamp for backup file
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        backup_filename = f'backup_{timestamp}.zip'
        backup_path = backup_root / backup_filename

        # Create temporary directory for backup contents
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)

            # 1. Dump database to JSON
            self.stdout.write(self.style.HTTP_INFO('Exporting database...'))
            db_dump_path = temp_path / 'data.json'
            try:
                # Use StringIO to capture output with proper UTF-8 handling
                out = StringIO()
                call_command(
                    'dumpdata',
                    '--natural-foreign',
                    '--natural-primary',
                    '--exclude', 'contenttypes',
                    '--exclude', 'auth.Permission',
                    '--indent', '2',
                    stdout=out,
                )
                # Write to file with UTF-8 encoding
                with open(db_dump_path, 'w', encoding='utf-8') as f:
                    f.write(out.getvalue())
                self.stdout.write(self.style.SUCCESS('✓ Database exported successfully'))
            except Exception as e:
                raise CommandError(f'Database export failed: {e}')

            # 2. Copy media folder if needed
            if not no_media:
                self.stdout.write(self.style.HTTP_INFO('Copying media files...'))
                media_root = Path(__file__).resolve().parent.parent.parent.parent / 'media'

                # Copy profiles folder
                profiles_src = media_root / 'profiles'
                profiles_dst = temp_path / 'media' / 'profiles'
                if profiles_src.exists():
                    shutil.copytree(profiles_src, profiles_dst, dirs_exist_ok=True)
                    self.stdout.write(self.style.SUCCESS(f'✓ Copied {len(list(profiles_src.glob("*")))} profile images'))
                else:
                    self.stdout.write(self.style.WARNING('⚠ profiles folder not found, skipping'))

                # Copy isp_templates folder
                templates_src = media_root / 'isp_templates'
                templates_dst = temp_path / 'media' / 'isp_templates'
                if templates_src.exists():
                    shutil.copytree(templates_src, templates_dst, dirs_exist_ok=True)
                    self.stdout.write(self.style.SUCCESS(f'✓ Copied ISP templates'))
                else:
                    self.stdout.write(self.style.WARNING('⚠ isp_templates folder not found, skipping'))

            # 3. Create ZIP archive
            self.stdout.write(self.style.HTTP_INFO(f'Creating backup archive: {backup_filename}...'))
            try:
                # Remove .zip extension temporarily for shutil.make_archive
                backup_path_no_ext = backup_path.with_suffix('')
                shutil.make_archive(str(backup_path_no_ext), 'zip', temp_path)
                self.stdout.write(self.style.SUCCESS(f'✓ Backup created successfully'))
            except Exception as e:
                raise CommandError(f'Archive creation failed: {e}')

        # Print summary
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('BACKUP COMPLETE'))
        self.stdout.write(self.style.SUCCESS('='*60))
        self.stdout.write(f'Location: {backup_path}')
        self.stdout.write(f'Size: {self._format_size(backup_path.stat().st_size)}')
        if not no_media:
            self.stdout.write('Contents: data.json, media/profiles/, media/isp_templates/')
        else:
            self.stdout.write('Contents: data.json only')
        self.stdout.write('\nTo restore this backup later, see README.md for restore instructions.\n')

    def _format_size(self, bytes_size):
        """Format bytes to human-readable size"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if bytes_size < 1024.0:
                return f'{bytes_size:.2f} {unit}'
            bytes_size /= 1024.0
        return f'{bytes_size:.2f} TB'
