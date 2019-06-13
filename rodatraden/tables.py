# Configuration for django-tables2

import django_tables2 as tables
from .models import Course

class CourseTable(tables.Table):
    class Meta:
        model = Course
        template_name = 'django_tables2/bootstrap4.html'
        fields = ('title', 'ects', 'level', 'categories',) # fields to display
        order_by = ('title',)
