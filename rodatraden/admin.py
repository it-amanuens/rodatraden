from django.contrib import admin

from .models import *

# Register your models here.
myModels = [Department, Level, Track, AcademicYear, TimePeriod]

# Register all the models in myModels to the admin site
admin.site.register(myModels)
