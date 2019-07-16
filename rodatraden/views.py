from django_filters.views import FilterView
from django_tables2.views import SingleTableMixin, SingleTableView
from bootstrap_modal_forms.generic import (
        BSModalDeleteView, BSModalCreateView, BSModalUpdateView, 
        BSModalReadView
)

from django.core.mail import send_mail, BadHeaderError
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.decorators import user_passes_test
from django.utils.decorators import method_decorator
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse_lazy, reverse
from django.http import JsonResponse, HttpResponseRedirect
from django.views import generic
from django.core import serializers
from django.forms import formset_factory

from .models import (
        Category, Course, CourseOccasion, Block, User, Prerequisite, Profile,
        CategoryExam, CategoryCourse, AcademicYear, Exam, Report
)
from .tables import CourseTable, CourseOccasionTable, ExamTable, ReportTable
from .filters import CourseFilter, CourseOccasionFilter
from .forms import (
        CourseForm, BlockForm, ProfileForm, CourseOccasionForm, ExamForm,
        CategoryForm, ReportForm, ReportEditForm
)

from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin

import pdb

class CorrectUserPermissionMixin:
    """
    Mixing to only allow the creator of a certain item to be able to edit
    """

    def dispatch(self, request, *args, **kwargs):
        # Ignore if not logged in
        if not request.user.is_authenticated:
            return super().dispatch(request, *args, **kwargs)
        # Otherwise send user to index
        else:
            if kwargs['username'] == request.user.username:
                return super().dispatch(request, *args, **kwargs)
            else:
                return redirect(reverse("index"), {"poo":1})


def index(request):
    """
    Homepage of the site
    """
    context = {
            'latest_courses': Course.objects.all().order_by('-updated_at')[:7],
            'latest_blocks':
                Block.objects.filter(private=0).order_by('-updated_at')[:7],
            'categories': Category.objects.all().order_by('title'),
            'profiles': Profile.objects.all(),
            }
    return render(request, 'rodatraden/index.html', context)


class ReportCreate(BSModalCreateView):
    model = Report
    form_class = ReportForm
    template_name = 'rodatraden/report_create.html'
    success_message = 'Tack för din hjälp!'

    def get_success_url(self):
        # Return to last page
        return self.request.META['HTTP_REFERER']


class ReportList(LoginRequiredMixin, PermissionRequiredMixin, SingleTableView):
    permission_required = 'rodatraden.show_report'
    model = Report
    table_class = ReportTable
    template_name = 'rodatraden/report_list.html'


class ReportUpdate(LoginRequiredMixin, PermissionRequiredMixin,
        BSModalUpdateView):
    permission_required = 'rodatraden.change_report'
    model = Report
    form_class = ReportEditForm
    template_name = 'rodatraden/report_update.html'
    success_message = 'Rapport uppdaterades utan problem'
    success_url = reverse_lazy('report-list')


class ReportDelete(LoginRequiredMixin, PermissionRequiredMixin,
        BSModalDeleteView):
    permission_required = 'rodatraden.delete_report'
    model = Report
    template_name = 'rodatraden/report_confirm_delete.html'
    success_message = 'Rapport raderad'
    success_url = reverse_lazy('report-list')


class ExamList(SingleTableView):
    model = Exam
    table_class = ExamTable
    template_name = 'rodatraden/exam_list.html'


class ExamDetail(generic.DetailView):
    model = Exam


class ExamCreate(LoginRequiredMixin, PermissionRequiredMixin, BSModalCreateView):
    permission_required = 'rodatraden.add_exam'
    model = Exam
    form_class = ExamForm
    template_name = 'rodatraden/exam_create.html'
    success_message = 'Examina skapades utan problem'
    success_url = reverse_lazy('exam-list')


class ExamUpdate(LoginRequiredMixin, PermissionRequiredMixin, BSModalUpdateView):
    permission_required = 'rodatraden.change_exam'
    model = Exam
    form_class = ExamForm
    template_name = 'rodatraden/exam_update.html'
    success_message = 'Examina uppdaterades utan problem'
    success_url = reverse_lazy('exam-list')


class ExamDelete(LoginRequiredMixin, PermissionRequiredMixin, BSModalDeleteView):
    permission_required = 'rodatraden.delete_exam'
    model = Exam
    template_name = 'rodatraden/exam_confirm_delete.html'
    success_message = 'Examina togs bort utan problem'
    success_url = reverse_lazy('exam-list')


class CourseList(SingleTableMixin, FilterView):
    model = Course
    # Define table class
    table_class = CourseTable
    filterset_class = CourseFilter
    paginate_by = 15  # if pagination is desired
    template_name = 'rodatraden/course_list.html'


class CourseDetail(generic.DetailView):
    model = Course

    # Needs to also return courses which has the current course as a requirement
    def get_context_data(self, **kwargs):
        # Call the base implementation first to get a context
        context = super().get_context_data(**kwargs)
        # Get all courses with the current id as prerequisite
        context['prereq_courses'] = self.object.course_set.all()
        return context


class CourseCreate(LoginRequiredMixin, PermissionRequiredMixin, BSModalCreateView):
    permission_required = 'rodatraden.add_course'
    model = Course
    form_class = CourseForm
    template_name = 'rodatraden/course_create.html'
    success_message = 'Kursen skapades utan problem'
    success_url = reverse_lazy('course-list')


class CourseUpdate(LoginRequiredMixin, PermissionRequiredMixin, BSModalUpdateView):
    permission_required = 'rodatraden.change_course'
    model = Course
    template_name = 'rodatraden/course_update.html'
    form_class = CourseForm
    success_message = 'Kursen uppdaterades utan problem'
    success_url = reverse_lazy('course-list')


class CourseDelete(LoginRequiredMixin, PermissionRequiredMixin, BSModalDeleteView):
    permission_required = 'rodatraden.delete_course'
    model = Course
    template_name = 'rodatraden/course_confirm_delete.html'
    success_message = 'Kursen togs bort utan problem'
    success_url = reverse_lazy('course-list')


class CourseOccasionList(SingleTableMixin, FilterView):
    model = CourseOccasion
    # Define table class
    table_class = CourseOccasionTable
    filterset_class = CourseOccasionFilter
    paginate_by = 15  # if pagination is desired
    template_name = 'rodatraden/courseoccasion_list.html'


class CourseOccasionDetail(generic.DetailView):
    model = CourseOccasion
    template_name = 'rodatraden/courseoccasion_detail.html'

    # Filter by slug and year
    def get_queryset(self):
        # Original filter
        self.qs = super().get_queryset()
        return self.qs.filter(
                academic_year__year=self.kwargs['year'])

    # Needs to also return courses which has the current course as a requirement
    def get_context_data(self, **kwargs):
        # Call the base implementation first to get a context
        context = super().get_context_data(**kwargs)
        # Get all courses with the current id as prerequisite
        context['prereq_courses'] = self.object.course.course_set.all()
        return context


def courseoccasion_info(request):
    # Get year and start from get request
    year = int(request.GET.get('year', ''))
    slug = request.GET.get('slug', '')

    # Get block id so we don't show courses already in block
    courseoccasion = get_object_or_404(CourseOccasion, academic_year__year=year, 
            slug=slug)

    context = {
            'courseoccasion': courseoccasion,
            'course': courseoccasion.course
            }

    return render(request, 'rodatraden/courseoccasion_info.html', context)


class CourseOccasionCreate(LoginRequiredMixin, PermissionRequiredMixin, BSModalCreateView):
    permission_required = 'rodatraden.add_courseoccasion'
    model = CourseOccasion
    form_class = CourseOccasionForm
    template_name = 'rodatraden/courseoccasion_create.html'
    success_message = 'Kurstillfället skapades utan problem'
    success_url = reverse_lazy('courseoccasion-list')


class CourseOccasionUpdate(LoginRequiredMixin, PermissionRequiredMixin, BSModalUpdateView):
    permission_required = 'rodatraden.change_courseoccasion'
    model = CourseOccasion
    form_class = CourseOccasionForm
    template_name = 'rodatraden/courseoccasion_update.html'
    success_message = 'Kurstillfälle uppdaterat'
    success_url = reverse_lazy('courseoccasion-list')


class CourseOccasionDelete(LoginRequiredMixin, PermissionRequiredMixin, BSModalDeleteView):
    permission_required = 'rodatraden.delete_courseoccasion'
    model = CourseOccasion
    template_name = 'rodatraden/courseoccasion_confirm_delete.html'
    success_message = 'Kurstillfället togs bort utan problem'
    success_url = reverse_lazy('courseoccasion-list')


class ProfileList(generic.ListView):
    """
    List with the profiles
    """
    model = Profile


class ProfileDetail(generic.DetailView):
    """
    Detail view for profiles
    """
    model = Profile

    def get_context_data(self, **kwargs):
        # Call the base implementation first to get a context
        context = super().get_context_data(**kwargs)
        context['tracks'] = self.object.track_set.all()
        return context


class ProfileCreate(LoginRequiredMixin, PermissionRequiredMixin, BSModalCreateView):
    """
    Creating new profiles
    """
    permission_required = 'rodatraden.add_profile'
    model = Profile
    form_class = ProfileForm
    template_name = 'rodatraden/profile_create.html'
    success_message = 'Profilen skapades utan problem'
    success_url = reverse_lazy('profile-list')


class ProfileUpdate(LoginRequiredMixin, PermissionRequiredMixin, BSModalUpdateView):
    """
    Updating current profiles
    """
    permission_required = 'rodatraden.change_profile'
    model = Profile
    form_class = ProfileForm
    template_name = 'rodatraden/profile_update.html'
    success_message = 'Profilen uppdaterades utan problem'
    success_url = reverse_lazy('profile-list')


class ProfileDelete(LoginRequiredMixin, PermissionRequiredMixin, BSModalDeleteView):
    """
    Deleting current profiles
    """
    permission_required = 'rodatraden.delete_profile'
    model = Profile
    template_name = 'rodatraden/profile_confirm_delete.html'
    success_message = 'Profilen togs bort utan problem'
    success_url = reverse_lazy('profile-list')


# Page with list of all categories
class CategoryList(generic.ListView):
    model = Category


# Separate page for each category
class CategoryDetail(generic.DetailView):
    model = Category


class CategoryCreate(LoginRequiredMixin, PermissionRequiredMixin, BSModalCreateView):
    permission_required = 'rodatraden.add_category'
    model = Category
    form_class = CategoryForm
    template_name = 'rodatraden/category_create.html'
    success_message = 'Kategori skapades utan problem'
    success_url = reverse_lazy('category-list')


class CategoryUpdate(LoginRequiredMixin, PermissionRequiredMixin, BSModalUpdateView):
    permission_required = 'rodatraden.change_category'
    model = Category
    form_class = CategoryForm
    template_name = 'rodatraden/category_update.html'
    success_message = 'Kategori uppdaterades utan problem'
    success_url = reverse_lazy('category-list')


class CategoryDelete(LoginRequiredMixin, PermissionRequiredMixin, BSModalDeleteView):
    permission_required = 'rodatraden.delete_category'
    model = Category
    template_name = 'rodatraden/category_confirm_delete.html'
    success_message = 'Kategori togs bort utan problem'
    success_url = reverse_lazy('category-list')


class BlockList(CorrectUserPermissionMixin, LoginRequiredMixin, generic.ListView):
    """
    List that shows the current users blocks
    """
    model = Block


class BlockUpdate(CorrectUserPermissionMixin, LoginRequiredMixin, BSModalUpdateView):
    """
    Update basic info for the block
    """
    model = Block
    template_name = 'rodatraden/block_update.html'
    form_class = BlockForm
    success_message = 'Ändringarna i blockschemat sparades'
    
    def get_success_url(self, **kwargs):
        return reverse_lazy('block-list', 
                kwargs={'username':self.kwargs['username']})


class BlockCreate(CorrectUserPermissionMixin, LoginRequiredMixin,
        BSModalCreateView):
    """ 
    Create block
    """
    model = Block
    template_name = 'rodatraden/block_create.html'
    form_class = BlockForm
    success_message = 'Blockschema skapat'

    def form_valid(self, form):
        # Override form_valid to add current user to block
        instance = form.save(commit=False)
        instance.user = self.request.user

        return super(BlockCreate, self).form_valid(form)

    def get_success_url(self, **kwargs):
        return reverse_lazy('block-list', 
                kwargs={'username':self.kwargs['username']})


class BlockRemove(CorrectUserPermissionMixin, LoginRequiredMixin,
        BSModalDeleteView):
    """
    Remove block
    """
    model = Block
    template_name = 'rodatraden/block_delete.html'
    success_message = 'Blockschema raderat'

    def get_success_url(self, **kwargs):
        return reverse_lazy('block-list', 
                kwargs={'username':self.kwargs['username']})


def block_detail(request, username, slug):
    """
    Detail view for a block
    """
    block = get_object_or_404(Block, user__username=username, slug=slug)

    # If the block is not private, show without authentication
    if block.private:
        if not request.user.is_authenticated:
            return redirect(reverse('cas_ng_login'))
        elif request.user.username != block.user.username:
            return redirect(reverse("index"))

    # Ajax request for jquery for rendering block
    if request.is_ajax():
        results = [ob.as_json() for ob in block.courseoccasions.all()]
        return JsonResponse({'course_occasions': results, 'start_year':
            block.start_year})
    else:
        # Define categories dict and get the sum of points for each category for
        # this block
        categories = CategoryExam.objects.all()
        category_sum = dict.fromkeys([category.category.title for category in
            categories], 0)
        block.total_category_ects(category_sum)

        context = {
                'this_block': block,
                'current_path': request.get_full_path,
                'categories': categories,
                'categories_sum': category_sum,
                'logged_in': request.user.is_authenticated and
                request.user.username == block.user.username
                }

        return render(request, 'rodatraden/block_detail.html', context)


@login_required
def block_course_list(request, username, slug):
    """
    List courseoccasions that can be added to a block for a specific year and
    time period
    """
    # Get year and start from get request
    year = int(request.GET.get('year', ''))
    start = int(request.GET.get('start', ''))

    # Get block id so we don't show courses already in block
    block = get_object_or_404(Block, user__username=username, slug=slug)

    # Only blocks made by same user
    if (block.user.username != request.user.username):
        return redirect(reverse("index"))

    # SOrt by year, start, if not in block and order by title
    courseoccasions = CourseOccasion.objects.filter(academic_year__year=year, 
            time_period__week__gte=start, 
            time_period__week__lt=start+10).exclude(
            block__id=block.id).order_by('course__title')

    context = {
            'b_slug': slug,
            'username': username,
            'courseoccasions': courseoccasions,
            }

    return render(request, 'rodatraden/block_course_list.html', context)


@login_required
def add_course_to_block(request, username, b_slug):
    """
    Add a given courseoccasion to a given block
    """
    # Get slug from request
    c_slug = request.GET.get('slug', '')
    # Get block and courseoccasion
    block = get_object_or_404(Block, user__username=username, slug=b_slug)
    # Only blocks made by same user
    if (block.user.username != request.user.username):
        return redirect(reverse("index"))
    course = get_object_or_404(CourseOccasion, slug=c_slug)
    # Add
    block.courseoccasions.add(course)

    return redirect('block-detail', username=username, slug=b_slug)


@login_required
def remove_course_from_block(request, username, b_slug):
    """
    Remove a given courseoccasion to a given block
    """
    # Get slug from request
    c_slug = request.GET.get('slug', '')
    # Get block and courseoccasion
    block = get_object_or_404(Block, user__username=username, slug=b_slug)
    # Only blocks made by same user
    if (block.user.username != request.user.username):
        return redirect(reverse("index"))
    course = get_object_or_404(CourseOccasion, slug=c_slug)
    # Remove
    block.courseoccasions.remove(course)

    return redirect('block-detail', username=username, slug=b_slug)
