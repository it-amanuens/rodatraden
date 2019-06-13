from django.urls import path, include

from . import views

urlpatterns = [
    # Home path
    path('', views.index, name='index'),
    # Categories
    path('kategorier/', views.categories, name='category-list'),
    path('kategorier/<slug:slug>/', views.category_info, name='category'),
    # Courses
    path('kurser/', views.CourseList.as_view(), name='course-list'),
    path('kurser/<slug:slug>/', views.CourseDetail.as_view(), name='course'),
    # Courseoccasions
    path('kurstillfallen/', views.CourseOccasionList.as_view(), 
        name='courseoccasion-list'),
    path('kurstillfallen/<int:year>/<slug:slug>/',
        views.CourseOccasionDetail.as_view(), name='courseoccasion'),
    # Blocks
    path('blockschema/<str:username>/<slug:slug>/', views.block,
        name='block'),
]
