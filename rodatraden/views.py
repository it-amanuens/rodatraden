from django.shortcuts import render, get_object_or_404, get_list_or_404
from django.http import HttpResponse

from .models import Category, Course, CourseOccasion, Block, User

# Create your views here.
# Homepage
def index(request):
    return render(request, 'rodatraden/index.html')

# Page with list of all categories
def categories(request):
    # Send all of the categories to the view
    context = {
            'categories_list': Category.objects.all(),
            }
    return render(request, 'rodatraden/categories.html', context)

# Separate page for each category
def category_info(request, slug):
    # Get category from given id
    category = get_object_or_404(Category, slug=slug);
    context = {
            'category': category,
            }
    return render(request, 'rodatraden/category.html', context)

def courses(request):
    # Send all of the categories to the view
    context = {
            'courses_list': Course.objects.all(),
            }
    return render(request, 'rodatraden/courses.html', context)

def course_occasion_info(request, year, slug):
    courseoccasion = get_object_or_404(CourseOccasion, slug=slug, year=year);
    context = {
        'category': courseoccasion,
    }
    return render(request, 'rodatraden/category.html', context)

def block(request, username, slug):
    # First get user
    user = get_object_or_404(User, username=username);
    # Then get block with that user and slug
    block = get_list_or_404(Block, slug=slug, user=user);
    return HttpResponse('epic %s and %s' % (username, slug))
