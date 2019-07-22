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

4. Enter the cloned git repository `cd rodatraden` and edit the file
   `tf/setting.py` with your favorite editor.

5. Since this is for local development, not much has to be changed. However, the
   variable `DATABASES` has to be changed to suit your setup. Django supports a
   myriad of databases. This project is configured for MySQL, and a guide of how
   to setup local MySQL-server can be found
   [here](https://dev.mysql.com/doc/mysql-getting-started/en/).

6. After your database is setup, change the settings in the `settings.py` file
   and save.

7. In your virtual environment, install all of the required packages by running
   `pip install -r requirements.txt` in the cloned repository.

8. Make new migrations for your database by running `python manage.py
   makemigrations` in the cloned repository. After this, migrate to the database
   by running `python manage.py migrations`.

9. If everything went well and it is all setup, start the server by running
   `python manage.py runserver`. Your local version should then be accessible
   via 127.0.0.1:8000 in your browser. Congratulations!

### Production

## Improvements

Potential future improvements,

- [ ] Copy all courseoccasions from one year to another year
- [ ] Associate Profiles with Exams
- [ ] Automatic generation of 'examensbilagan'
- [ ] Search function for whole site
- [ ] Less hardcoding for the forms with categories
- [ ] Redirect to created object after creation
- [ ] Re-implement the prerequisite hint on blocks
