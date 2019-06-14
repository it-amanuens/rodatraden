# Allows for data to be accessible across all templates

from .models import Category, Profile

def nav_processor(request):
    return {
            'category_list': Category.objects.all(),
            'profile_list': Profile.objects.all(),
            }
