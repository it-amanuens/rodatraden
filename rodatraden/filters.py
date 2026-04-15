import datetime
import django_filters
from .models import (
    Course, Category, Level, Department, Profile, Track,
    CourseOccasion, TimePeriod, academic_year_title, YEAR_RANGE_OFFSET
)

class CourseFilter(django_filters.FilterSet):
    """Filter settings for the list of courses.
    
    The constructor expects request.GET to be the first argument. This sets the
    parameter self.data which is used to sort the courses based on the GET
    request parameter 'sort'."""

    # Use a custom filter method to handle courses with the same name but
    # different ECTS. The dropdown shows Course.__str__() (which includes HP
    # for duplicates), and we filter by the course's primary key.
    title = django_filters.ModelChoiceFilter(
        queryset=Course.objects.all().order_by('title'), empty_label='Kursnamn',
        method='filter_by_course'
    )

    def filter_by_course(self, queryset, name, value):
        """Filter by the selected course's primary key."""
        if value:
            return queryset.filter(pk=value.pk)
        return queryset
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
    # Year is now a plain IntegerField — use ChoiceFilter with dynamic choices.
    year = django_filters.ChoiceFilter(
            choices=lambda: [('', 'Läsår')] + [
                (y, academic_year_title(y))
                for y in range(
                    datetime.date.today().year - YEAR_RANGE_OFFSET,
                    datetime.date.today().year + YEAR_RANGE_OFFSET + 1,
                )
            ],
            empty_label=None,  # we include the empty option in choices above
            field_name='year'
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
