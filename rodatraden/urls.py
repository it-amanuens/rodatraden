from django.urls import path, include

from . import views

urlpatterns = [
    # Home path
    path('', views.index, name='index'),
]
