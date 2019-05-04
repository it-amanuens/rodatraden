from django.contrib.auth.forms import UserCreationForm
from django.urls import reverse_lazy
from django.views import generic

# Create your views here.
class SignUp(generic.CreateView):
    form_class = UserCreationForm
    # Reverse_lazy is used instead of reverse because of all generec class-based
    # views do not load the urls when the file is imported
    success_url = reverse_lazy('login')
    template_name = 'signup/signup.html'
