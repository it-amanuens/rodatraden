from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django_registration.forms import RegistrationForm
from captcha.fields import CaptchaField

User = get_user_model()


class RodatradenRegistrationForm(RegistrationForm):
    recaptcha = CaptchaField(label="Jag är en människa!")

    def clean_email(self):
        """Prevent registration if the email is already in use.

        After the user merge, each email should correspond to exactly one
        active account. This validation enforces that going forward.
        Inactive (merged) accounts are excluded so that their email can
        still be used by the active account holder.
        """

        email = self.cleaned_data.get('email', '')
        if email and User.objects.filter(email__iexact=email, is_active=True).exists():
            raise ValidationError(
                'Ett konto med denna e-postadress finns redan. '
                'Vänligen logga in med ditt befintliga konto eller '
                'använd en annan e-postadress.'
            )
        return email
