from django.contrib.auth.decorators import login_required, permission_required
from django.urls import path, include

from . import views

urlpatterns = [
    # Home path
    path('', views.index, name='index'),

    # Categories
    path('kategorier/', views.CategoryList.as_view(), name='category-list'),
    path('kategorier/<slug:slug>/', views.CategoryDetail.as_view(),
        name='category-detail'),

    # Courses
    path('kurser/', views.CourseList.as_view(), name='course-list'),
    path('kurser/skapa/', views.CourseCreate.as_view(), name='course-create'),
    path('kurser/<slug:slug>/radera/',
        views.CourseDelete.as_view(), name='course-delete'),
    path('kurser/<slug:slug>/andra/', views.CourseUpdate.as_view(),
        name='course-update'),
    path('kurser/<slug:slug>/', views.CourseDetail.as_view(),
        name='course-detail'),

    # Courseoccasions
    path('kurstillfallen/', views.CourseOccasionList.as_view(), 
        name='courseoccasion-list'),
    path('kurstillfallen/<int:year>/<slug:slug>/',
        views.CourseOccasionDetail.as_view(), name='courseoccasion-detail'),

    # Blocks
    path('blockschema/<str:username>/<slug:slug>/', views.block,
        name='block'),

    # Profiles
    path('profiler/', views.ProfileList.as_view(), name='profile-list'),
    path('profiler/<str:slug>/', views.ProfileDetail.as_view(),
        name='profile-detail'),
]
