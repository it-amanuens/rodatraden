# Configuration for django-tables2

import django_tables2 as tables
from .models import Course, CourseOccasion

class CourseTable(tables.Table):
    # Url from courses model
    title = tables.Column(linkify=True)
    class Meta:
        model = Course
        # Style template
        template_name = 'django_tables2/bootstrap4.html'
        # Fields to show and order
        fields = ('title', 'ects', 'level', 'categories',) # fields to display
        order_by = ('title',)

class CourseOccasionTable(tables.Table):
    # Need to fetch url from courseoccasion model
    course = tables.Column(linkify=lambda record: record.get_absolute_url())
    class Meta:
        model = CourseOccasion
        # Style template
        template_name = 'django_tables2/bootstrap4.html'
        # Fields to show and order
        fields = ('official', 'course', 'year', 'start', 'weeks',
                'course.ects', 'course.categories', )
        order_by = ('course', '-year', )
