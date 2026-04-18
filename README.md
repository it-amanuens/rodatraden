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

2. Install a venv in the root path directory of the repository by executing `python -m venv venv` and then activate the venv. On linux you can activate the venv by running `source env/bin/activate`. Windows has `.\env\Scripts\activate`

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
    Restart the server (step 9).

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
After this navigate to the admin interface. Here we will have to add entries like "institutioner" "Nivåer" and "Spår".
- Institutioner : The institution / faculty where the course can be / is taken
- Nivåer : If it's an advanced course or not (grundläggande / avancerad)
- Spår : The different tracks that can be choosen. Make a profile before on the main site
Course periods are now entered directly as start week values in forms
(LP1=0, LP2=10, LP3=20, LP4=30, LP5=40). If a course starts 3 weeks into
period 2, set start week to 13.

Academic years (e.g. "20/21") are computed automatically — no database setup
needed. Year dropdowns in forms show the current year ± 10.

After after creating these, new courses can be added to the default site


## Backups of the data

### To create a backup (run on production server)
1. `python -Xutf8 ./manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission --indent 2 -o data.json`
(more info can be found here: https://www.coderedcorp.com/blog/how-to-dump-your-django-database-and-load-it-into-/)

2. We then have to copy over the media folder (if the images uploaded to Rödatråden should be saved). Easy methode is just to zip and send over the media folder. 

### To restore a backup
1. When setting up the new instance, first run `python manage.py migrate` to create the new migration table.

2. Restore user data using `python manage.py loaddata data.json`

3. Extract the media folder to same directory (project-root/media/)



## Improvements

Potential future improvements,

- [X] All staff can change any block
- [X] Copy all course occasions from one year to another year
- [X] Make the blocks nicer
- [ ] Make it so users can see their pending reports
      - [ ] Send email to admin when new report is created?
      - [ ] Make it so users can change their report / delete it
- [ ] Associate Profiles with Exams
- [X] Automatic generation of 'examensbilagan'
- [ ] Search function for the whole site
- [x] Redirect to created object after creation
- [X] Re-implement the prerequisite hint on blocks
- [ ] Make users able to login with username and email
   - [ ] Merge users who has different accounts with same email
- [ ] Add optional summercourses entry (period 5 and 6?). Could be added as a smaller block?
   -  There is a branch with experimental summer course!
- [ ] Rebuild the `kurser` / `kurstillfällen` and merge `kurstillfällen` into the `kurser` to make course changes easier
   - [x] Design and implement recurrence rules for `Course` (examples: every year, every N years, per läsperiod, custom weeks)
   - [x] Provide a migration script to convert existing `CourseOccasion` entries into the new `Course` recurrence model
   - [x] Support manual exceptions and overrides (skip a year, add a single extra offering, edit a single occurrence)
   - [ ] Update API, admin and UI to display and manage recurring offerings and exceptions
   - [ ] Ensure prerequisites, slugs and existing `Block` / `PrivateCourse` integrations continue to work after the merge
   - [ ] Add import/export and admin tools to manage recurring offerings and bulk edits
   - [ ] Add tests and a migration verification tool to validate migrated occurrences
- [ ] Implement backup and migration system
   - [x] Added to readme
   - [ ] scheduled backup of database and send externally?
- [x] Migrate over old issues from https://github.com/blwh/rodatraden/issues/
- [ ] Better code?
   - [ ] Use same category_form code for private course as for the public courses? Currently we have separate code for both, changes will thus have to be updated in both.  rodatraden\static\rodatraden\course\form_categories.js and rodatraden\static\rodatraden\course\form_categories.js
      - [ ] We also dont save category on a newly created course. You have to edit it a second time?. 
   - [ ] There is two category options for real corses. First is broken (and should be removed?) second one works. 