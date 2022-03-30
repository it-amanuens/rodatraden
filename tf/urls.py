"""tf URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns, static
from django.conf import settings
from django.urls import path, include
from django_registration.backends.one_step.views import RegistrationView
from .forms import RodatradenRegistrationForm

urlpatterns = [
    path('', include('rodatraden.urls')), # Röda tråden
    path('admin/', admin.site.urls), # Admin page

    # Authentication
    path('anvandare/register/',
        RegistrationView.as_view(
            form_class=RodatradenRegistrationForm
        ),
        name='django_registration_register',
    ),
    path('anvandare/', include('django_registration.backends.one_step.urls')),
    path('anvandare/', include('django.contrib.auth.urls')),
]

# This is added for correct handling of static files
urlpatterns += staticfiles_urlpatterns()
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
