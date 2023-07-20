import django_filters
from .models import (
    Course, Category, Level, Department, Profile, Track, AcademicYear,
    CourseOccasion, TimePeriod
)

class CourseFilter(django_filters.FilterSet):
    """Filter settings for the list of courses.
    
    The constructor expects request.GET to be the first argument. This sets the
    parameter self.data which is used to sort the courses based on the GET
    request parameter 'sort'."""

    title = django_filters.ModelChoiceFilter(
        queryset=Course.objects.all().order_by('title'), empty_label='Kursnamn'
    )
    categories = django_filters.ModelChoiceFilter(
        queryset=Category.objects.all().order_by('title'), empty_label='Kategori'
    )
    level = django_filters.ModelChoiceFilter(
        queryset=Level.objects.all(), empty_label='Nivå'
    )
    department = django_filters.ModelChoiceFilter(
        queryset=Department.objects.all().order_by('title'), 
        empty_label='Institution'
    )
    profile = django_filters.ModelChoiceFilter(
        queryset=Track.objects.all().order_by('title'),
        empty_label='Profil', field_name='tracks'
    )

    class Meta:
        model = Course
        fields = ['title', 'categories', 'profile', 'level', 'department']


    @property
    def qs(self):
        # Sort by title in ascending order if no sort order is specified.
        sort_order = self.data.get('sort_order', 'title')
        return super().qs.order_by(sort_order)


class CourseOccasionFilter(django_filters.FilterSet):
    """Filter settings for the list of course occasions."""
    
    # A lot of the filters refer to the course that the courseoccasion is
    # connected to, hence the 'field_name' argument
    title = django_filters.ModelChoiceFilter(
            queryset=Course.objects.all().order_by('title'),
            empty_label='Kursnamn', to_field_name='id', field_name='course'
    )
    year = django_filters.ModelChoiceFilter(
            queryset=AcademicYear.objects.all().order_by('year'),
            empty_label='Läsår', field_name='academic_year'
    )
    time_period = django_filters.ModelChoiceFilter(
            queryset=TimePeriod.objects.all().order_by('week'),
            empty_label='Läsperiod', field_name='time_period'
    )
    categories = django_filters.ModelChoiceFilter(
            queryset=Category.objects.all().order_by('title'), 
            field_name='course__categories',
            empty_label='Kategori'
    )
    department = django_filters.ModelChoiceFilter(
            queryset=Department.objects.all().order_by('title'), 
            field_name='course__department',
            empty_label='Institution'
    )
    official = django_filters.ChoiceFilter(
            choices=((True, 'Godkänd'), (False, 'Ej godkänd')), 
            empty_label='Status'
    )

    class Meta:
        model = CourseOccasion
        fields = ['title', 'year', 'time_period', 'categories', 'department',
            'official'
        ]
