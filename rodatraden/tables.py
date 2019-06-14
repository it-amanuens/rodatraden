# Configuration for django-tables2

import django_tables2 as tables
from .models import Course, CourseOccasion, Category

class CourseTable(tables.Table):
    # Urls from respective models
    title = tables.Column(linkify=True)
    categories = tables.ManyToManyColumn(transform=lambda obj:
            obj.abbreviation, separator=' ', linkify_item=True,
            attrs={'td':{'class': 'abbr-style'}})
    
    remove_button = "<button type='button' class='delete-course btn btn-gone'"
    remove_button += "data-id='{% url 'course-delete' record.slug %}'>"
    remove_button += "<span class='fa fa-trash'></span></button>"

    remove = tables.TemplateColumn(remove_button, verbose_name="")

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
