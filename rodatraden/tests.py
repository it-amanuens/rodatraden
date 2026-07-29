from django.test import TestCase, RequestFactory
from django.contrib.auth.models import User
from django.utils import timezone
from django.contrib.admin.sites import AdminSite
from django.contrib import messages
from unittest.mock import Mock
from datetime import timedelta
from django.conf import settings

from .admin import CustomUserAdmin, delete_inactive_users


class InactiveUserDeletionTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.admin_site = AdminSite()
        self.user_admin = CustomUserAdmin(User, self.admin_site)
        
        # Create test users
        self.old_user = User.objects.create_user(
            username='olduser',
            email='old@example.com',
            date_joined=timezone.now() - timedelta(days=6*365)  # 6 years ago
        )
        self.old_user.last_login = timezone.now() - timedelta(days=6*365)
        self.old_user.save()
        
        self.new_user = User.objects.create_user(
            username='newuser',
            email='new@example.com',
            date_joined=timezone.now() - timedelta(days=1*365)  # 1 year ago
        )
        self.new_user.last_login = timezone.now() - timedelta(days=1*365)
        self.new_user.save()
        
        self.never_logged_in_old = User.objects.create_user(
            username='neverold',
            email='never@example.com',
            date_joined=timezone.now() - timedelta(days=6*365)  # 6 years ago
        )
        # last_login remains None
        
        self.staff_user = User.objects.create_user(
            username='staff',
            email='staff@example.com',
            is_staff=True
        )

    def test_delete_inactive_users(self):
        # Set the threshold to 5 years
        original_setting = getattr(settings, 'INACTIVE_USER_AUTODELETE_YEARS', 5)
        settings.INACTIVE_USER_AUTODELETE_YEARS = 5
        
        request = self.factory.post('/')
        request.user = self.staff_user
        
        # Mock message_user
        self.user_admin.message_user = Mock()
        
        # Call the action
        delete_inactive_users(self.user_admin, request, User.objects.all())
        
        # Check that old users were deleted
        self.assertFalse(User.objects.filter(username='olduser').exists())
        self.assertFalse(User.objects.filter(username='neverold').exists())
        
        # Check that new user and staff were not deleted
        self.assertTrue(User.objects.filter(username='newuser').exists())
        self.assertTrue(User.objects.filter(username='staff').exists())
        
        # Restore setting
        settings.INACTIVE_USER_AUTODELETE_YEARS = original_setting

    def test_delete_inactive_users_disabled(self):
        # Set to disabled
        original_setting = getattr(settings, 'INACTIVE_USER_AUTODELETE_YEARS', 5)
        settings.INACTIVE_USER_AUTODELETE_YEARS = 0
        
        request = self.factory.post('/')
        request.user = self.staff_user
        
        # Mock message_user
        self.user_admin.message_user = Mock()
        
        # Call the action
        delete_inactive_users(self.user_admin, request, User.objects.all())
        
        # No users should be deleted
        self.assertTrue(User.objects.filter(username='olduser').exists())
        self.assertTrue(User.objects.filter(username='neverold').exists())
        self.assertTrue(User.objects.filter(username='newuser').exists())
        self.assertTrue(User.objects.filter(username='staff').exists())
        
        # Restore setting
        settings.INACTIVE_USER_AUTODELETE_YEARS = original_setting
