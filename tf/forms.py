from django_registration.forms import RegistrationForm
from captcha.fields import CaptchaField


class RodatradenRegistrationForm(RegistrationForm):
    recaptcha = CaptchaField(label="Jag är en människa!")
