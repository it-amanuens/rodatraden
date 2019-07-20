from django import forms
from rodatraden.models import Category
from decimal import Decimal

class CategoryEctsWidget(forms.MultiWidget):
    """Widget to work in tandem with CategoryEctsField.

    Contains two fields, one select field and one input field. The point is to
    have a widget where the user can choose a category and the amount of points
    the course/exam/private course is associated with.
    """

    def __init__(self, attrs=None, step=0.1, minimum=0, required=False):
        """Extend the init class of multiwidget to initialize our own inputs.

        Keyword arguments:
        step -- Step size for number input
        minimum -- minimum value for number input
        """

        # Define the widgets and give them classes
        _widgets = (
            forms.Select(attrs={'class':'form-control cat-select float-left'}),
            forms.NumberInput(
                attrs={'class':'form-control cat-ects float-right', 
                    'step': step, 'min': minimum}
            )
        )

        super().__init__(_widgets, attrs)

    def decompress(self, value):
        """Decompresses data from database.

        Keyword arguments:
        value -- 2 dict containing input values category id and num of ects

        Returns a list with these two values in order. Otherwise and empty list. 
        """

        if value:
            return [value['category'], value['ects']]

        return ['', '']


class CategoryEctsField(forms.MultiValueField):
    """Field for category input in forms.

    The user can select a category and the corresponding etcs to the model
    currently being created/updated.
    """

    widget = CategoryEctsWidget()

    def __init__(self, queryset=None, required=False, *args, **kwargs):
        """Initialize the two fields present."""

        fields = (
          forms.ModelChoiceField(queryset=queryset),
          forms.DecimalField(),
        )

        super().__init__(fields, *args, **kwargs,
                require_all_fields=False)

        # Use the auto-generated widget.choices by the ModelChoiceField
        self.widget.widgets[0].choices = self.fields[0].widget.choices

    def clean(self, value):
        """Clean the input to find potential errors.

        Keyword arguments:
        value -- list with values from the defined widget

        Returns the input value

        Raises ValidationError if there is some problem with the input.
        """

        # Don't do anything if there is no category selected
        if value[0]:
            # If the category does not exist
            if not Category.objects.filter(id=int(value[0])).exists():
                msg = 'Kategorin finns inte'
                raise forms.ValidationError(msg)
            # The ects should be in a correct decimal format
            try:
                Decimal(value[1])
            except:
                msg = 'Siffran är i fel format'
                raise forms.ValidationError(msg)

        return value

    def compress(self, data_list):
        """Take input and compress to a string."""

        data_list[0] = 'data_list[0].id'
        data_list[1] = str(data_list[1])
        return '-'.join(data_list)
