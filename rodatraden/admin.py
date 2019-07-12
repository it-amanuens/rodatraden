from django.contrib import admin

from .models import *

# Register your models here.
myModels = [Department, Level, Profile, Category, Track, Course, CategoryCourse,
        CourseOccasion, Block, Page, AcademicYear, Exam, CategoryExam,
        PrivateCourse, PrivateCourseCategory, Prerequisite, TimePeriod]

# Register all the models in myModels to the admin site
admin.site.register(myModels)
