from django.urls import path, include

from . import views

urlpatterns = [
    # Sign up path
    path('registrera/', views.SignUp.as_view(), name='signup'),
]
