from django.urls import path, include

from . import views

urlpatterns = [
    # Home path
    path('', views.index, name='index'),
    # Categories
    path('kategorier/', views.categories, name='categories'),
    path('kategorier/<slug:slug>/', views.category_info, name='category'),
    # Courses
    path('kurser/', views.courses, name='courses'),
    path('kurstillfallen/<int:year>/<slug:slug>/', views.course_occasion_info,
        name='courseoccasions'),
    # Blocks
    path('blockschema/<str:username>/<slug:slug>/', views.block,
        name='block'),
]
