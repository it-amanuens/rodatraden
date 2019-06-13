from django.views.generic.list import ListView

from django_filters.views import FilterView
from django_tables2.views import SingleTableMixin

from django.shortcuts import render, get_object_or_404, get_list_or_404
from django.http import HttpResponse

from .models import Category, Course, CourseOccasion, Block, User
from .tables import CourseTable
from .filters import CourseFilter

# Create your views here.

# Generic table view for showing a list of the courses
class CoursesList(SingleTableMixin, FilterView):
    model = Course
    # Define table class
    table_class = CourseTable
    filterset_class = CourseFilter
    paginate_by = 15  # if pagination is desired
    template_name = 'rodatraden/course_list.html'
    










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
    category = get_object_or_404(Category, slug=slug)
    context = {
            'category': category,
            }
    return render(request, 'rodatraden/category.html', context)


def course_occasion_info(request, year, slug):
    courseoccasion = get_object_or_404(CourseOccasion, slug=slug, year=year);
    context = {
        'category': courseoccasion,
            }
    return render(request, 'rodatraden/category.html', context)

def block(request, username, slug):
    # Get a block matching a user and slug
    block = get_object_or_404(Block, user__username=username, slug=slug)
    # Call the block ublock (userblock) since it will clash with other notation
    # otherwise
    context = {
            'courseoccasions': block.courseoccasion.all(),
            'ublock': block,
            'years': range(block.start_year, block.start_year + 5, 1),
            }
    return render(request, 'rodatraden/block.html', context)
    # return HttpResponse(block.slug)
