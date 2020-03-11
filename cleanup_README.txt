In order to automatically clean the excel folder:



include 'django_crontab' in INSTALLED_APPS in settings.py

include in settings.py:
CRONJOBS = [
		('00 03 * * *', 'rodatraden.cleanup')
]

Change to correct directory in cleanup.py

install cron job (django-crontab)

run cmd to add all defined cronjobs to crontab (remember to run every time cronjobs is changed):
    python manage.py crontab add

to show all active cronjobs, run cmd:
    python manage.py crontab show

to remove all the defined cronjobs from crontab, run cmd:
    python manage.py crontab remove_extensions

start server
