import datetime
from django.core.mail import send_mail, BadHeaderError
from .models import (
        Course, Block, CourseOccasion, Category, Track, CategoryCourse, Profile,
        AcademicYear, CategoryExam, Exam, Report, PrivateCourse,
        PrivateCourseCategory, User
        )
from bootstrap_modal_forms.forms import BSModalForm
from django import forms
from django.forms import formset_factory, MultiWidget
from decimal import Decimal

import pdb


class CategoryEctsWidget(MultiWidget):
    """
    Widget to work in tandem with CategoryEctsField.
    Defines one select field next to a numberinput for category input in forms
    """

    def __init__(self, attrs=None, step=0.1, minimum=0, required=False):
        _widgets = (
            forms.Select(attrs={'class':'form-control cat-select float-left'}),
            forms.NumberInput(
                attrs={'class':'form-control cat-ects float-right', 
                    'step': step, 'min': minimum}
                )
        )

        super(CategoryEctsWidget, self).__init__(_widgets, attrs)

    def decompress(self, value):
        if value:
            return [value['category'], value['ects']]
        return ['', '']


class CategoryEctsField(forms.MultiValueField):
    """
    Field for category input in forms.
    Choicefield for all the categories and a decimalfield for corresponding ects
    """
    widget = CategoryEctsWidget()

    def __init__(self, queryset=None, required=False, *args, **kwargs):
        fields = (
          forms.ModelChoiceField(queryset=queryset),
          forms.DecimalField(),
        )
        super(CategoryEctsField, self).__init__(fields, *args, **kwargs,
                require_all_fields=False)

        # Use the auto-generated widget.choices by the ModelChoiceField
        self.widget.widgets[0].choices = self.fields[0].widget.choices

    def clean(self, value):
        """
        Cleans the data to find errors in user input
        """
        if value[0]:
            if not Category.objects.filter(id=int(value[0])).exists():
                msg = "Kategorin finns inte"
                raise forms.ValidationError(msg)
            try:
                Decimal(value[1])
            except:
                msg = "Siffran är i fel format"
                raise forms.ValidationError(msg)

        return value

    def compress(self, data_list):
        """
        Compress the input to string
        """
        data_list[0] = "data_list[0].id"
        data_list[1] = str(data_list[1])
        return "-".join(data_list)


class SaveWithCategoryMixin(object):
    """
    Mixin which passes or saves object based on request type. For usage in
    modals.
    Assumes that the categories are ordered with names 'category_x_0' and
    'category_x_1', where x is the specific category with ects. Index 0
    corresponds to category id and 1 to the ects.
    This order is automatic if categoryectsfield is used.
    """
    def save(self, commit=True):
        # The if case is due to bootstrap modal forms, which performs two posts
        # due to reasons
        if not self.request.is_ajax():
            instance = super(SaveWithCategoryMixin, self).save(commit=commit)

            # Special code to capture and save categories
            # Pick all fields that starts with category_
            categories = {k:v for k,v in self.request.POST.items() if
                    k.startswith('category_')}

            # Removes all categories (easier to just reinsert all the
            # connections than to make smart logic)
            try:
                instance.categories.clear()
            except:
                pass

            for key, val in categories.items():
                # Skip if the key corresponds to ects or no category is chosen
                if (key[-1] == '1' or val==''):
                    continue

                cat_id = int(val)
                # Get ects key
                ects_key = key
                ects_key = ects_key[:-1] + '1'

                # Retrieve category and add to course. Ignore if fails
                try:
                    cat_ects = Decimal(categories[ects_key])
                    cat = Category.objects.get(id=cat_id)
                    instance.categories.add(cat,
                            through_defaults={'ects':cat_ects})
                except:
                    pass

        else:
            instance = super(SaveWithCategoryMixin, self).save(commit=False)
        return instance


class CourseForm(SaveWithCategoryMixin, BSModalForm):
    """
    Form for creating and updating courses
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Add class to tracks and prereq for nice css
        self.fields['tracks'].widget.attrs.update({'class' :
            'select2-mult-choice'})
        self.fields['prerequisites'].widget.attrs.update({'class' :
            'select2-mult-choice'})
        self.fields['recommended'].widget.attrs.update({'class' :
            'select2-mult-choice'})
        self.fields['ects'].widget.attrs.update({'min':0})

        # Get all associations between course and category
        categories = CategoryCourse.objects.filter (
            course = self.instance
        )

        # Create fields for every category and pre-fill
        for i in range(0, len(categories) + 1):
            field_name = 'category_%s' % (i,)
            # Set new fields
            self.fields[field_name] = CategoryEctsField(
                    queryset=Category.objects.all()
            )
            try:
                self.initial[field_name] = {
                        'category': categories[i].category.id,
                        'ects': categories[i].ects}
            except IndexError:
                self.initial[field_name] = ''

    def get_category_fields(self):
        """
        Yields the category fields
        """
        for field_name in self.fields:
            if field_name.startswith('category_'):
                yield self[field_name]

    class Meta:
        model = Course
        fields = ['title', 'description', 'code', 'ects', 'approved',
        'department', 'level', 'homepage_url', 'evaluation_url', 'closed',
        'prerequisites', 'tracks', 'recommended']


class ExamForm(SaveWithCategoryMixin, BSModalForm):
    """
    Form for creating and updating exams
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['ects'].widget.attrs.update({'min':0})

        # Get all associations between course and category
        categories = CategoryExam.objects.filter (
            exam = self.instance
        )

        # Create fields for every category and pre-fill
        for i in range(0, len(categories) + 1):
            field_name = 'category_%s' % (i,)
            # Set new fields
            self.fields[field_name] = CategoryEctsField(
                    queryset=Category.objects.all()
            )
            try:
                self.initial[field_name] = {
                        'category': categories[i].category.id,
                        'ects': categories[i].ects}
            except IndexError:
                self.initial[field_name] = ''

    def get_category_fields(self):
        """
        Yields the category fields
        """
        for field_name in self.fields:
            if field_name.startswith('category_'):
                yield self[field_name]

    class Meta:
        model = Exam
        exclude = ['note']
        

class PrivateCourseForm(SaveWithCategoryMixin, BSModalForm):

    def __init__(self, *args, **kwargs):
        super(PrivateCourseForm, self).__init__(*args, **kwargs)
        # Get choices given from academic years
        years = [(x.year, x.year) for x in AcademicYear.objects.all()]
        self.fields['year'] = forms.ChoiceField(choices=years,
                initial=datetime.datetime.now().year)
        # Always save to current user
        self.fields['user'].queryset = User.objects.filter(username=self.request.user.username)
        self.fields['user'].initial = self.request.user

        # Get all associations between course and category
        categories = PrivateCourseCategory.objects.filter (
            private_course = self.instance
        )

        # Create fields for every category and pre-fill
        for i in range(0, len(categories) + 1):
            field_name = 'category_%s' % (i,)
            # Set new fields
            self.fields[field_name] = CategoryEctsField(
                    queryset=Category.objects.all()
            )
            try:
                self.initial[field_name] = {
                        'category': categories[i].category.id,
                        'ects': categories[i].ects}
            except IndexError:
                self.initial[field_name] = ''

    def get_category_fields(self):
        """
        Yields the category fields
        """
        for field_name in self.fields:
            if field_name.startswith('category_'):
                yield self[field_name]

    class Meta:
        model = PrivateCourse
        fields = ['title', 'ects', 'note', 'year', 'start', 'weeks', 'user']
        widgets = {'user': forms.HiddenInput()}


class ProfileForm(BSModalForm):
    
    class Meta:
        model = Profile
        exclude = ['title_eng', 'description_eng']


class CourseOccasionForm(BSModalForm):

    class Meta:
        model = CourseOccasion
        fields = ['course', 'academic_year', 'time_period', 'weeks',
        'contact_name', 'contact_email', 'official']


class SaveAndImportBlockMixin(object):
    """
    Saves a new block and imports courseoccasions from a given public block
    within a track.
    """

    def save(self, commit=True):
        # The if case is due to bootstrap modal forms, which performs two posts
        # due to reasons
        if not self.request.is_ajax():
            instance = super(SaveAndImportBlockMixin, self).save(commit=commit)

            # Skip if field not set
            if 'import_from' in self.fields:
                # Skip if no import block or if the block already exists
                if (self.cleaned_data['import_from']):
                    # Get all of the courseoccasions from import block and order by year
                    # and start
                    courseoccasions = self.cleaned_data['import_from'].courseoccasions.all().order_by('academic_year__year', 'time_period__week')
                    # Difference in years from new block to the import block
                    year_diff = int(self.cleaned_data['start_year']) - courseoccasions.first().academic_year.year

                    # Main insertion loop
                    for courseocc in courseoccasions:
                        # Get the new courseoccasion
                        new_courseocc = CourseOccasion.objects.get(course=courseocc.course,
                                academic_year__year=courseocc.academic_year.year+year_diff,
                                time_period__week=courseocc.time_period.week)

                        # Just skip if something bad happens
                        if not new_courseocc:
                            pass
                        try:
                            instance.courseoccasions.add(new_courseocc)
                        except:
                            pass

        else:
            instance = super(SaveAndImportBlockMixin, self).save(commit=False)
        return instance


class BlockForm(SaveAndImportBlockMixin, BSModalForm):
    """
    Form for creating new blocks
    """
    import_from = forms.ModelChoiceField(queryset=None, required=False,
            label="Importera från blockschema")

    def __init__(self, *args, **kwargs):
        super(BlockForm, self).__init__(*args, **kwargs)
        # Get choices given from academic years
        years = [(x.year, x.year) for x in AcademicYear.objects.all()]
        years.sort()
        self.fields['import_from'].queryset = Block.objects.filter(private=False).exclude(track__isnull=True) | Block.objects.filter(user=self.request.user)
        self.fields['start_year'] = forms.ChoiceField(choices=years,
                initial=datetime.datetime.now().year)
        self.fields['track'].widget.attrs['class'] = 'block-track'

        if not self.request.user.is_staff:
            del self.fields['track']

        # Ignore if the block already exists
        if self.instance.pk:
            del self.fields['import_from']

    class Meta:
        model = Block
        exclude = ['courseoccasions', 'note', 'privatecourses', 'user']


class CategoryForm(BSModalForm):
    """
    Form for creating new categories
    """

    class Meta:
        model = Category
        exclude = ['title_eng', 'description_eng']


class SaveAndSendMailMixin(object):

    def save(self, commit=True):
        # The if case is due to bootstrap modal forms, which performs two posts
        # due to reasons
        if not self.request.is_ajax():
            instance = super(SaveAndSendMailMixin, self).save(commit=commit)

            subject = self.cleaned_data['subject']
            from_email = self.cleaned_data['from_email']
            message = self.cleaned_data['message']
            try:
                send_mail(subject, message, from_email, ['lucash@fastmail.com'])
            except BadHeaderError:
                pass
        else:
            instance = super(SaveAndSendMailMixin, self).save(commit=False)
        return instance


class ReportForm(SaveAndSendMailMixin, BSModalForm):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Ignore if the report already exists
        if self.instance.pk:
            # Disable some fields
            self.fields['from_email'].widget.attrs['readonly'] = True
            self.fields['subject'].widget.attrs['readonly'] = True
            self.fields['message'].widget.attrs['readonly'] = True

    class Meta:
        model = Report
        fields = ['from_email', 'subject', 'message']
