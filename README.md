# Röda Tråden 4

The fourth version of Röda Tråden written in Django!

More information is coming soon!

## About Django

Django is a Python-based web framework. Tactically chosen since students at
Teknisk Fysik is more familiar with Python than most other languages used in web
frameworks. It is also very modular and does a lot of work for you, which is
good when the development eventually moves to other people.

More information can be found on their
[website](https://www.djangoproject.com/). If you are very new to this
framework, I heavily recommend that you first go through the project ["Writing
your first Django app"](https://docs.djangoproject.com/en/2.2/intro/tutorial01/)
to get an idea of how the framework is structured.

## Installation

For the beginner, I will here quickly describe how to download and install this
repository. The first case is for local development. The second case is for
production on your own site. **Note**: This guide will be tailored towards
Linux-users, as I really only ever use Linux. With some quick searching I found
[this article](https://hostadvice.com/how-to/how-to-install-django-on-windows/)
which might help with installation on Windows.

### Local development

1. Clone this repository to your computer by `git clone
   https://github.com/blwh/rodatraden/`.

2. You should at the very least install `virtalenv` and, preferably,
   `virtualenvwrapper` too.  A useful installation guide can be found
   [here](http://www.indjango.com/python-install-virtualenv-and-virtualenvwrapper/).

3. With this installed, make a new virtual environment with a suitable name.
   *Make sure that the Python version is at least 3.6+*

4. Enter the cloned git repository `cd rodatraden`. Enter the folder `tf` and
   copy the file `settings-template.py` to `settings.py` and edit the file with
   your favorite editor.

5. Since this is for local development, not much has to be changed. However, the
   variable `DATABASES` has to be changed to suit your setup. Django supports a
   myriad of databases. This project is configured for MySQL, and a guide of how
   to setup a local MySQL-server can be found
   [here](https://dev.mysql.com/doc/mysql-getting-started/en/).

6. After your database is setup, change the settings in the `settings.py` file
   and save.

7. In your virtual environment, install all of the required packages by running
   `pip install -r requirements.txt` in the cloned repository.

8. Make new migrations for your database by running `python manage.py
   makemigrations` in the cloned repository. After this, migrate to the database
   by running `python manage.py migrate`.

9. If everything went well and it is all setup, start the server by running
   `python manage.py runserver`. Your local version should then be accessible
   via 127.0.0.1:8000 in your browser. Congratulations!

### Production

I assume that you already have an http server with e.g. Apache or Nginx and a database setup.

1. Follow steps 1-4 in the local development section.

2. Setup a media folder in e.g. `var/www/` named `media` with a folder inside
   called `profiles`. The user `www-data` should have read and write access to
   this folder. This could be done by adding a group to the folders where
   `www-data` is included, and run `chmod 770 -R media`.

3. In the `tf/settings.py`-file more has to be changed than for local
   development.

    * Change the `SECRET_KEY` to a random 20-30 character string.
    * Set `DEBUG=False`.
    * Add the server adress to `ALLOWED_HOSTS`.
    * Add database information in the variable `DATABASES`.
    * Set the `MEDIA_ROOT` variable to the writeable media folder setup in step
      2.
    
4. Save the `settings.py`-file.

5. Run `python manage.py makemigrations` and `python manage.py migrate` to fill
   the database.

6. Run `python manage.py collectstatic` to gather all the static files to the
   site root folder.

7. Everything should be ready to be configured with your HTTP-server. This step
   is mostly up to you and what you prefer to do. Django supports `WSGI`, and
   more detailed explanations can be found
   [here](https://docs.djangoproject.com/en/2.2/howto/deployment/wsgi/). A
   possible deployment method is to run the server with `python manage.py
   runserver` and use a proxy to redirect requests to `127.0.0.1`, but I can't
   give more detail than that.

## Improvements

Potential future improvements,

- [X] All staff can change any block
- [X] Copy all courseoccasions from one year to another year
- [ ] Make the blocks nicer
- [ ] Make it so users can see their pending reports
- [ ] Associate Profiles with Exams
- [X] Automatic generation of 'examensbilagan'
- [ ] Search function for whole site
- [x] Redirect to created object after creation
- [ ] Re-implement the prerequisite hint on blocks
