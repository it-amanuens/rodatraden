from django.urls import path, include

from . import views

urlpatterns = [
    # Sign up path
    path('signup/', views.SignUp.as_view(), name='signup'),
]
