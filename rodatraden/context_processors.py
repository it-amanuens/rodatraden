from django.conf import settings
from .models import Category, Profile, CourseOccasion, Block, Report

def nav_processor(request):
    """Return information that should be accessible to all templates."""

    context = {
        'categories_sorted': Category.objects.all().order_by('title'),
        'profiles_sorted': Profile.objects.all().order_by('title'),
        'new_reports': Report.objects.filter(fixed=False).count(),
    }

    if request.user.is_authenticated:
        context['logged_user'] = request.user.username
        context['user_blocks'] = Block.objects.filter(
            user__username=request.user.username
        )

    return context


def site_processor(request):
    """Return site metadata to all templates."""

    return {
        'SITE_NAME': settings.SITE_NAME,
        'SITE_DESCRIPTION': settings.SITE_DESCRIPTION,
        'SITE_PROGRAMME_NAME': settings.SITE_PROGRAMME_NAME,
        'SITE_INSTITUTION_NAME': settings.SITE_INSTITUTION_NAME,
        'SITE_COURSE_PLAN_BASE_URL': settings.SITE_COURSE_PLAN_BASE_URL,
        'SITE_COURSE_PLAN_LABEL': settings.SITE_COURSE_PLAN_LABEL,
        'SITE_ISP_INSTRUCTIONAL_VIDEO_URL': settings.SITE_ISP_INSTRUCTIONAL_VIDEO_URL,
    }
