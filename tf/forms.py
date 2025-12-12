from django_registration.forms import RegistrationForm
from captcha.fields import ReCaptchaField


class RodatradenRegistrationForm(RegistrationForm):
    recaptcha = ReCaptchaField(label="Jag är en människa!")
