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
