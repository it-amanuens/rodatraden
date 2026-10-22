from django import forms
from rodatraden.models import Category, Course
from decimal import Decimal
from django.db.models import Manager

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

        data_list[0] = str(data_list[0].id)
        data_list[1] = str(data_list[1])
        return '-'.join(data_list)


class StartWeekWidget(forms.MultiWidget):
    """Widget to work in tandem with StartWeekField.

    The widget is responsible for rendering the HTML elements.
    """

    def __init__(self,
                 period_choices: list[tuple],
                 week_offset_choices: list[tuple],
                 **kwargs):
        
        widgets = (
            forms.Select(choices=period_choices),
            forms.Select(choices=week_offset_choices)
        )

        super().__init__(widgets=widgets, **kwargs)


    def decompress(self, value):
        if value:
            weeks_in_period = 10

            start_week = int(value)
            # Period 1 for weeks 0-9, period 2 for weeks 10-19, etc.
            period_number = start_week // weeks_in_period + 1
            # The number of weeks after the start of the period.
            period_start_offset = start_week % weeks_in_period
            return [period_number, period_start_offset]
        else:
            # First period + 0 weeks by default.
            return [1, 0]


class StartWeekField(forms.MultiValueField):
    """Field to work in tandem with StartWeekWidget.

    Lets the user enter the course's starting week in a more user-friendly way.
    The user selects two things:
    1. The starting period from a selection.
    2. The number of weeks after the start of the period that the course starts.

    This information is converted into a starting week number between 0 and 49.
    LP1 = week 0, LP2 = week 10, LP3 = week 20, LP4 = week 30, LP5 = week 40
    (LP5 represents the summer period).
    """

    # A choice for a ChoiceField or Select widget is a 2-tuple on the form
    # (value, human readable name).
    # LP1–LP4 are the regular academic periods; LP5 is the summer period.
    _period_choices = [(i, f'LP{i}') for i in range(1, 6)]
    _week_offset_choices = [(i, f'+ {i} veckor') for i in range(10)]

    # The widgets need the choices to be able to list them as option elements
    # in the selection element.
    widget = StartWeekWidget(
        period_choices=_period_choices, 
        week_offset_choices=_week_offset_choices
    )


    def __init__(self, **kwargs):
        # The choice of field is not that important since the widget does most
        # of the work. However if we use IntergerFields then the data given to
        # compress() will have already been converted to integers.
        fields = (
            forms.IntegerField(),
            forms.IntegerField()
        )

        super().__init__(
            fields=fields,
            **kwargs
        )


    def compress(self, data_list):
        if data_list:
            weeks_in_period = 10

            period_number = data_list[0]
            period_start_offset = data_list[1]

            start_week = ((period_number - 1) * weeks_in_period
                          + period_start_offset)
            
            return start_week
        else:
            # First week by default.
            return 0


class PrerequisiteWidget(forms.MultiWidget):
    """Widget to work in tandem with PrerequisiteField.
    
    The widget splits the equivalent courses into multiple fields.
    """

    def __init__(self, widgets: list[forms.Widget]):
        for widget in widgets:
            widget.attrs['class'] = 'form-control form-prerequisite__select'

        super().__init__(widgets=widgets)

    
    def decompress(self, value):
        if value:
            return value
        else:
            return []


class PrerequisiteField(forms.MultiValueField):
    """Field for prerequisite input in forms.
    
    The user can select multiple equivalent courses that can meet the same
    prerequisite."""


    def __init__(self, queryset: Manager[Course],
                 equivalent_course_count = 1):
        """Initialize the field with at least one field."""

        fields = []
        widgets = []
        for _ in range(equivalent_course_count):
            field = forms.ModelChoiceField(queryset=queryset)
            fields.append(field)
            widgets.append(field.widget)
        
        super().__init__(fields=fields)

        self.widget = PrerequisiteWidget(widgets)


    # compress is not implemented since the prerequisite field are never bound
    # to the form. Instead the fields are parsed in the forms save method by
    # accessing the POST data directly.
    """ def compress(self, data_list):
        if data_list:
            return data_list
        else:
            return [] """
