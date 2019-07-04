# Configuration for django-filters

import django_filters
from django_filters import ModelChoiceFilter
from .models import Course, Category, Level, Department

class CourseFilter(django_filters.FilterSet):

    title = django_filters.ModelChoiceFilter(queryset=Course.objects.all())
    categories = django_filters.ModelChoiceFilter(queryset=Category.objects.all())
    level = django_filters.ModelChoiceFilter(queryset=Level.objects.all())
    department = django_filters.ModelChoiceFilter(queryset=Department.objects.all())

    class Meta:
        model = Course
        fields = ['title', 'categories', 'level', 'department']
