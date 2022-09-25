from django.urls import path

from . import views

urlpatterns = [
    # Home path
    path('', views.index, name='index'),
    # Changes
    path('changelog', views.changelog, name='changelog'),

    # Reports
    path('rapporter/', views.ReportList.as_view(), name='report-list'),
    path('rapporter/skapa/', views.ReportCreate.as_view(),
         name='report-create'),
    path('rapporter/<slug:slug>/andra/', views.ReportUpdate.as_view(),
         name='report-update'),
    path('rapporter/<slug:slug>/radera/', views.ReportDelete.as_view(),
         name='report-delete'),

    # Categories
    path('kategorier/', views.CategoryList.as_view(), name='category-list'),
    path('kategorier/skapa/', views.CategoryCreate.as_view(),
         name='category-create'),
    path('kategorier/<slug:slug>/radera/', views.CategoryDelete.as_view(),
         name='category-delete'),
    path('kategorier/<slug:slug>/andra/', views.CategoryUpdate.as_view(),
         name='category-update'),
    path('kategorier/<slug:slug>/', views.CategoryDetail.as_view(),
         name='category-detail'),

    # Courses
    path('kurser/', views.course_list, name='course-list'),
    path('kurser/skapa/', views.CourseCreate.as_view(), name='course-create'),
    path('kurser/<slug:slug>/radera/',
         views.CourseDelete.as_view(), name='course-delete'),
    path('kurser/<slug:slug>/andra/', views.CourseUpdate.as_view(),
         name='course-update'),
    path('kurser/<slug:slug>/', views.CourseDetail.as_view(),
         name='course-detail'),

    # Private courses
    path('privata-kurser/<str:username>/', views.PrivateCourseList.as_view(),
         name='privatecourse-list'),
    path('privata-kurser/<str:username>/skapa/',
         views.PrivateCourseCreate.as_view(),
         name='privatecourse-create'),
    path('privata-kurser/<str:username>/<slug:slug>/radera/',
         views.PrivateCourseDelete.as_view(), name='privatecourse-delete'),
    path('privata-kurser/<str:username>/<slug:slug>/andra/',
         views.PrivateCourseUpdate.as_view(),
         name='privatecourse-update'),
    path('privata-kurser/<str:username>/<slug:slug>/',
         views.PrivateCourseDetail.as_view(),
         name='privatecourse-detail'),

    # Courseoccasions
    path('kurstillfallen/', views.CourseOccasionList.as_view(),
         name='courseoccasion-list'),
    path('kurstillfallen/skapa/', views.CourseOccasionCreate.as_view(),
         name='courseoccasion-create'),
    path('kurstillfallen/<int:year>/<slug:slug>/radera/',
         views.CourseOccasionDelete.as_view(), name='courseoccasion-delete'),
    path('kurstillfallen/<int:year>/<slug:slug>/andra/',
         views.CourseOccasionUpdate.as_view(), name='courseoccasion-update'),
    path('kurstillfallen/<int:year>/<slug:slug>/',
         views.CourseOccasionDetail.as_view(), name='courseoccasion-detail'),
    path('kurstillfallen/info/',
         views.courseoccasion_info, name='courseoccasion-info'),

    # Blocks
    path('blockscheman/<str:username>/', views.BlockList.as_view(),
         name='block-list'),
    path('blockscheman/<str:username>/skapa', views.BlockCreate.as_view(),
         name='block-create'),
    path('blockscheman/<str:username>/<slug:slug>/',
         views.block_detail, name='block-detail'),
    path('blockscheman/<str:username>/<slug:slug>/radera',
         views.BlockDelete.as_view(), name='block-delete'),
    path('blockscheman/<str:username>/<slug:slug>/andra/',
         views.BlockUpdate.as_view(), name='block-update'),
    path('blockscheman/<str:username>/<slug:slug>/kurslista/',
         views.block_course_list, name='block-course-list'),
    path('blockscheman/<str:username>/<slug:b_slug>/laggatill/',
         views.add_course_to_block, name='block-add-course'),
    path('blockscheman/<str:username>/<slug:b_slug>/tabort/',
         views.remove_course_from_block, name='block-remove-course'),

    # Profiles
    path('profiler/', views.ProfileList.as_view(), name='profile-list'),
    path('profiler/skapa', views.ProfileCreate.as_view(),
         name='profile-create'),
    path('kurstillfallen/<slug:slug>/radera/',
         views.ProfileDelete.as_view(), name='profile-delete'),
    path('kurstillfallen/<slug:slug>/andra/',
         views.ProfileUpdate.as_view(), name='profile-update'),
    path('profiler/<slug:slug>/', views.ProfileDetail.as_view(),
         name='profile-detail'),
    
    # Testing a new layout as requiested by Krister.
    path('profiler/<slug:slug>/krister_edit/', views.ProfileDetailKristerEdit.as_view(),
         name='profile-detail-krister-edit'),

    # Exams
    path('examina/', views.ExamList.as_view(), name='exam-list'),
    path('examina/skapa/', views.ExamCreate.as_view(), name='exam-create'),
    path('examina/<slug:slug>/', views.ExamDetail.as_view(),
         name='exam-detail'),
    path('examina/<slug:slug>/andra/', views.ExamUpdate.as_view(),
         name='exam-update'),
    path('examina/<slug:slug>/radera/', views.ExamDelete.as_view(),
         name='exam-delete'),

    # User management
    # TODO: The <int:pk> is only to avoid complaints by the generic view. This
    # should be removed, but I can't be arsed right now. Double security
    # perhaps?
    path('anvandare/<str:username>/<int:pk>/andra', views.UserUpdate.as_view(),
         name='user-update'),
    path('anvandare/<str:username>/<int:pk>/radera', views.user_delete,
         name='user-delete'),

    # Staff tools
    path('verktyg/', views.tools, name='tools'),
]
