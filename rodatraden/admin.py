from django.contrib import admin

from .models import *

# Register your models here.

# I chose these since there is no good point to make separate views for these
# models and I'm lazy.
myModels = [
    Department,
    Level,
    Track,
    AcademicYear,
    TimePeriod,
    ISPTemplate,
    CourseScheduleSegment,
    Exam,
    CategoryExam,
]

# Register all the models in myModels to the admin site
admin.site.register(myModels)
