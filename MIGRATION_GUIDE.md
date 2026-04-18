# Migration Guide - Automatic Scheduling

This guide describes how to upgrade a production server with the new
automatic scheduling functionality.

## Summary of changes

### New features
- **`CourseScheduleSegment` model** - Rules for when a course is offered
  (period, frequency, start/end year, excluded years).
- **Scheduling card** on course detail pages - CRUD for segments + an
  "Apply" action to preview and create/remove course occasions per course.
- **Global generation tool** at `/verktyg/` - Generate course occasions for
  all years based on all course segments.
- **`auto_generated` field** on `CourseOccasion` - Marks occasions created
  automatically so they can be managed separately.
- **`can_manage_scheduling` permission** - Restricts scheduling actions to
  selected users.

### Removed models
- **`AcademicYear`** - Removed. `CourseOccasion.year` is now a plain
  `IntegerField` (same approach as `PrivateCourse.year`).
  Display titles like "20/21" are computed by `academic_year_title()`.
  Year options in forms are generated dynamically (current year +/- 10), so
  no pre-created database rows are needed.
- **`ensure_academic_years` management command** - Removed.

### Removed fields
- **`Course.closed`** - Removed unused field.

### Unchanged fields
- **`CourseOccasion.contact_name`** and **`CourseOccasion.contact_email`** -
  Still available on course occasions. These are **not** copied automatically
  during scheduling and can still be edited manually per occasion.

## Step-by-step

### 1. Backup

```bash
# Copy database before migration
cp mydatabase mydatabase.backup_$(date +%Y%m%d)
```

### 2. Pull latest code

```bash
git pull origin main
```

### 3. Install dependencies (if updated)

```bash
pip install -r requirements.txt
```

### 4. Run the upgrade script

If you do not want to sync one specific migration file across environments,
use the upgrade script.

The script will:
- run an empty `makemigrations` locally with the next available number,
- include a branch-based suffix in the migration name (for example
  `0007_remove_incremental_years_copilot_remove_increment.py`),
- write the required data-migration operations into that file,
- run `migrate`.

```bash
python upgrade_remove_incremental_years.py
```

Yes: this means each environment gets its own local migration file in
`rodatraden/migrations/`, and that generated file is then applied by Django
through `migrate`.

This matches a workflow where `makemigrations` is usually local. For this
specific upgrade, use the script instead of plain `makemigrations`, since
Django cannot safely infer values for the new required `year` field.

### 5. Collect static files

```bash
python manage.py collectstatic --noinput
```

### 6. Grant permission

Grant `can_manage_scheduling` to relevant users via admin
(`/admin/auth/user/`) or via script:

```bash
python manage.py shell -c "
from django.contrib.auth.models import Permission
from django.contrib.auth import get_user_model
User = get_user_model()
perm = Permission.objects.get(codename='can_manage_scheduling')
for user in User.objects.filter(is_staff=True):
    user.user_permissions.add(perm)
    print(f'Granted permission to {user.username}')
"
```

### 7. Import scheduling segments

Generate segments for existing courses from existing course occasions:

```bash
# Preview only (no data changes)
python manage.py infer_course_scheduling

# Apply changes
python manage.py infer_course_scheduling --apply
```

### 8. Validate

Verify that segments match existing course occasions:

```bash
python manage.py validate_course_schedule_parity
```

### 9. Restart server

Restart your web server (for example IIS, gunicorn, or equivalent).

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `makemigrations` wants to create new migrations | For this upgrade, run `python upgrade_remove_incremental_years.py` instead of plain `makemigrations`. |
| Scheduling permission error | Grant `can_manage_scheduling` (step 6). |
| Missing segments | Run `python manage.py infer_course_scheduling --apply` (step 7). |
| `CourseOccasion.year` is NULL after migration | Step 4 was not executed correctly. Re-run `python upgrade_remove_incremental_years.py` and verify migration output. |

## PR description text

You can copy this into the PR:

```text
Upgrading from master to this branch requires a branch-aware upgrade migration step.

Run on each environment:
1) Activate your virtual environment
2) python upgrade_remove_incremental_years.py

The script creates a local empty migration with the next available number and a
branch-based name, injects the required data migration (AcademicYear/TimePeriod ->
year/start), and runs migrate.

Do not use plain makemigrations for this specific upgrade step.
```
