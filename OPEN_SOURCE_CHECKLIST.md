# Open Source Readiness Checklist

This document tracks everything that should be addressed before making the
repository fully public. Items are grouped by theme. Completed items are
checked off.

---

## 🔐 Security & Credentials

- [x] **Personal e-mail removed from `tf/settings-template.py`**
  Replace `lucash@fastmail.com` → `admin@example.com`.

- [x] **Hardcoded MariaDB passwords removed from `docker-compose-template.yml`**
  Replace `MLNNpxjPbpjdiFCO3K6bOkL5W` / `Xav716CIwmjdsFd2wmPF8qvg3` → `<CHANGE_ME_…>`.

- [x] **Let's Encrypt e-mail replaced in `docker-compose-template.yml`**
  Replace `it@tekniskfysik.se` → `your-email@example.com`.

- [ ] **Font Awesome kit ID in `base.html`**
  `https://kit.fontawesome.com/c6e9b99eeb.js` embeds a kit ID tied to a specific
  Font Awesome account. Anyone forking the project will use your quota and you
  could block their domains at any time.
  **Options:**
  - Self-host Font Awesome (free tier, no CDN account needed), or
  - Document in README that users must create their own FA kit and substitute the URL.

  ```html
  <!-- rodatraden/templates/rodatraden/base.html, line 88 -->
  <script src="https://kit.fontawesome.com/c6e9b99eeb.js"></script>
  ```

---

## 🏷️ TF-Specific Naming & Content

- [ ] **`tf/` Django project directory**
  The project configuration directory is named `tf` (short for "Teknisk Fysik").
  For a generic open-source project this should be renamed, e.g. to `config/` or
  `rodatraden_project/`.

  This rename affects:
  - `manage.py` → `os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tf.settings')`
  - `tf/wsgi.py` → `os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tf.settings')`
  - `tf/settings-template.py` → `ROOT_URLCONF = 'tf.urls'`, `WSGI_APPLICATION = 'tf.wsgi.application'`
  - `Dockerfile` → `CMD ["gunicorn", ..., "tf.wsgi:application"]`
  - Any deployment guide or environment variable (`DJANGO_SETTINGS_MODULE`)

  **Example rename (bash):**
  ```bash
  mv tf config
  # Then update every reference to 'tf.' in Python files:
  find . -name "*.py" -exec sed -i 's/\btf\.\(settings\|urls\|wsgi\)\b/config.\1/g' {} +
  ```

- [ ] **Hardcoded "Teknisk Fysik i Umeå" text in templates**

  Several templates contain content that is specific to the original programme:

  | File | Line | Content |
  |------|------|---------|
  | `rodatraden/templates/rodatraden/index.html` | 19 | "…kurserna på Teknisk fysik i Umeå" |
  | `rodatraden/templates/rodatraden/profile/profile_list.html` | 24 | "Som student på Teknisk Fysik i Umeå…" |
  | `rodatraden/templates/rodatraden/profile/profile_detail.html` | 128 | "Forsknings- och utvecklingsprojekt inom teknisk fysik" (hardcoded course name) |

  **Suggested fix:** Move these strings to a site-wide settings variable (e.g.
  `SITE_PROGRAMME_NAME`) configured in `settings.py`, or make the texts generic
  ("your programme" / "ditt program").

- [ ] **Hardcoded UMU video link in `block_detail.html`**
  ```html
  <!-- block_detail.html, line 90 -->
  <a href="http://www.tp.umu.se/tekniskfysik/Instruktionsvideo_R%C3%B6daTr%C3%A5den_v1.mp4">
  ```
  This link points to an internal server at Umeå University that other deployments
  won't have. Either remove the link, make it configurable via settings, or
  replace with a generic help text.

- [ ] **`Exam` model docstring**
  ```python
  # rodatraden/models.py, line 753
  class Exam(models.Model):
      """Exams such as teknisk fysik."""
  ```
  Update to a generic description, e.g. `"""Degree/exam definitions."""`.

- [ ] **Comment in `forms.py`**
  ```python
  # forms.py, line 285
  # (probably only TF)
  ```
  Either remove the comment or expand it to explain why `Exam.objects.first()`
  is used as default—for a new installation this will return `None`.

---

## 🛠️ Setup From Scratch / Onboarding

- [ ] **Migrations excluded from version control**
  `.gitignore` excludes `rodatraden/migrations/0*_*.py`, meaning a fresh clone has
  **no migration files**. The README already mentions `makemigrations`, but this is
  non-standard for an open-source Django project. Consider either:
  - Committing initial migrations (common practice), or
  - Adding a note in the README clearly explaining that `makemigrations` *must* be
    run before `migrate` on a fresh clone (the current instructions already mention
    this but it is easy to miss).

- [ ] **Required initial data has no fixture or seed script**
  After a fresh `migrate`, the database is empty. The admin panel requires manually
  creating:
  - **Institutioner** (Departments)
  - **Nivåer** (Levels, e.g. "Grundläggande" / "Avancerat")
  - **Tidsperioder** (Time periods — the week offsets for each läsperiod)
  - **Akademiska år** (Academic years, if `AcademicYear` model is still in use)
  - **Spår** / **Profiler** (Tracks / Profiles)

  More critically, `Course` has hard-coded `default=1` for `department` and
  `level`:
  ```python
  # models.py
  department = models.ForeignKey(Department, ..., default=1)
  level      = models.ForeignKey(Level,      ..., default=1)
  ```
  If the first migrated DB doesn't have `Department.id=1` or `Level.id=1`, course
  creation will fail with an `IntegrityError`.

  **Recommended fix:** Provide an `initial_data.json` fixture (or a
  `create_initial_data` management command) that seeds the required records, and
  remove or change the hard-coded `default=1`.

  ```bash
  # Once you have the desired initial data in the DB, export it:
  python manage.py dumpdata rodatraden.Department rodatraden.Level \
      rodatraden.TimePeriod --indent 2 -o rodatraden/fixtures/initial_data.json
  # Then load with:
  python manage.py loaddata initial_data
  ```

- [ ] **`Dockerfile` runs `collectstatic` at build time without settings**
  ```dockerfile
  RUN python manage.py collectstatic --noinput
  ```
  This works when a `tf/settings.py` is present in the image (e.g. baked in or
  mounted). If the settings file is supplied via environment variable at runtime,
  the build step will fail. Consider deferring `collectstatic` to the `CMD`
  entrypoint or a startup script.

- [ ] **`requirements.txt` is unpinned**
  All packages use floating versions (`django`, `Pillow`, etc.). This means
  `pip install -r requirements.txt` will install whatever is newest at that moment,
  which can break the build silently over time.
  **Fix:** Pin versions with `pip freeze > requirements-lock.txt` and use that for
  production installs:
  ```bash
  pip freeze | grep -v "^-e" > requirements-lock.txt
  ```

---

## 📝 Documentation & README

- [x] **Duplicate `#### Windows` heading in README.md** — removed.

- [x] **`DOCKER_README.md` contains server-specific paths** — added disclaimer note.

- [ ] **README still references Django 2.2 documentation links**
  Multiple links point to `https://docs.djangoproject.com/en/2.2/…`. Update to
  `https://docs.djangoproject.com/en/stable/…`.

- [ ] **README "Clean install" section uses Swedish admin labels without translation**
  The section mentions "akademiska år", "institutioner", "Nivåer" etc. without
  explaining what each field means functionally. Add a short English note for
  non-Swedish contributors.

- [ ] **README "About Django" section says "Teknisk Fysik is more familiar with Python"**
  Line 10: generalise to remove the programme-specific reasoning.

- [ ] **`DOCKER_README.md` internal paths and service names**
  Paths such as `/root/3dlabbetwiki/`, log lines referencing
  `3dlabbetwiki-reverse-proxy-1`, and the command `cd /root/3dlabbetwiki` are
  specific to the original server. These should be replaced with generic placeholders.

---

## 🐛 Code Quality / Pending TODOs

- [ ] **`urls.py` TODO — `<int:pk>` on user routes**
  ```python
  # rodatraden/urls.py, line 135
  # TODO: The <int:pk> is only to avoid complaints by the generic view. This
  # should be removed, but I can't be arsed right now. Double security perhaps?
  path('anvandare/<str:username>/<int:pk>/andra', ...),
  ```
  The `<int:pk>` in the URL is redundant (the view looks up by `username`), and
  the comment is not suitable for a public repo. Either clean up the URL pattern
  or document *why* the pk is kept.

- [ ] **`views.py` XXX — confusing `category_sum` vs `categories_sum`**
  ```python
  # rodatraden/views.py, line 1375
  # XXX: The variables name will be confusingly similar until I figure out how category_sum works.
  categories_sum = [float(sum) for sum in category_sum.values()]
  ```
  Rename one variable to resolve the confusion, or document the distinction.

- [ ] **`views.py` XXX — `enable=0` / `enable=false` bug**
  ```python
  # rodatraden/views.py, line 1726
  # XXX: Will also be true for "enable=0" or "enable=false" etc.
  if (shouldEnable):
      block.should_verify_prerequisites = True
  ```
  Any non-empty string (including `"0"` or `"false"`) will enable the flag. Fix
  with an explicit string comparison:
  ```python
  block.should_verify_prerequisites = shouldEnable.lower() in ('1', 'true', 'yes')
  ```

- [ ] **`models.py` XXX — `Profile` doubles as block schedule view settings**
  ```python
  # rodatraden/models.py, line 238
  # XXX: The base block should be its own model, and not have to be a profile
  # piggybacking of the view settings.
  ```
  This is a design debt item. Document it as a known issue or open a separate
  issue for it before going public.

- [ ] **`profile_detail.html` hardcoded content with draft marker**
  ```html
  {# Hardcoded for now, without links. This is a first draft. #}
  ```
  The "Projekt och Teknik för hållbar utveckling" section is hardcoded with
  TF-specific course names. Either remove it, make it database-driven, or replace
  with a generic placeholder.

- [ ] **Typo in `views.py`: `prinvate_courses_json`**
  ```python
  # rodatraden/views.py, line 1379
  prinvate_courses_json = [course.as_json() for course in block.privatecourses.all()]
  ```
  Should be `private_courses_json`.

---

## 🌐 Internationalisation

- [ ] **Language is hard-coded to Swedish**
  `settings-template.py` has `LANGUAGE_CODE = 'sv-se'` and all UI text is in
  Swedish. For an open-source tool usable by other universities this could be
  a barrier. At minimum, document this as a known limitation and explain how
  to change the language code.

---

## 🚀 Nice-to-Have Before Public Release

- [ ] Add a `CONTRIBUTING.md` explaining how to set up a local dev environment
  (venv, DB, initial data, superuser) in a single place.
- [ ] Add a `LICENSE` file if one is not already present.
- [ ] Consider adding a `.env.example` file as the canonical reference for all
  environment variables needed to run the project.
- [ ] Run `python manage.py check --deploy` and address any warnings.
