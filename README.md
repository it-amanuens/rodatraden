![Röda Tråden](./rodatraden/static/rodatraden/RTheader.svg)

The fourth version of Röda Tråden, now written in Django!

Röda tråden is a website primarily used by students at Umeå University to navigate and organize their study materials. The website provides a structured and overview platform where students can find course information, schedules, learning materials, and other relevant information for their studies. It is designed to help students in their academic journey by bringing everything they need together in one place.

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
production on your site. **Note**: This guide will be tailored towards
Linux users, as I only ever use Linux. With some quick searching, I found
[this article](https://hostadvice.com/how-to/how-to-install-django-on-windows/)
which might help with installation on Windows.

### Local development

1. Clone this repository to your computer by `git clone
   https://github.com/it-amanuens/rodatraden/`.

2. Install a virtual environment in the root path directory of the repository by executing `python -m venv .venv` and then activate it. On linux you can activate it by running `source .venv/bin/activate`. Windows has `.\.venv\Scripts\activate`

3. Enter the cloned git repository `cd rodatraden`. Enter the folder `tf`, copy the file `settings-template.py` to `settings.py`, and edit the file with
   your favorite editor.

4. Since this is for local development, not much has to be changed. However, the
   variable `DATABASES` has to be changed to suit your setup. Django supports a
   myriad of databases. This project is configured for MySQL, and a guide on how
   to set up a local MySQL-server can be found
   [here](https://dev.mysql.com/doc/mysql-getting-started/en/).

5. After your database is set up, change the settings in the `settings.py` file
   and save.

6. In your virtual environment, install all of the required packages by running
   `pip install -r requirements.txt` in the cloned repository.

7. Make new migrations for your database by running `python manage.py makemigrations`
   in the cloned repository. After this, migrate to the database
   by running `python manage.py migrate`.

8. If everything went well and it is all set up, start the server by running
   `python manage.py runserver`. Your local version should then be accessible
   via 127.0.0.1:8000 in your browser. Congratulations!

9. Take down the project again to create the new superuser (ctrl + c to shutdown server). 
    This user is used for manage the instance and setup courses and can be created with:
    `python manage.py createsuperuser`
   Restart the server (step 8).

### Production

#### Linux

I assume that you already have an http server with e.g. Apache or Nginx and a database setup. This guide will focus on linux.
For windows see section lower down

1. Follow steps 1-4 in the local development section.

2. Set up a media folder e.g. `var/www/` named `media` with a folder inside
   called `profiles`. The user `www-data` should have read and write access to
   this folder. This could be done by adding a group to the folders where
   `www-data` is included, and run `chmod 770 -R media`.

3. In the `tf/settings.py`-file more has to be changed than for local
   development.

    * Change the `SECRET_KEY` to a random 20-30 character string.
    * Set `DEBUG=False`.
    * Add the server address to `ALLOWED_HOSTS`.
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
   (one more detail, uncomment wfastcgi in requirements.txt on windows)

   #### Windows
#### Windows

I assume that you already have a Windows Server with IIS enabled (including the CGI role service) and Python installed system-wide (for example `C:\Python312`). This guide focuses on deployment using IIS and FastCGI (`wfastcgi`).
If not, i recomend reading through these two:
https://www.toptal.com/developers/django/installing-django-on-iis-a-step-by-step-tutorial
https://blog.devgenius.io/deploy-django-app-to-iis-windows-server-beginners-guide-with-images-3d03b6fd5b7e

This setup has not been fully tested on Windows, so some adjustment is probably neccesary depending on your environment.

1. Follow steps 1-4 in the local development section.

2. Set up a media folder e.g. `C:\inetpub\rodatraden\` named `media` with a folder inside
   called `profiles`. The IIS application pool user for your site
   (for example `IIS AppPool\rodatraden`) must have read and write access to
   this folder. This can be done by running:

   `icacls "C:\inetpub\rodatraden\media" /grant "IIS AppPool\rodatraden":(OI)(CI)M`

3. In the `tf/settings.py`-file more has to be changed than for local
   development.

   * Change the `SECRET_KEY` to a random 20-30 character string.
   * Set `DEBUG=False`.
   * Add the server address or domain to `ALLOWED_HOSTS`.
   * Add database information in the variable `DATABASES`.
     If using SQLite, ensure the database file has write permissions.
   * Set the `MEDIA_ROOT` variable to the writeable media folder setup in step
     2.

4. Save the `settings.py`-file.

5. Run `python manage.py makemigrations` and `python manage.py migrate` to fill
   the database.

6. Run `python manage.py collectstatic` to gather all the static files to the
   site root folder.

7. Everything should be ready to be configured with IIS. Unlike Linux (WSGI),
   Windows typically uses FastCGI via `wfastcgi`.

   * Install FastCGI support:
     `pip install wfastcgi`

   * Grant the IIS application pool user read and execute access to the entire
     project folder (this is especially important for the virtual environment):

     `icacls "C:\inetpub\rodatraden" /grant "IIS AppPool\rodatraden":(OI)(CI)RX`

   * In IIS Manager:
     * Add a Website pointing to your project root folder.
     * Add a Module Mapping using the FastCgiModule, pointing the script
       processor to your virtual environment `python.exe` and `wfastcgi.py`.
     * Set required environment variables such as `DJANGO_SETTINGS_MODULE`.

   * Since Django does not serve static files in production, create a Virtual
     Directory in IIS:
     * Alias: `static`
     * Physical path: your collected static files folder. `python manage.py collectstatic` to create the static folder.
    * Also add the media folder to IIS to serve user uploaded files.  

    Note: if IIS routes `static`/`media` to Python instead of serving files,
    open the `static` and `media` virtual directories, remove any Python
    handler, then add a Module Mapping: `Request path=*`, `Module=StaticFileModule`,
    `Executable=` (blank), `Name=StaticFile`. Enable "Invoke handler only if
    request is mapped to: File or folder". Ensure "Static Content" is installed.

8. Restart IIS and verify that the site loads correctly.

### Clean install
If you don't want to migrate data from an old instance, then you will have to create new the all new data from scratch. 
New super users can be created in django by running this command `python manage.py createsuperuser`
After this navigate to the admin interface. Here we will have to add entries like "akademiska år", "institutioner" "Nivåer", "Spår" and "Tidsperioder". 
- Akademiska år : The study year (You probably want a few courses here)
- Institutioner : The institution / faculty where the course can be / is taken
- Nivåer : If it's an advanced course or not (grundläggande / avancerad)
- Spår : The different tracks that can be choosen. Make a profile before on the main site
- Tidsperioder : This is when during the year a course starts. For example week 0 for "läsperiod 1", week 10 for "läsperiod 2" Week 0 is the beginning of time academic year. If a course starts 3 weeks into period 2, then specify week 13.

After after creating these, new courses can be added to the default site

## GitHub Release + Docker image

This repository now includes a GitHub Actions workflow that runs when you push a version tag (`v*`).

It will:
- Create a GitHub Release from the tag
- Build a Docker image from `Dockerfile`
- Publish the image to GitHub Container Registry as `ghcr.io/<owner>/rodatraden`

### Create a release

1. Ensure you are on the branch you want to release (usually `master`) and push your latest changes.
2. Create and push a semantic version tag:
   `git tag v1.0.0`
   `git push origin v1.0.0`
3. Wait for the workflow to finish in the GitHub Actions tab.

### Pull the released image

Example:
`docker pull ghcr.io/<owner>/rodatraden:v1.0.0`


## Backups of the data

### To create a backup (run on production server)
1. `python -Xutf8 ./manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission --indent 2 -o data.json`
(more info can be found here: https://www.coderedcorp.com/blog/how-to-dump-your-django-database-and-load-it-into-/)

2. We then have to copy over the media folder (if the images uploaded to Rödatråden should be saved). Easy methode is just to zip and send over the media folder. 

### To restore a backup
1. When setting up the new instance, first run `python manage.py migrate` to create the new migration table.

2. Restore user data using `python manage.py loaddata data.json`

3. Extract the media folder to same directory (project-root/media/)


