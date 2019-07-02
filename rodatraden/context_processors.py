# Allows for data to be accessible across all templates

from .models import Category, Profile, CourseOccasion, Block

def nav_processor(request):
    context = {
            'category_list': Category.objects.all(),
            'profile_list': Profile.objects.all(),
            }

    if request.user.is_authenticated:
        context['logged_user'] = request.user.username
        context['user_blocks'] = Block.objects.filter(user__username=request.user.username)
    
    return context
