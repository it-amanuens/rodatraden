import datetime

from django import forms

from .models import (
    Course, Block, CourseOccasion, CourseScheduleSegment, Category,
    CategoryCourse, Prerequisite, Profile,
    AcademicYear, CategoryExam, Exam, Report, PrivateCourse,
    PrivateCourseCategory, User
)
from .rodatraden_modules.mixins import (
    CategoryFormMixin, PrerequisiteFormMixin, SaveAndImportBlockMixin
)
from rodatraden.rodatraden_modules.forms import StartWeekField

from bootstrap_modal_forms.forms import BSModalForm, BSModalModelForm


class UpdateUserForm(forms.ModelForm):
    """Form for updating user"""

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email']


class DeleteUserForm(forms.Form):
    """Form for deleting user"""

    email = forms.EmailField()


class CourseForm(CategoryFormMixin, PrerequisiteFormMixin, BSModalModelForm):
    """Form for Courses."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Get all associations between course and category (only if editing existing)
        if self.instance.pk:
            categories = CategoryCourse.objects.filter(
                course=self.instance
            )
            prerequisites = Prerequisite.objects.filter(
                course=self.instance
            )
        else:
            categories = CategoryCourse.objects.none()
            prerequisites = Prerequisite.objects.none()

        # Build the fields from these categories
        self._build_category_fields(categories)

        # Setup data needed to render the prerequisite fields.
        self._setup_prerequisites(prerequisites)

        # Add class to tracks and prereq for nice css
        self.fields['tracks'].widget.attrs.update({'class' :
            'select2-mult-choice'})
        self.fields['recommended'].widget.attrs.update({'class' :
            'select2-mult-choice'})
        self.fields['ects'].widget.attrs.update({'min':0})

        # Add which tracks label this this course as a core course.
        self.fields['core_belonging'].widget.attrs.update({'class' :
            'select2-mult-choice'})

    class Meta:
        model = Course
        exclude = ['note', 'categories', 'slug', 'created_at', 'updated_at']


class ExamForm(CategoryFormMixin, BSModalModelForm):
    """Form for Exams."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Get all associations between exam and category (only if editing existing)
        if self.instance.pk:
            categories = CategoryExam.objects.filter(
                exam=self.instance
            )
        else:
            categories = CategoryExam.objects.none()

        # Build the fields from these categories
        self._build_category_fields(categories)

        self.fields['ects'].widget.attrs.update({'min':0})

    class Meta:
        model = Exam
        exclude = ['note']


class PrivateCourseForm(CategoryFormMixin, BSModalModelForm):
    """Form for private courses."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Get all associations between course and category (only if editing existing)
        if self.instance.pk:
            categories = PrivateCourseCategory.objects.filter(
                private_course=self.instance
            )
        else:
            categories = PrivateCourseCategory.objects.none()

        # Build the fields from these categories
        self._build_category_fields(categories)

        # Get choices given from academic years
        year_choices = [(x.year, x.title) for x in AcademicYear.objects.all().order_by('year')]
        self.fields['year'] = forms.ChoiceField(choices=year_choices,
                initial=datetime.datetime.now().year)
        # Always save to current user
        self.fields['user'].queryset = User.objects.filter(
            username=self.request.user.username
        )
        self.fields['user'].initial = self.request.user

        self.fields['start'] = StartWeekField()

        self.fields['year'].label = 'Läsår'
        self.fields['start'].label = 'Start'
        self.fields['weeks'].label = 'Längd i veckor'



    class Meta:
        model = PrivateCourse
        fields = ['title', 'ects', 'year', 'start', 'weeks', 'note', 'user']
        # Hide the user input
        widgets = {
            'note': forms.Textarea(attrs={'rows': 5}),
            'user': forms.HiddenInput()
        }


class ProfileForm(BSModalModelForm):
    """Form for profiles."""
    
    class Meta:
        model = Profile
        exclude = ['title_eng', 'description_eng']


class CourseScheduleSegmentForm(BSModalModelForm):
    """Form for course schedule segments."""

    blacklisted_years = forms.MultipleChoiceField(
        choices=[],
        required=False,
        label='Undantagna år',
        help_text='Välj år då kursen inte ges i detta segment',
        widget=forms.SelectMultiple(attrs={'class': 'select2-mult-choice'}),
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Pre-fill course from query param when creating
        if 'course' in self.request.GET:
            self.initial['course'] = self.request.GET['course']

        # Year choices from AcademicYear (str keys for ChoiceField compat)
        year_choices = [
            (str(x.year), x.title)
            for x in AcademicYear.objects.all().order_by('year')
        ]
        self.fields['start_year'] = forms.ChoiceField(
            choices=year_choices,
            label='Startår',
        )
        self.fields['end_year'] = forms.ChoiceField(
            choices=[('', '— Inget slutår —')] + year_choices,
            required=False,
            label='Slutår',
        )

        # Blacklisted years: same year choices as multi-select
        self.fields['blacklisted_years'].choices = year_choices

        # Pre-fill for existing instances
        if self.instance.pk:
            self.initial['start_year'] = str(self.instance.start_year)
            if self.instance.end_year:
                self.initial['end_year'] = str(self.instance.end_year)
            if self.instance.blacklisted_years:
                self.initial['blacklisted_years'] = [
                    str(y) for y in self.instance.blacklisted_years
                ]

    def clean_start_year(self):
        return int(self.cleaned_data['start_year'])

    def clean_end_year(self):
        val = self.cleaned_data['end_year']
        return int(val) if val else None

    def clean_blacklisted_years(self):
        return [int(y) for y in self.cleaned_data.get('blacklisted_years', [])]

    class Meta:
        model = CourseScheduleSegment
        fields = ['course', 'time_period', 'frequency', 'start_year',
                  'end_year', 'weeks', 'blacklisted_years']
        widgets = {
            'course': forms.HiddenInput(),
        }


class CourseOccasionForm(BSModalModelForm):
    """Form for course occasions."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # If a courseoccasion is copied
        if 'courseocc' in self.request.GET:
            courseocc_cpy = CourseOccasion.objects.get(slug=self.request.GET['courseocc'])
            # This hard-coding might be avoidable. Not sure...
            self.fields['course'].initial = courseocc_cpy.course
            self.fields['academic_year'].initial = courseocc_cpy.academic_year
            self.fields['time_period'].initial = courseocc_cpy.time_period
            self.fields['weeks'].initial = courseocc_cpy.weeks
            self.fields['note'].initial = courseocc_cpy.note
            self.fields['contact_name'].initial = courseocc_cpy.contact_name
            self.fields['contact_email'].initial = courseocc_cpy.contact_email
            self.fields['official'].initial = courseocc_cpy.official
        
        self.fields['course'].widget.attrs['class'] = \
            'course-list-filter-courseocc-create'

    class Meta:
        model = CourseOccasion
        fields = ['course', 'academic_year', 'time_period', 'weeks',
        'note', 'contact_name', 'contact_email', 'official']


class BlockForm(SaveAndImportBlockMixin, BSModalModelForm):
    """Form for blocks."""

    import_from = forms.ModelMultipleChoiceField(queryset=None, required=False,
            label="Importera från blockschema(n)")
    # Add class to import field to get a user-friendly drop-down list.
    import_from.widget.attrs.update({'class': 'select2-mult-choice'})

    # Specify the field order so that the import field isn't at the bottom. The
    # fields not specified here will be appended in the order they are defined
    # in the model.
    field_order = ['title', 'description', 'start_year', 'import_from']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Get choices given from academic years and sort
        years = [(x.year, x.year) for x in AcademicYear.objects.all()]
        years.sort()
        
        # Use can import form all public blocks published in a track and all
        # their own blocks.
        public_blocks = Block.objects.filter(
            private=False
        ).exclude(
            track__isnull=True
        )
        private_blocks = Block.objects.filter(user=self.request.user)
        all_blocks = public_blocks | private_blocks
        self.fields['import_from'].queryset = all_blocks.order_by('title')

        self.fields['start_year'] = forms.ChoiceField(choices=years,
                initial=datetime.datetime.now().year)
        self.fields['track'].widget.attrs['class'] = 'block-track'

        # Non-staff can't add track blocks
        if not self.request.user.is_staff:
            del self.fields['track']
            

        # If the block is being created, set the default exam as latest
        # (probably only TF)
        if not self.instance.pk:
            self.fields['exam'].initial = Exam.objects.first()
            

    class Meta:
        model = Block
        exclude = ['courseoccasions', 'note', 'privatecourses', 'user']


class CategoryForm(BSModalModelForm):
    """Form for categories."""

    class Meta:
        model = Category
        exclude = ['title_eng', 'description_eng']


class ReportForm(BSModalModelForm):
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
