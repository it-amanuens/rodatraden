from django.contrib import admin

from .models import *

# Register your models here.
myModels = [Department, Level, Profile, Category, Track, Course, CategoryCourse,
        CourseOccasion, Block, Page, AcademicYears, Exam, CategoryExam,
        PrivateCourse, PrivateCourseCategory, Prerequisite]

# Register all the models in myModels to the admin site
admin.site.register(myModels)
