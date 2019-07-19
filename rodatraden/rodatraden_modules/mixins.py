from rodatraden.models import Category, CourseOccasion
from .forms import CategoryEctsField
from decimal import Decimal

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
        if not self.request.is_ajax():
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


class SaveAndImportBlockMixin(object):
    """Save a block and import courses from a selected block.
    
    Takes the year difference between the two blocks and adjusts for the new
    block.
    """

    def save(self, commit=True):
        """Overwrite save to save not only the block, but also to insert the
        courseoccasions.

        Simply ignores the insertion if something goes wrong.
        """

        # This if-case is due to BSModalForms. See issue #14 of the official
        # respository. 
        # https://github.com/trco/django-bootstrap-modal-forms/issues/14
        if not self.request.is_ajax():
            instance = super().save(commit=commit)

            # Skip if field not set
            if 'import_from' in self.fields:
                # Skip if no import block
                if (self.cleaned_data['import_from']):

                    # Get all courseoccasions from selected block
                    courseoccasions = self.cleaned_data[
                        'import_from'
                    ].courseoccasions.all().order_by(
                        'academic_year__year', 'time_period__week'
                    )
                    # Difference in years from new block to the import block
                    year_diff = int(
                        self.cleaned_data['start_year']
                    ) - courseoccasions.first().academic_year.year

                    # Main insertion loop
                    for courseocc in courseoccasions:
                        # Get the new courseoccasion
                        # Just skip if something bad happens
                        try:
                            new_courseocc = CourseOccasion.objects.get(
                                course=courseocc.course,
                                academic_year__year=(
                                    courseocc.academic_year.year+year_diff
                                ),
                                time_period__week=courseocc.time_period.week
                            )
                        except:
                            pass

                        try:
                            instance.courseoccasions.add(new_courseocc)
                        except:
                            pass

        else:
            instance = super().save(commit=False)

        return instance
