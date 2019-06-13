from django_filters.views import FilterView
from django_tables2.views import SingleTableMixin

from django.shortcuts import render, get_object_or_404, get_list_or_404
from django.http import HttpResponse
from django.views import generic

from .models import Category, Course, CourseOccasion, Block, User, Prerequisite
from .tables import CourseTable, CourseOccasionTable
from .filters import CourseFilter

# Create your views here.

# Generic table view for showing a list of the courses
class CourseList(SingleTableMixin, FilterView):
    model = Course
    # Define table class
    table_class = CourseTable
    filterset_class = CourseFilter
    paginate_by = 15  # if pagination is desired
    template_name = 'rodatraden/course_list.html'

class CourseOccasionList(SingleTableMixin, FilterView):
    model = CourseOccasion
    # Define table class
    table_class = CourseOccasionTable
    paginate_by = 15
    template_name = 'rodatraden/course_list.html'
    
# Detailed view for specific courses
class CourseDetail(generic.DetailView):
    model = Course

    # Needs to also return courses which has the current course as a requirement
    def get_context_data(self, **kwargs):
        # Call the base implementation first to get a context
        context = super().get_context_data(**kwargs)
        # Get all courses with the current id as prerequisite
        # prereq = Prerequisite.objects.filter(prereq_id=self.object.id).values_list('id')
        context['prereq_courses'] = self.object.course_set.all
        return context

# Detailed view for specific courses
class CourseOccasionDetail(generic.DetailView):
    model = CourseOccasion
    template_name = 'rodatraden/course_detail.html'

    def get_context_data(self, **kwargs):
        # Call the base implementation first to get a context
        context = super().get_context_data(**kwargs)
        # Also sends information about the given course
        context['course'] = self.object.course
        return context

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
