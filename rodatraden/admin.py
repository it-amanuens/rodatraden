from django.contrib import admin

from .models import *

# Register your models here.
myModels = [Department, Level, Profile, Category,
        Track, Course, CourseOccasion, Block,
        Page, AcademicYears, Exam, PrivateCourse]

admin.site.register(myModels)
