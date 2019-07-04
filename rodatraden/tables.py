# Configuration for django-tables2

import django_tables2 as tables
from .models import Course, CourseOccasion, Category

class CourseTable(tables.Table):
    # Urls from respective models
    title = tables.Column(linkify=True)
    
    # Removal button
    remove_button = "<button type='button' class='delete-course btn btn-gone'"
    remove_button += "data-id='{% url 'course-delete' record.slug %}'>"
    remove_button += "<span class='fa fa-trash'></span></button>"
    # Update button
    update_button = "<button type='button' class='update-course btn btn-gone'"
    update_button += "data-id='{% url 'course-update' record.slug %}'>"
    update_button += "<span class='fa fa-pen'></span></button>"
    update_button += remove_button
    edit = tables.TemplateColumn(update_button, verbose_name="")

    # Level text
    level = tables.TemplateColumn(
            template_name='rodatraden/tables/level_table.html')
    # Categories with nice look
    categories = tables.TemplateColumn(
            template_name='rodatraden/tables/category_table.html')

    # Hide remove and edit buttons if not properly auth
    def before_render(self, request):
        if request.user.has_perm('auth.is_superuser'):
            self.columns.show('edit')
        else:
            self.columns.hide('edit')

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

    # Removal button
    remove_button = "<button type='button' class='delete-course btn btn-gone'"
    remove_button += "data-id='{% url 'course-delete' record.slug %}'>"
    remove_button += "<span class='fa fa-trash'></span></button>"
    # Update button
    update_button = "<button type='button' class='update-course btn btn-gone'"
    update_button += "data-id='{% url 'course-update' record.slug %}'>"
    update_button += "<span class='fa fa-pen'></span></button>"
    update_button += remove_button
    edit = tables.TemplateColumn(update_button, verbose_name="")

    # Hide remove and edit buttons if not properly auth
    def before_render(self, request):
        if request.user.has_perm('auth.is_superuser'):
            self.columns.show('edit')
        else:
            self.columns.hide('edit')

    class Meta:
        model = CourseOccasion
        # Style template
        template_name = 'django_tables2/bootstrap4.html'
        # Fields to show and order
        fields = ('official', 'course', 'year', 'start', 'weeks',
                'course.ects', 'course.categories', )
        order_by = ('course', '-year', )
