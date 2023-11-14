from collections import defaultdict
from rodatraden.models import Block, Category, Course, CourseOccasion, Prerequisite
from .functions import import_course_occasions, is_ajax
from .forms import CategoryEctsField, PrerequisiteField
from decimal import Decimal
from django.shortcuts import redirect
from django.urls import reverse
from django.db.models import Manager

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

        # Common queryset for all fields.
        queryset = Category.objects.order_by('title')

        for i in range(0, len(categories) + 1):
            field_name = 'category_%s' % (i,)
            # Set new fields
            self.fields[field_name] = CategoryEctsField(
                queryset=queryset
            )
            # Set initial values
            try:
                self.initial[field_name] = {
                        'category': categories[i].category.id,
                        'ects': categories[i].ects}
            except IndexError:
                self.initial[field_name] = ''


    def get_category_fields(self):
        """Yield the category fields for usage in form templates."""
        for field_name in self.fields:
            if field_name.startswith('category_'):
                yield self[field_name]


    def save(self, commit=True):
        """Overwrite the save function to save not only the model, but all the
        through connections to categories.

        Simply ignores the insertion if something goes wrong.
        """

        # This if-case is due to BSModalForms. See issue #14 of the official
        # respository. 
        # https://github.com/trco/django-bootstrap-modal-forms/issues/14
        if not is_ajax(self.request):
            course = super().save(commit=commit)

            # Captures all fields that start with category_
            categories = {k:v for k,v in self.request.POST.items() if
                    k.startswith('category_')}

            # Removes all categories (easier to just reinsert all the
            # connections than to make smart logic). Should probably be
            # improved.
            try:
                course.categories.clear()
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
                    course.categories.add(cat,
                            through_defaults={'ects':cat_ects})
                except:
                    pass

        else:
            course = super().save(commit=False)

        return course


class PrerequisiteFormMixin(object):
    """Mixin for prerequisites."""

    def _setup_prerequisites(self, prerequisites: Manager[Prerequisite]):
        """Add the prerequisites to the form so that they can be later used when
        rendering the fields in the Django template. Also store the queryset
        for the prerequisite field so that it can be reused.
        """

        self.prerequisites = prerequisites
        self.prerequisite_queryset = Course.objects.order_by('title')


    def get_prerequisite_fields(self):
        """Yield the prerequisite fields for usage in form templates.
        
        There is no reason to bind the fields to the form since they are parsed
        manually anyways in the overriden save() method. Therefore we only
        render the fields.
        """

        # This is only to attatch type hints to the prerequisites.
        prerequisites: Manager[Prerequisite] = self.prerequisites

        for i, prerequisite in enumerate(prerequisites):
            field_name = f'prerequisite_{i}'

            courses: Manager[Course] = (
                prerequisite.equivalent_prerequisites.all())

            # The primary keys are used as field values. That is the behavior
            # when using 'self.initial[field_name] = ...' to set the values if
            # the field was bound to the form.
            primary_keys = [course.pk for course in courses]

            field = PrerequisiteField(queryset=self.prerequisite_queryset,
                                      equivalent_course_count=len(courses))
            yield field.widget.render(name=field_name, value=primary_keys)

    
    def get_default_prerequisite_field(self):
        """Return a default prerequisite field to be used in an HTML template
        for cloning more fields."""

        # Use widget.render() to get the HTML instead of attaching the field to
        # self.fields. This is because the field is not used in the form, but
        # only in the template.
        # The name 'prerequisite_0' will turn into 'prerequisite_0_0' due to
        # the form having automatic id generation.
        field = PrerequisiteField(queryset=self.prerequisite_queryset)
        return field.widget.render(name='prerequisite_0', value=None)


    def save(self, commit=True):
        """Overwrite save to store the prerequisites.
        
        Since the prerequisite field is a bit custom and not stored directly
        to the model, this save logic renders the compress method of the
        prerequisite field unused.
        """

        # This if-case is due to BSModalForms. See issue #14 of the official
        # respository. 
        # https://github.com/trco/django-bootstrap-modal-forms/issues/14
        if not is_ajax(self.request):
            course_instance: Course = super().save(commit=commit)

            # Removes all prerequisites. This is a dirty but simple solution.
            old_prerequisites: Manager[Prerequisite] = (
                course_instance.prerequisite_set.all())
            old_prerequisites.delete()

            # The defaultdict allows for appending without checking if the key
            # exists since an empty list is created if the key doesn't exist.
            courses_grouped_by_prerequisite = defaultdict(list[Course])

            # Form POST data is a dictionary mapping field names to values.
            form_data: dict[str, str] = self.request.POST

            # Iterate over all fields.
            for name, course_id in form_data.items():
                # Ignore fields that aren't prerequisites.
                if not name.startswith('prerequisite_'):
                    continue

                # The field name has the format
                # 'prerequisite_{prerequisite index}_{course index}'.
                [_, prerequisite_index, _] = name.split('_')

                # Ignore fields with empty values.
                if course_id == '':
                    continue
                
                # Append the course to group the courses by prerequisite.
                courses_grouped_by_prerequisite[prerequisite_index].append(
                    Course.objects.get(pk=course_id)
                )

            # Create new prerequisites.
            for courses in courses_grouped_by_prerequisite.values():
                prerequisite: Prerequisite = (
                    course_instance.prerequisite_set.create())
                # Need to save the prerequisite before adding the courses
                # since the courses are added through a many-to-many field.
                prerequisite.save()

                for equivalent_course in courses:
                    prerequisite.equivalent_prerequisites.add(equivalent_course)
                
                prerequisite.save()

        else:
            course_instance = super().save(commit=False)
        
        return course_instance


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
