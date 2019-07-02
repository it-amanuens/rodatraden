import datetime
from django.db.models import Max, Min
from .models import Course, Block, CourseOccasion
from bootstrap_modal_forms.forms import BSModalForm
from django import forms

class CourseForm(BSModalForm):

    class Meta:
        model = Course
        exclude = ['description_eng']

class BlockForm(BSModalForm):

    def __init__(self, *args, **kwargs):
        super(BlockForm, self).__init__(*args, **kwargs)
        # Logic to get a year span between the earliest and latest course.
        # This is probably not the bast way to do it
        latest_occ = CourseOccasion.objects.latest('year')
        earliest_occ = CourseOccasion.objects.earliest('year')
        years = [(x, x) for x in range(earliest_occ.year, latest_occ.year)]
        self.fields['start_year'] = forms.ChoiceField(choices=years,
                initial=datetime.datetime.now().year)

    class Meta:
        model = Block
        exclude = ['courseoccasions', 'note', 'privatecourses', 'user']
