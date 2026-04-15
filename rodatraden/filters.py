import django_filters
from .models import (
    Course, Category, Level, Department, Track, AcademicYear, TimePeriod
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
    academic_year = django_filters.ModelChoiceFilter(
        queryset=AcademicYear.objects.all().order_by('year'),
        empty_label='Läsår', method='filter_by_academic_year'
    )
    time_period = django_filters.ModelChoiceFilter(
        queryset=TimePeriod.objects.all().order_by('week'),
        empty_label='Läsperiod', method='filter_by_time_period'
    )

    def filter_by_academic_year(self, queryset, name, value):
        """Filter courses that have an official occasion in the given academic year."""
        if value:
            return queryset.filter(
                courseoccasion__academic_year=value,
                courseoccasion__official=True
            ).distinct()
        return queryset

    def filter_by_time_period(self, queryset, name, value):
        """Filter courses that have an official occasion in the given time period."""
        if value:
            return queryset.filter(
                courseoccasion__time_period=value,
                courseoccasion__official=True
            ).distinct()
        return queryset

    class Meta:
        model = Course
        fields = ['title', 'categories', 'profile', 'level', 'department',
                  'academic_year', 'time_period']

    @property
    def qs(self):
        # Sort by title in ascending order if no sort order is specified.
        sort_order = self.data.get('sort_order', 'title')
        return super().qs.order_by(sort_order)
