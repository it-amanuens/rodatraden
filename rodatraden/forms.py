from .models import Course
from bootstrap_modal_forms.forms import BSModalForm

class CourseForm(BSModalForm):
    class Meta:
        model = Course
        exclude = ['description_eng']
