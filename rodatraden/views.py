from django_filters.views import FilterView
from django_tables2.views import SingleTableMixin
from django_tables2 import LazyPaginator
from bootstrap_modal_forms.generic import BSModalDeleteView, BSModalCreateView, BSModalUpdateView

from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.decorators import user_passes_test
from django.utils.decorators import method_decorator
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.shortcuts import render, get_object_or_404, get_list_or_404
from django.urls import reverse_lazy
from django.http import HttpResponse
from django.views import generic

from .models import Category, Course, CourseOccasion, Block, User, Prerequisite, Profile
from .tables import CourseTable, CourseOccasionTable
from .filters import CourseFilter
from .forms import CourseForm

from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin

class AdminStaffRequiredMixin(LoginRequiredMixin, UserPassesTestMixin):

    def test_func(self):
        return self.request.user.is_superuser or self.request.user.is_staff

# Create your views here.

# Homepage
def index(request):
    return render(request, 'rodatraden/index.html')


# Generic table view for showing a list of the courses
class CourseList(SingleTableMixin, FilterView):
    model = Course
    # Define table class
    table_class = CourseTable
    filterset_class = CourseFilter
    paginator_class = LazyPaginator
    paginate_by = 15  # if pagination is desired
    template_name = 'rodatraden/course_list.html'


class CourseOccasionList(SingleTableMixin, FilterView):
    model = CourseOccasion
    # Define table class
    table_class = CourseOccasionTable
    paginator_class = LazyPaginator
    paginate_by = 15  # if pagination is desired
    template_name = 'rodatraden/course_list.html'
    

# Detailed view for specific courses
class CourseDetail(generic.DetailView):
    model = Course

    # Needs to also return courses which has the current course as a requirement
    def get_context_data(self, **kwargs):
        # Call the base implementation first to get a context
        context = super().get_context_data(**kwargs)
        # Get all courses with the current id as prerequisite
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


class CourseCreate(BSModalCreateView):
    model = Course
    form_class = CourseForm
    template_name = 'rodatraden/course_create.html'
    success_message = 'Kursen skapades utan problem'
    success_url = reverse_lazy('index')


@method_decorator(login_required, name='dispatch')
class CourseUpdate(BSModalUpdateView):
    model = Course
    template_name = 'rodatraden/course_update.html'
    form_class = CourseForm
    success_message = 'Success: Book was updated.'
    success_url = reverse_lazy('index')


# @method_decorator(login_required, name='dispatch')
# @method_decorator(user_passes_test(lambda u: u.is_superuser or u.is_staff),
        # name='dispatch')
class CourseDelete(LoginRequiredMixin, PermissionRequiredMixin, BSModalDeleteView):
    permission_required = 'user.is_staff'
    model = Course
    template_name = 'rodatraden/course_confirm_delete.html'
    success_message = 'Kursen togs bort utan problem'
    success_url = reverse_lazy('course-list')

class ProfileList(generic.ListView):
    model = Profile


class ProfileDetail(generic.DetailView):
    model = Profile


# Page with list of all categories
class CategoryList(generic.ListView):
    model = Category


# Separate page for each category
class CategoryDetail(generic.DetailView):
    model = Category


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
