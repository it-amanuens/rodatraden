import django_tables2 as tables
from .models import (
    Course, CourseOccasion, Category, Exam, Report, PrivateCourse
)

class CourseTable(tables.Table):
    """Table for courses."""

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

    def before_render(self, request):
        """Override before_render to hide edit if not staff."""

        if request.user.is_staff:
            self.columns.show('edit')
        else:
            self.columns.hide('edit')

    class Meta:
        model = Course
        # Style template
        template_name = 'django_tables2/bootstrap4.html'
        fields = ('title', 'ects', 'level', 'categories',)
        order_by = ('title',)


class CourseOccasionTable(tables.Table):
    """Table for courseoccasions"""

    # Need to fetch url from courseoccasion model
    course = tables.Column(linkify=lambda record: record.get_absolute_url())
    academic_year = tables.Column(accessor="academic_year.year",
            verbose_name="År")
    time_period = tables.Column(accessor="time_period.title",
            verbose_name="Läsperiod")

    # Editing buttons
    edit = tables.TemplateColumn(
            template_name='rodatraden/tables/courseoccasion_edit.html', 
            verbose_name="")
    # Official
    official = tables.TemplateColumn(
            template_name='rodatraden/tables/official_table.html', 
            verbose_name="")
    # Categories with nice look
    categories = tables.TemplateColumn(
            template_name='rodatraden/tables/category_table_occ.html',
            verbose_name="Kategorier",
            orderable=False)

    def before_render(self, request):
        """Override before_render to hide edit if not staff."""

        if request.user.is_staff:
            self.columns.show('edit')
        else:
            self.columns.hide('edit')

    class Meta:
        model = CourseOccasion
        # Style template
        template_name = 'django_tables2/bootstrap4.html'
        fields = ('official', 'course', 'academic_year', 'time_period', 'weeks',
                'course.ects', 'categories')
        order_by = ('course', '-academic_year', )


class ExamTable(tables.Table):
    """Table for exams"""

    # Need to fetch url from exam model
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


class PrivateCourseTable(tables.Table):
    """Table for private courses"""

    # Need to fetch url from private course model
    title = tables.Column(linkify=lambda record: record.get_absolute_url())

    # Editing buttons
    edit = tables.TemplateColumn(
            template_name='rodatraden/tables/privatecourse_edit.html', 
            verbose_name="")

    class Meta:
        model = PrivateCourse
        # Style template
        template_name = 'django_tables2/bootstrap4.html'
        fields = ('title', 'year', 'ects', 'start', 'weeks')


class ReportTable(tables.Table):
    """Table for reports"""
    
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
