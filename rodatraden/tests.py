"""
Tests for the merge_users_by_email management command and the
EmailOrUsernameBackend authentication backend.
"""

from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

User = get_user_model()


class MergeUsersByEmailDryRunTests(TestCase):
    """Tests for the merge_users_by_email management command."""

    def _call_command(self, *args, **kwargs):
        out = StringIO()
        kwargs.setdefault('stdout', out)
        kwargs.setdefault('stderr', StringIO())
        call_command('merge_users_by_email', *args, **kwargs)
        return out.getvalue()

    def test_no_duplicates(self):
        """Command exits cleanly when there are no duplicate emails."""
        User.objects.create_user('user1', 'a@example.com', 'pass')
        User.objects.create_user('user2', 'b@example.com', 'pass')
        output = self._call_command('--dry-run')
        self.assertIn('No duplicate email addresses found', output)

    def test_dry_run_does_not_change_data(self):
        """Dry run should not modify any users."""
        User.objects.create_user('user1', 'same@example.com', 'pass')
        User.objects.create_user('user2', 'same@example.com', 'pass')
        self._call_command('--dry-run')

        # Both users should still be active
        self.assertTrue(User.objects.get(username='user1').is_active)
        self.assertTrue(User.objects.get(username='user2').is_active)

    def test_empty_emails_ignored(self):
        """Users with empty emails should not be grouped together."""
        User.objects.create_user('user1', '', 'pass')
        User.objects.create_user('user2', '', 'pass')
        output = self._call_command('--dry-run')
        self.assertIn('No duplicate email addresses found', output)


class EmailOrUsernameBackendTests(TestCase):
    """Tests for the EmailOrUsernameBackend."""

    def test_login_by_username(self):
        """Users should be able to log in with their username."""
        from rodatraden.backends import EmailOrUsernameBackend
        backend = EmailOrUsernameBackend()
        User.objects.create_user('testuser', 'test@example.com', 'testpass')

        user = backend.authenticate(None, username='testuser', password='testpass')
        self.assertIsNotNone(user)
        self.assertEqual(user.username, 'testuser')

    def test_login_by_email(self):
        """Users should be able to log in with their email."""
        from rodatraden.backends import EmailOrUsernameBackend
        backend = EmailOrUsernameBackend()
        User.objects.create_user('testuser', 'test@example.com', 'testpass')

        user = backend.authenticate(None, username='test@example.com', password='testpass')
        self.assertIsNotNone(user)
        self.assertEqual(user.username, 'testuser')

    def test_wrong_password_fails(self):
        """Wrong password should return None."""
        from rodatraden.backends import EmailOrUsernameBackend
        backend = EmailOrUsernameBackend()
        User.objects.create_user('testuser', 'test@example.com', 'testpass')

        user = backend.authenticate(None, username='testuser', password='wrong')
        self.assertIsNone(user)

    def test_nonexistent_user_fails(self):
        """Nonexistent user should return None."""
        from rodatraden.backends import EmailOrUsernameBackend
        backend = EmailOrUsernameBackend()

        user = backend.authenticate(None, username='nobody', password='pass')
        self.assertIsNone(user)
