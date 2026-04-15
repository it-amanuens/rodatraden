"""
Custom authentication backends for Röda Tråden.

EmailOrUsernameBackend allows users to log in with either their username
or email address, which is needed after the user merge since users may
be accustomed to logging in with different usernames.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q


class EmailOrUsernameBackend(ModelBackend):
    """
    Custom authentication backend that allows users to login with either
    their username or email address.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()

        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)

        if username is None or password is None:
            return None

        try:
            # Try to find user by exact username or case-insensitive email
            user = UserModel.objects.get(
                Q(username=username) | Q(email__iexact=username)
            )
        except UserModel.DoesNotExist:
            # Run the default password hasher once to reduce the timing
            # difference between an existing and a nonexistent user.
            UserModel().set_password(password)
            return None
        except UserModel.MultipleObjectsReturned:
            # If multiple users match (e.g. during migration), try exact
            # username first, then fall back to the first email match.
            try:
                user = UserModel.objects.get(username=username)
            except UserModel.DoesNotExist:
                user = UserModel.objects.filter(
                    email__iexact=username
                ).order_by('-last_login').first()
                if user is None:
                    return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user

        return None
