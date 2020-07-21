from django_filters.views import FilterView
from django_tables2.views import SingleTableMixin, SingleTableView
from bootstrap_modal_forms.generic import (
        BSModalDeleteView, BSModalCreateView, BSModalUpdateView,
        BSModalReadView
)

from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.views.generic import DetailView, ListView
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse_lazy, reverse
from django.http import JsonResponse, HttpResponseRedirect

from .models import (
        Category, Course, CourseOccasion, Block, User, Prerequisite, Profile,
        CategoryExam, CategoryCourse, AcademicYear, Exam, Report, PrivateCourse
)
from .tables import (
        CourseTable, CourseOccasionTable, ExamTable, ReportTable,
        PrivateCourseTable
        )
from .filters import CourseFilter, CourseOccasionFilter
from .forms import (
        CourseForm, BlockForm, ProfileForm, CourseOccasionForm, ExamForm,
        CategoryForm, ReportForm, PrivateCourseForm
)
from .rodatraden_modules.mixins import CorrectUserPermissionMixin

import openpyxl
import os
import string
import math
import re
from django.views.static import serve
from django.utils.crypto import get_random_string
from operator import itemgetter
from rodatraden import validator
from openpyxl.styles import Alignment, Font
from django.conf import settings


import pdb

def index(request):
    """Homepage of site."""

    context = {
            'latest_courses': Course.objects.all().order_by('-updated_at')[:7],
            'latest_blocks':
                Block.objects.filter(private=0).order_by('-updated_at')[:7],
            'categories': Category.objects.all().order_by('title'),
            'profiles': Profile.objects.all(),
            }

    return render(request, 'rodatraden/index.html', context)

def tools(request):
    """Various tools for usage"""

    # Only staff can access this site
    if not request.user.is_staff:
        return redirect(reverse('index'))

    # Incoming info
    if request.method == 'POST':
        # Copying courseoccasions tool
        if 'courseocc_copy' in request.POST:
            from_acyear = AcademicYear.objects.get(id=request.POST['from'])
            to_acyear   = AcademicYear.objects.get(id=request.POST['to'])
            # Make sure that the years exist
            if from_acyear and to_acyear:
                # From all the current courseoccasions
                for courseocc in CourseOccasion.objects.filter(
                        academic_year=from_acyear
                        ):
                    # Only create a new for the new year if it does not already
                    # exist
                    if not CourseOccasion.objects.filter(academic_year=to_acyear,
                            course=courseocc.course):
                        courseocc.pk = None
                        courseocc.academic_year= to_acyear
                        courseocc.save()

    # Get all academic years
    acyears = AcademicYear.objects.all().order_by('year')

    context = {
            'acyears': acyears,
    }

    return render(request, 'rodatraden/tools.html', context)


#############
## REPORTS ##
#############

class ReportCreate(BSModalCreateView):
    """Creation view for reports."""

    model = Report
    form_class = ReportForm
    template_name = 'rodatraden/report/report_create.html'
    success_message = 'Tack för din hjälp!'

    def get_success_url(self):
        # Return to last page
        return self.request.META['HTTP_REFERER']


class ReportList(LoginRequiredMixin, PermissionRequiredMixin, SingleTableView):
    """List view for reports."""

    permission_required = 'rodatraden.show_report'
    model = Report
    table_class = ReportTable
    template_name = 'rodatraden/report/report_list.html'


class ReportUpdate(LoginRequiredMixin, PermissionRequiredMixin,
        BSModalUpdateView):
    """Update view for reports."""

    permission_required = 'rodatraden.change_report'
    model = Report
    form_class = ReportForm
    template_name = 'rodatraden/report/report_update.html'
    success_message = 'Rapport uppdaterades utan problem'

    def get_success_url(self):
        # Return to last page
        return self.request.META['HTTP_REFERER']


class ReportDelete(LoginRequiredMixin, PermissionRequiredMixin,
        BSModalDeleteView):
    """Delete view for reports."""

    permission_required = 'rodatraden.delete_report'
    model = Report
    template_name = 'rodatraden/report/report_confirm_delete.html'
    success_message = 'Rapport raderad'
    success_url = reverse_lazy('report-list')

###########
## EXAMS ##
###########

class ExamList(SingleTableView):
    """List view for exams"""

    model = Exam
    table_class = ExamTable
    template_name = 'rodatraden/exam/exam_list.html'


class ExamDetail(DetailView):
    """Detail view for exams"""

    model = Exam
    template_name = 'rodatraden/exam/exam_detail.html'


class ExamCreate(LoginRequiredMixin, PermissionRequiredMixin,
        BSModalCreateView):
    """Creation view for exams."""

    permission_required = 'rodatraden.add_exam'
    model = Exam
    form_class = ExamForm
    template_name = 'rodatraden/exam/exam_create.html'
    success_message = 'Examina skapades utan problem'
    success_url = reverse_lazy('exam-list')


class ExamUpdate(LoginRequiredMixin, PermissionRequiredMixin,
        BSModalUpdateView):
    """Update view for exams."""

    permission_required = 'rodatraden.change_exam'
    model = Exam
    form_class = ExamForm
    template_name = 'rodatraden/exam/exam_update.html'
    success_message = 'Examina uppdaterades utan problem'

    def get_success_url(self):
        # Return to last page
        return self.request.META['HTTP_REFERER']


class ExamDelete(LoginRequiredMixin, PermissionRequiredMixin,
        BSModalDeleteView):
    """Delete view for exams."""

    permission_required = 'rodatraden.delete_exam'
    model = Exam
    template_name = 'rodatraden/exam/exam_confirm_delete.html'
    success_message = 'Examina togs bort utan problem'
    success_url = reverse_lazy('exam-list')

###########
# COURSES #
###########

class CourseList(SingleTableMixin, FilterView):
    """List view for courses."""

    model = Course
    table_class = CourseTable
    filterset_class = CourseFilter
    # Amount of queries per page
    paginate_by = 15
    template_name = 'rodatraden/course/course_list.html'


class CourseDetail(DetailView):
    """Detail view for courses."""

    model = Course
    template_name = 'rodatraden/course/course_detail.html'

    def get_context_data(self, **kwargs):
        """Extend get_context_data to return courses that is required for the
        given course."""

        context = super().get_context_data(**kwargs)
        # Get all courses with the current id as prerequisite
        context['prereq_courses'] = self.object.course_set.all()

        return context


class CourseCreate(LoginRequiredMixin, PermissionRequiredMixin,
        BSModalCreateView):
    """Creation view for courses."""

    permission_required = 'rodatraden.add_course'
    model = Course
    form_class = CourseForm
    template_name = 'rodatraden/course/course_create.html'
    success_message = 'Kursen skapades utan problem'
    success_url = reverse_lazy('course-list')


class CourseUpdate(LoginRequiredMixin, PermissionRequiredMixin,
        BSModalUpdateView):
    """Update view for courses."""

    permission_required = 'rodatraden.change_course'
    model = Course
    form_class = CourseForm
    template_name = 'rodatraden/course/course_update.html'
    success_message = 'Kursen uppdaterades utan problem'

    def get_success_url(self):
        # Return to last page
        return self.request.META['HTTP_REFERER']


class CourseDelete(LoginRequiredMixin, PermissionRequiredMixin,
        BSModalDeleteView):
    """Delete view for courses."""

    permission_required = 'rodatraden.delete_course'
    model = Course
    template_name = 'rodatraden/course/course_confirm_delete.html'
    success_message = 'Kursen togs bort utan problem'
    success_url = reverse_lazy('course-list')

###################
# COURSEOCCASIONS #
###################

class CourseOccasionList(SingleTableMixin, FilterView):
    """List view for courseoccasions."""

    model = CourseOccasion
    table_class = CourseOccasionTable
    filterset_class = CourseOccasionFilter
    paginate_by = 15
    template_name = 'rodatraden/courseoccasion/courseoccasion_list.html'


class CourseOccasionDetail(DetailView):
    """Detail view for courseoccasions."""

    model = CourseOccasion
    template_name = 'rodatraden/courseoccasion/courseoccasion_detail.html'

    def get_queryset(self):
        """Extend get_queryset to filter also by year"""

        self.qs = super().get_queryset()

        return self.qs.filter(
                academic_year__year=self.kwargs['year'])

    def get_context_data(self, **kwargs):
        """Extend get_context_data to return courses that is required for the
        given course."""

        context = super().get_context_data(**kwargs)
        context['prereq_courses'] = self.object.course.course_set.all()

        return context


def courseoccasion_info(request):
    """Small info view for courseoccasions used in blocks."""

    # Get year and start from get request
    year = int(request.GET.get('year', ''))
    slug = request.GET.get('slug', '')

    courseoccasion = get_object_or_404(CourseOccasion, academic_year__year=year,
            slug=slug)

    context = {
            'courseoccasion': courseoccasion,
            'course': courseoccasion.course
            }

    return render(request, 'rodatraden/courseoccasion/courseoccasion_info.html',
            context)


class CourseOccasionCreate(LoginRequiredMixin, PermissionRequiredMixin,
        BSModalCreateView):
    """Creation view for courseoccasions."""

    permission_required = 'rodatraden.add_courseoccasion'
    model = CourseOccasion
    form_class = CourseOccasionForm
    template_name = 'rodatraden/courseoccasion/courseoccasion_create.html'
    success_message = 'Kurstillfället skapades utan problem'
    success_url = reverse_lazy('courseoccasion-list')


class CourseOccasionUpdate(LoginRequiredMixin, PermissionRequiredMixin,
        BSModalUpdateView):
    """Update view for courseoccasions."""

    permission_required = 'rodatraden.change_courseoccasion'
    model = CourseOccasion
    form_class = CourseOccasionForm
    template_name = 'rodatraden/courseoccasion/courseoccasion_update.html'
    success_message = 'Kurstillfälle uppdaterat'

    def get_success_url(self):
        # Return to last page
        return self.request.META['HTTP_REFERER']


class CourseOccasionDelete(LoginRequiredMixin, PermissionRequiredMixin,
        BSModalDeleteView):
    """Delete view for courseoccasions."""

    permission_required = 'rodatraden.delete_courseoccasion'
    model = CourseOccasion
    template_name = 'rodatraden/courseoccasion/courseoccasion_confirm_delete.html'

    success_message = 'Kurstillfället togs bort utan problem'
    success_url = reverse_lazy('courseoccasion-list')

############
# PROFILES #
############

class ProfileList(ListView):
    """List view for profiles."""

    model = Profile
    template_name = 'rodatraden/profile/profile_list.html'


class ProfileDetail(DetailView):
    """Detail view for profiles."""

    model = Profile
    template_name = 'rodatraden/profile/profile_detail.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['tracks'] = self.object.track_set.all()

        return context


class ProfileCreate(LoginRequiredMixin, PermissionRequiredMixin,
        BSModalCreateView):
    """Creation view for profiles."""

    permission_required = 'rodatraden.add_profile'
    model = Profile
    form_class = ProfileForm
    template_name = 'rodatraden/profile/profile_create.html'
    success_message = 'Profilen skapades utan problem'
    success_url = reverse_lazy('profile-list')


class ProfileUpdate(LoginRequiredMixin, PermissionRequiredMixin,
        BSModalUpdateView):
    """Update view for profiles."""

    permission_required = 'rodatraden.change_profile'
    model = Profile
    form_class = ProfileForm
    template_name = 'rodatraden/profile/profile_update.html'
    success_message = 'Profilen uppdaterades utan problem'

    def get_success_url(self):
        # Return to last page
        return self.request.META['HTTP_REFERER']


class ProfileDelete(LoginRequiredMixin, PermissionRequiredMixin,
        BSModalDeleteView):
    """Delete view for profiles."""

    permission_required = 'rodatraden.delete_profile'
    model = Profile
    template_name = 'rodatraden/profile/profile_confirm_delete.html'
    success_message = 'Profilen togs bort utan problem'
    success_url = reverse_lazy('profile-list')

##############
# CATEGORIES #
##############

class CategoryList(ListView):
    """List view for categories."""

    model = Category
    template_name = 'rodatraden/category/category_list.html'


class CategoryDetail(DetailView):
    """Detail view for categories."""

    model = Category
    template_name = 'rodatraden/category/category_detail.html'

    def get_context_data(self, **kwargs):
        """Extend get_context_data to return the connections between categories
        and course"""

        context = super().get_context_data(**kwargs)
        context['courses'] = CategoryCourse.objects.filter(
            category=context['category']
        )

        return context


class CategoryCreate(LoginRequiredMixin, PermissionRequiredMixin,
        BSModalCreateView):
    """Creation view for categories."""

    permission_required = 'rodatraden.add_category'
    model = Category
    form_class = CategoryForm
    template_name = 'rodatraden/category/category_create.html'
    success_message = 'Kategorin skapades utan problem'
    success_url = reverse_lazy('category-list')


class CategoryUpdate(LoginRequiredMixin, PermissionRequiredMixin,
        BSModalUpdateView):
    """Update view for categories."""

    permission_required = 'rodatraden.change_category'
    model = Category
    form_class = CategoryForm
    template_name = 'rodatraden/category/category_update.html'
    success_message = 'Kategori uppdaterades utan problem'

    def get_success_url(self):
        # Return to last page
        return self.request.META['HTTP_REFERER']


class CategoryDelete(LoginRequiredMixin, PermissionRequiredMixin,
        BSModalDeleteView):
    """Deletion view for categories"""

    permission_required = 'rodatraden.delete_category'
    model = Category
    template_name = 'rodatraden/category/category_confirm_delete.html'
    success_message = 'Kategori togs bort utan problem'
    success_url = reverse_lazy('category-list')

###################
# PRIVATE COURSES #
###################

class PrivateCourseList(CorrectUserPermissionMixin, LoginRequiredMixin,
        SingleTableView):
    """List view for private courses."""

    model = PrivateCourse
    table_class = PrivateCourseTable
    template_name = 'rodatraden/privatecourse/privatecourse_list.html'

    def get_queryset(self, *args, **kwargs):
        """Extend get_queryset to filter only private courses for user."""

        self.qs = super().get_queryset()

        return self.qs.filter(user__username=self.kwargs['username'])


class PrivateCourseDetail(CorrectUserPermissionMixin, LoginRequiredMixin,
        DetailView):
    """Detail view for private courses."""

    model = PrivateCourse
    template_name = 'rodatraden/privatecourse/privatecourse_detail.html'


class PrivateCourseUpdate(CorrectUserPermissionMixin, LoginRequiredMixin,
        BSModalUpdateView):
    """Update view for private courses"""

    model = PrivateCourse
    form_class = PrivateCourseForm
    template_name = 'rodatraden/privatecourse/privatecourse_update.html'
    success_message = 'Ändringarna i blockschemat sparades'

    def get_success_url(self):
        # Return to last page
        return self.request.META['HTTP_REFERER']


class PrivateCourseCreate(CorrectUserPermissionMixin, LoginRequiredMixin,
        BSModalCreateView):
    """Create view for private courses."""

    model = PrivateCourse
    form_class = PrivateCourseForm
    template_name = 'rodatraden/privatecourse/privatecourse_create.html'
    success_message = 'Egen kurs skapad'

    def get_success_url(self, **kwargs):
        return reverse_lazy('privatecourse-list',
                kwargs={'username':self.kwargs['username']})


class PrivateCourseDelete(CorrectUserPermissionMixin, LoginRequiredMixin,
        BSModalDeleteView):
    """Delete view for private courses."""

    model = PrivateCourse
    template_name = 'rodatraden/privatecourse/privatecourse_confirm_delete.html'
    success_message = 'Egen kurs raderat'

    def get_success_url(self, **kwargs):
        return reverse_lazy('privatecourse-list',
                kwargs={'username':self.kwargs['username']})

##########
# BLOCKS #
##########

class BlockList(CorrectUserPermissionMixin, LoginRequiredMixin, ListView):
    """List view for blocks."""

    model = Block
    template_name = 'rodatraden/block/block_list.html'

    def get_queryset(self, *args, **kwargs):
        self.qs = super().get_queryset()
        # Filter the blocks for the given user
        return self.qs.filter(user__username=self.kwargs['username'])


class BlockUpdate(CorrectUserPermissionMixin, LoginRequiredMixin,
        BSModalUpdateView):
    """Update view for blocks."""

    model = Block
    form_class = BlockForm
    template_name = 'rodatraden/block/block_update.html'
    success_message = 'Ändringarna i blockschemat sparades'

    def get_success_url(self):
        # Return to last page
        return self.request.META['HTTP_REFERER']


class BlockCreate(CorrectUserPermissionMixin, LoginRequiredMixin,
        BSModalCreateView):
    """Create view for blocks."""

    model = Block
    form_class = BlockForm
    template_name = 'rodatraden/block/block_create.html'
    success_message = 'Blockschema skapat'

    def form_valid(self, form):
        """Extend form_valid to add current user to block."""

        instance = form.save(commit=False)
        instance.user = self.request.user

        return super(BlockCreate, self).form_valid(form)

    def get_success_url(self, **kwargs):
        return reverse_lazy('block-list',
                kwargs={'username':self.kwargs['username']})


class BlockRemove(CorrectUserPermissionMixin, LoginRequiredMixin,
        BSModalDeleteView):
    """Remove view for blocks."""

    model = Block
    template_name = 'rodatraden/block/block_confirm_delete.html'
    success_message = 'Blockschema raderat'

    def get_success_url(self, **kwargs):
        return reverse_lazy('block-list',
                kwargs={'username':self.kwargs['username']})


def block_detail(request, username, slug):
    """Detail view for block."""

    block = get_object_or_404(Block, user__username=username, slug=slug)

    # If the block is not private, show without authentication
    if block.private:
        if not request.user.is_authenticated:
            return redirect(reverse('cas_ng_login'))
        elif request.user.username != block.user.username:
            return redirect(reverse('index'))

    # Ajax request for jquery when rendering block with javascript
    if request.is_ajax():
        # Get courses and private courses
        courses = [ob.as_json() for ob in block.courseoccasions.all()]
        privcourses = [ob.as_json() for ob in block.privatecourses.all()]

        return JsonResponse({'course_occasions': courses, 'private_courses':
            privcourses, 'start_year': block.start_year})

    # POST request to upload and download ISP
    elif request.method == 'POST':

        excel_file = request.FILES["excel_file"]

        # Check the file size and name length
        if (validator.file_validation(excel_file) != 0):
            return render(request, 'rodatraden/block/block_detail.html')

        # Create new list with block courses and credits, sort by course name
        block_courses = []
        for co in block.courseoccasions.all():
            block_courses.append([str(co.course.title), str(co.course.ects)])
        block_courses.sort(key = itemgetter(0))

        # regex is used later when matching course names. With this, only
        # alphabetic (swedish) characters and numbers will be used when comparing
        # course names.
        regex = re.compile('[^åäöÅÄÖa-zA-Z0-9]')

        wb = openpyxl.load_workbook(excel_file, read_only=False, keep_vba=True)

        # loop through each sheet in excel
        for sheet in wb:

            # Specific sheet titles that contains courses
            if ((sheet.title == 'Profilkurser') |
                (sheet.title == 'Basterminer') |
                (sheet.title == 'Övriga kurser') |
                (sheet.title == 'Allmänna ingenjörskurser')):

                # loop through each course in excel, where:
                #   course[0]: Checkbox
                #   course[1]: Course name
                #   course[6]: Course credit
                for course in sheet.iter_rows(min_row=7, max_row=300,
                min_col=1, max_col=7):

                    # If there are no more courses on current sheet,
                    # go to next sheet
                    if not (course[1].value):
                        break

                    # loop through each course in the block list, where:
                    # index: Index of current element in ‘block_courses’
                    # item[0]: course name
                    # item[1]: course credit
                    for index, item in enumerate(block_courses):

                        # If a match of course name (case insensitive, disregard
                        # all whitespaces) and credit can be found, tick
                        # checkbox in excel and modify block list
                        if (regex.sub('', str(item[0]).lower())
                        == regex.sub('', str(course[1].value).lower())
                        and course[6].value
                        and math.isclose(float(item[1]),
                        float(course[6].value), abs_tol=0.1)):
                            course[0].value='x'
                            course[0].alignment = Alignment(horizontal
                            = "center", vertical = "bottom")
                            block_courses.pop(index)
                            break

        # Add all private courses to list
        # and add the list to a new sheet in excel
        for co in block.privatecourses.all():
            block_courses.append([str(co.title), str(co.ects)])

        if block_courses:
            count = 4
            for sheet in wb:
                if sheet.title == "Ej inlagda kurser":
                    wb.remove_sheet(sheet)
            ws = wb.create_sheet(title="Ej inlagda kurser")
            ws["A1"].value=("OBS! Lägg in dessa kurser manuellt under rätt "
            "flik. Töm denna kurslista innan du genererar sammanfattningen")
            ws["B3"].value='Kursnamn'
            ws["B3"].font=Font(bold=True)
            for item in block_courses:
                coursename_pos = 'B' + str(count)
                coursecredit_pos = 'C' + str(count)
                ws[coursename_pos].value = item[0]
                ws[coursecredit_pos].value = item[1]
                count = count + 1

        # save file
        id = get_random_string(length=15)
        path_to_file = settings.MEDIA_ROOT + '/excel/' + id + '.xlsm'
        wb.save(path_to_file)

        return serve(request, os.path.basename(path_to_file),
        os.path.dirname(path_to_file))


    else:
        # Get all categories for the block exam and build dict with those as
        # keys
        categories = CategoryExam.objects.filter(exam=block.exam)
        category_sum = dict.fromkeys([category.category.title for category in
            categories], 0)
        # Get sum from block
        block.total_category_ects(category_sum)

        context = {
                'this_block': block,
                'current_path': request.get_full_path,
                'categories': categories,
                'categories_sum': category_sum,
                'total_ects': block.total_course_ects(),
                'logged_in': (request.user.is_authenticated and
                request.user.username == block.user.username) or
                (request.user.is_staff and not block.private)
                }

        return render(request, 'rodatraden/block/block_detail.html', context)

@login_required
def block_course_list(request, username, slug):
    """Custom list view with all courses that can be added a specific year and
    time period range."""

    # Get year and start from get request
    year = int(request.GET.get('year', ''))
    start = int(request.GET.get('start', ''))

    # Get block id so we don't show courses already in block
    block = get_object_or_404(Block, user__username=username, slug=slug)

    # Only blocks made by same user
    if not request.user.is_staff:
        if (block.user.username != request.user.username):
            return redirect(reverse('index'))

    # Sort by year, start, if not in block and order by title
    courseoccasions = CourseOccasion.objects.filter(academic_year__year=year,
            time_period__week__gte=start,
            time_period__week__lt=start+10).exclude(
            block__id=block.id).order_by('course__title')

    # All courses defined by user
    privatecourses = PrivateCourse.objects.filter(user=request.user,
            start__gte=start, start__lt=start+10).exclude(
                    block__id=block.id).order_by('title')

    context = {
            'b_slug': slug,
            'username': username,
            'courseoccasions': courseoccasions,
            'privatecourses': privatecourses,
            }

    return render(request, 'rodatraden/block/block_course_list.html', context)


@login_required
def add_course_to_block(request, username, b_slug):
    """Add a course to block from GET info."""

    # Get slug from request
    c_slug = request.GET.get('slug', '')
    is_priv = request.GET.get('private', '')

    # Get block
    block = get_object_or_404(Block, user__username=username, slug=b_slug)

    # Only blocks made by same user
    if not request.user.is_staff:
        if (block.user.username != request.user.username):
            return redirect(reverse('index'))

    if (is_priv == '1'):
        privatecourse = get_object_or_404(PrivateCourse, slug=c_slug)
        # Add
        block.privatecourses.add(privatecourse)
    else:
        course = get_object_or_404(CourseOccasion, slug=c_slug)
        # Add
        block.courseoccasions.add(course)

    return redirect('block-detail', username=username, slug=b_slug)


@login_required
def remove_course_from_block(request, username, b_slug):
    """Remove a course from a block."""

    # Get slug from request
    c_slug = request.GET.get('slug', '')
    is_priv = request.GET.get('private', '')

    # Get block and courseoccasion
    block = get_object_or_404(Block, user__username=username, slug=b_slug)

    # Only blocks made by same user
    if not request.user.is_staff:
        if (block.user.username != request.user.username):
            return redirect(reverse('index'))

    if (is_priv == '1'):
        privatecourse = get_object_or_404(PrivateCourse, slug=c_slug)
        # Add
        block.privatecourses.remove(privatecourse)
    else:
        course = get_object_or_404(CourseOccasion, slug=c_slug)
        # Add
        block.courseoccasions.remove(course)

    return redirect('block-detail', username=username, slug=b_slug)
