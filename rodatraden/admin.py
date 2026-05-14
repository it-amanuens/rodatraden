from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _, ngettext
from django.utils import timezone
from django.contrib import messages
from django.conf import settings
from django.db import models
from datetime import timedelta

from .models import *

# Register your models here.

# I chose these since there is no good point to make separate views for these
# models and I'm lazy.
myModels = [
    Department,
    Level,
    Track,
    AcademicYear,
    TimePeriod,
    ISPTemplate,
    CourseScheduleSegment,
    Exam,
    CategoryExam,
]

# Register all the models in myModels to the admin site
admin.site.register(myModels)


def delete_inactive_users(modeladmin, request, queryset):
    """Admin action to delete inactive users based on settings."""
    years = getattr(settings, 'INACTIVE_USER_AUTODELETE_YEARS', 5)
    if years <= 0:
        modeladmin.message_user(
            request,
            _("Inactive user auto-deletion is disabled (INACTIVE_USER_AUTODELETE_YEARS is 0 or not set)."),
            messages.WARNING
        )
        return

    threshold_date = timezone.now() - timedelta(days=years * 365)
    
    # Find inactive users: exclude staff and superusers
    inactive_users = queryset.filter(
        is_staff=False,
        is_superuser=False
    ).filter(
        models.Q(last_login__lt=threshold_date) |
        models.Q(last_login__isnull=True, date_joined__lt=threshold_date)
    )
    
    count = inactive_users.count()
    if count == 0:
        modeladmin.message_user(
            request,
            _("No inactive users found to delete."),
            messages.INFO
        )
        return
    
    inactive_users.delete()
    modeladmin.message_user(
        request,
        ngettext(
            "%d inactive user was successfully deleted.",
            "%d inactive users were successfully deleted.",
            count,
        ) % count,
        messages.SUCCESS,
    )


delete_inactive_users.short_description = _("Delete inactive users")


class CustomUserAdmin(UserAdmin):
    actions = [delete_inactive_users] + list(UserAdmin.actions)


# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
