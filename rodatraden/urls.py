from django.urls import path, include

from . import views

urlpatterns = [
    # Home path
    path('', views.Index, name='index'),
    # Categories
    path('kategorier/', views.Categories, name='categories'),
    path('kategorier/<slug:slug>/', views.CategoryInfo, name='category'),
]
