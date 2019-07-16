# Configuration for django-tables2

import django_tables2 as tables
from .models import Course, CourseOccasion, Category, Exam, Report

class CourseTable(tables.Table):
    # Urls from respective models
    title = tables.Column(linkify=True)
    
    # Editing buttons
    edit = tables.TemplateColumn(
            template_name='rodatraden/tables/course_edit.html', 
            verbose_name="")
    # Level text
    level = tables.TemplateColumn(
            template_name='rodatraden/tables/level_table.html')
    # Categories with nice look
    categories = tables.TemplateColumn(
            template_name='rodatraden/tables/category_table.html',
            orderable=False)

    # Hide remove and edit buttons if not properly auth
    def before_render(self, request):
        if request.user.is_staff:
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
    academic_year = tables.Column(accessor="academic_year.year",
            verbose_name="År")
    time_period = tables.Column(accessor="time_period.title",
            verbose_name="Läsperiod")

    # Categories with nice look
    categories = tables.TemplateColumn(
            template_name='rodatraden/tables/category_table_occ.html',
            verbose_name="Kategorier",
            orderable=False)
    # Official
    official = tables.TemplateColumn(
            template_name='rodatraden/tables/official_table.html', 
            verbose_name="")
    # Editing buttons
    edit = tables.TemplateColumn(
            template_name='rodatraden/tables/courseoccasion_edit.html', 
            verbose_name="")

    # Hide remove and edit buttons if not properly auth
    def before_render(self, request):
        if request.user.is_staff:
            self.columns.show('edit')
        else:
            self.columns.hide('edit')

    class Meta:
        model = CourseOccasion
        # Style template
        template_name = 'django_tables2/bootstrap4.html'
        # Fields to show and order
        fields = ('official', 'course', 'academic_year', 'time_period', 'weeks',
                'course.ects', 'categories')
        order_by = ('course', '-academic_year', )


class ExamTable(tables.Table):
    title = tables.Column(linkify=lambda record: record.get_absolute_url())

    # Editing buttons
    edit = tables.TemplateColumn(
            template_name='rodatraden/tables/exam_edit.html', 
            verbose_name="")

    class Meta:
        model = Exam
        # Style template
        template_name = 'django_tables2/bootstrap4.html'
        fields = ('title', 'ects', 'created_at', 'updated_at')


class ReportTable(tables.Table):
    from_email = tables.EmailColumn(verbose_name="Mailadress")

    # Editing buttons
    edit = tables.TemplateColumn(
            template_name='rodatraden/tables/report_edit.html', 
            verbose_name="")
    # Official
    fixed = tables.TemplateColumn(
            template_name='rodatraden/tables/report_fixed.html', 
            verbose_name="")

    class Meta:
        model = Report
        # Style template
        template_name = 'django_tables2/bootstrap4.html'
        fields = ('fixed', 'from_email', 'subject', 'created_at', 'updated_at')
        order_by = ('fixed', '-created_at')
