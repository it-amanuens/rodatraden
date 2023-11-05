from rodatraden.models import Block, Category, CourseOccasion
from .functions import import_course_occasions, is_ajax
from .forms import CategoryEctsField, PrerequisiteField
from decimal import Decimal
from django.shortcuts import redirect
from django.urls import reverse

class CategoryFormMixin(object):
    """Form mixin for creation and saving of CategoryEctsFields.

    Forms that have connections to categories with a given ects can use this
    mixin with BSModalForms to create fields for the form using
    _build_category_fields() and present them with get_category_fields().
    Overwrites the save() function to dynamically add the new categories to the
    through table.

    Usage:
    Call _build_category_fields within the model forms __init__ with the
    relevant rows in the through table to create fields with pre-filled
    categories and ects. In the form, loop over the result from
    get_category_fields and display the form fields.
    """

    def _build_category_fields(self, categories=None):
        """Build the fields for each given category and add one extra."""

        for i in range(0, len(categories) + 1):
            field_name = 'category_%s' % (i,)
            # Set new fields
            self.fields[field_name] = CategoryEctsField(
                queryset=Category.objects.all()
            )
            # Set initial values
            try:
                self.initial[field_name] = {
                        'category': categories[i].category.id,
                        'ects': categories[i].ects}
            except IndexError:
                self.initial[field_name] = ''

    def save(self, commit=True):
        """Overwrite the save function to save not only the model, but all the
        through connections to categories.

        Simply ignores the insertion if something goes wrong.
        """

        # This if-case is due to BSModalForms. See issue #14 of the official
        # respository. 
        # https://github.com/trco/django-bootstrap-modal-forms/issues/14
        if not is_ajax(self.request):
            instance = super().save(commit=commit)

            # Captures all fields that start with category_
            categories = {k:v for k,v in self.request.POST.items() if
                    k.startswith('category_')}

            # Removes all categories (easier to just reinsert all the
            # connections than to make smart logic). Should probably be
            # improved.
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
            instance = super().save(commit=False)

        return instance

    def get_category_fields(self):
        """Yield the category fields for usage in form templates."""
        for field_name in self.fields:
            if field_name.startswith('category_'):
                yield self[field_name]


class PrerequisiteFormMixin(object):
    """Mixin for prerequisites."""

    def _build_prerequisite_fields(self, prerequisites):
        """Build the fields for each given prerequisite and add one extra."""

        for i, prerequisite in enumerate(prerequisites):
            field_name = f'prerequisite_{i}'

            equivalent_prerequisites = prerequisite.equivalent_prerequisites.all()

            # Set new fields.
            self.fields[field_name] = PrerequisiteField(
                equivalent_courses=equivalent_prerequisites
            )

            # Set initial values using the primary keys of the courses.
            primary_keys = [course.pk for course in equivalent_prerequisites]
            self.initial[field_name] = primary_keys

            """ for j, course in enumerate(equivalent_prerequisites):
                # Set new fields
                self.fields[f'{field_name}_{j}'] = PrerequisiteField(
                    queryset=Course.objects.all()
                )

                # Set initial values
                self.initial[f'{field_name}_{j}'] = course """


    def get_prerequisite_fields(self):
        """Yield the prerequisite fields for usage in form templates."""
        for field_name in self.fields:
            if field_name.startswith('prerequisite_'):
                yield self[field_name]


class SaveAndImportBlockMixin(object):
    """Save a block and import courses from a selected block."""

    def save(self, commit=True):
        """Overwrite save to save not only the block, but also to insert the
        courseoccasions.

        Simply ignores the insertion if something goes wrong.
        """

        # This if-case is due to BSModalForms. See issue #14 of the official
        # respository. 
        # https://github.com/trco/django-bootstrap-modal-forms/issues/14
        if not is_ajax(self.request):
            block_schedule: Block = super().save(commit=commit)

            # Skip if field not set
            if not 'import_from' in self.fields:
                return block_schedule

            imported_schedules: list[Block] = self.cleaned_data['import_from']
            # Skip if no import block
            if not imported_schedules:
                return block_schedule
            
            start_year = self.cleaned_data['start_year']
            
            # Import all course occasions. Duplicates are removed later.
            new_course_occasions: list[CourseOccasion] = []
            for imported_schedule in imported_schedules:
                course_occasions_from_block = import_course_occasions(
                    start_year, imported_schedule
                )
                new_course_occasions.extend(course_occasions_from_block)

            # Remove duplicates. This is necessary since the same course
            # occasion can be in multiple blocks.
            new_course_occasions = list(set(new_course_occasions))

            for course_occasion in new_course_occasions:
                try:
                    block_schedule.courseoccasions.add(course_occasion)
                except:
                    pass

        else:
            block_schedule = super().save(commit=False)

        return block_schedule


class CorrectUserPermissionMixin:
    """Mixin to check if the current user is accessing only its own stuff.

    Allows staff users to access all information, regardless of username.
    """

    def dispatch(self, request, *args, **kwargs):
        # Ignore if not logged in
        if not request.user.is_authenticated:
            return super().dispatch(request, *args, **kwargs)
        # Allow only the current user access or staff users
        else:
            if (kwargs['username'] == request.user.username or
                request.user.is_staff):
                return super().dispatch(request, *args, **kwargs)
            else:
                return redirect(reverse("index"))
