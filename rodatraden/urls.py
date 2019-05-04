from django.urls import path

from . import views

urlpatterns = [
    # Home path
    path('', views.index, name='index'),
]
