import datetime

from django import forms

from .models import (
    Course, Block, CourseOccasion, Category, CategoryCourse, Profile,
    AcademicYear, CategoryExam, Exam, Report, PrivateCourse,
    PrivateCourseCategory, User
)
from .rodatraden_modules.mixins import (
    CategoryFormMixin, SaveAndImportBlockMixin
)

from bootstrap_modal_forms.forms import BSModalForm


class CourseForm(CategoryFormMixin, BSModalForm):
    """Form for Courses."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Get all associations between course and category
        categories = CategoryCourse.objects.filter (
            course = self.instance
        )

        # Build the fields from these categories
        self._build_category_fields(categories)

        # Add class to tracks and prereq for nice css
        self.fields['tracks'].widget.attrs.update({'class' :
            'select2-mult-choice'})
        self.fields['prerequisites'].widget.attrs.update({'class' :
            'select2-mult-choice'})
        self.fields['recommended'].widget.attrs.update({'class' :
            'select2-mult-choice'})
        self.fields['ects'].widget.attrs.update({'min':0})

    class Meta:
        model = Course
        fields = ['title', 'description', 'code', 'ects', 'approved',
        'department', 'level', 'homepage_url', 'evaluation_url', 'closed',
        'prerequisites', 'tracks', 'recommended']


class ExamForm(CategoryFormMixin, BSModalForm):
    """Form for Exams."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Get all associations between course and category
        categories = CategoryExam.objects.filter (
            exam = self.instance
        )

        # Build the fields from these categories
        self._build_category_fields(categories)

        self.fields['ects'].widget.attrs.update({'min':0})

    class Meta:
        model = Exam
        exclude = ['note']
        

class PrivateCourseForm(CategoryFormMixin, BSModalForm):
    """Form for private courses."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Get all associations between course and category
        categories = PrivateCourseCategory.objects.filter (
            private_course = self.instance
        )

        # Build the fields from these categories
        self._build_category_fields(categories)

        # Get choices given from academic years
        years = [(x.year, x.year) for x in AcademicYear.objects.all()]
        self.fields['year'] = forms.ChoiceField(choices=years,
                initial=datetime.datetime.now().year)
        # Always save to current user
        self.fields['user'].queryset = User.objects.filter(
            username=self.request.user.username
        )
        self.fields['user'].initial = self.request.user

    class Meta:
        model = PrivateCourse
        fields = ['title', 'ects', 'note', 'year', 'start', 'weeks', 'user']
        # Hide the user input
        widgets = {'user': forms.HiddenInput()}


class ProfileForm(BSModalForm):
    """Form for profiles."""
    
    class Meta:
        model = Profile
        exclude = ['title_eng', 'description_eng']


class CourseOccasionForm(BSModalForm):
    """Form for course occasions."""

    class Meta:
        model = CourseOccasion
        fields = ['course', 'academic_year', 'time_period', 'weeks',
        'note', 'contact_name', 'contact_email', 'official']


class BlockForm(SaveAndImportBlockMixin, BSModalForm):
    """Form for blocks."""

    import_from = forms.ModelChoiceField(queryset=None, required=False,
            label="Importera från blockschema")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Get choices given from academic years and sort
        years = [(x.year, x.year) for x in AcademicYear.objects.all()]
        years.sort()
        
        # Use can import form all public blocks published in a track and all
        # their own blocks for copying.
        self.fields['import_from'].queryset = Block.objects.filter(
            private=False
        ).exclude(
            track__isnull=True
        ) | Block.objects.filter(user=self.request.user)

        self.fields['start_year'] = forms.ChoiceField(choices=years,
                initial=datetime.datetime.now().year)
        self.fields['track'].widget.attrs['class'] = 'block-track'

        # Non-staff can't add track blocks
        if not self.request.user.is_staff:
            del self.fields['track']

        # Ignore if the block already exists
        if self.instance.pk:
            del self.fields['import_from']

    class Meta:
        model = Block
        exclude = ['courseoccasions', 'note', 'privatecourses', 'user']


class CategoryForm(BSModalForm):
    """Form for categories."""

    class Meta:
        model = Category
        exclude = ['title_eng', 'description_eng']


class ReportForm(BSModalForm):
    """Form for reports."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Ignore if the report already exists
        if self.instance.pk:
            # Disable some fields
            self.fields['from_email'].widget.attrs['readonly'] = True
            self.fields['subject'].widget.attrs['readonly'] = True
            self.fields['message'].widget.attrs['readonly'] = True
        else:
            # Remove fields if creating new report
            del self.fields['fixed']
            del self.fields['note']

    class Meta:
        model = Report
        fields = ['from_email', 'subject', 'message', 'fixed', 'note']
