from django.urls import path, include

from . import views

urlpatterns = [
    # Home path
    path('', views.Index, name='index'),
    # Categories
    path('categories/', views.Categories, name='categories'),
    path('categories/<int:category_id>/', views.CategoryInfo, name='category'),
]
