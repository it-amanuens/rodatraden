# Configuration for django-filters

import django_filters
from django_filters import ModelChoiceFilter
from .models import Course

class CourseFilter(django_filters.FilterSet):

    class Meta:
        model = Course
        fields = {
                'title': ['icontains'],
                'categories': ['icontains'],
                # 'profiles': ['icontains'],
                # 'level': ['icontains'],
                # 'title': ['icontains'],
                }
