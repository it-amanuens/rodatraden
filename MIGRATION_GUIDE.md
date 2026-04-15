# Migreringsguide — Automatisk schemaläggning

Den här guiden beskriver hur du uppgraderar produktionsservern med de nya
schemaläggningsfunktionerna.

## Sammanfattning av ändringar

### Nya funktioner
- **CourseScheduleSegment-modell** — Regler som styr när en kurs ges (period,
  frekvens, start/slutår, undantagsår).
- **Schemaläggningskort** på kurssidan — CRUD för segment + "Verkställ"-knapp
  som förhandsgranskar och skapar/tar bort kurstillfällen per kurs.
- **Globalt genereringsverktyg** på `/verktyg/` — Generera kurstillfällen för
  alla år baserat på alla kursers segment.
- **`auto_generated`-fält** på CourseOccasion — Markerar kurstillfällen som
  skapats automatiskt så att de kan hanteras separat.
- **Behörighet `can_manage_scheduling`** — Begränsar schemaläggning till
  utvalda användare.

### Borttagna modeller
- **`AcademicYear`** — Hela modellen är borttagen. `CourseOccasion.year` är nu
  ett vanligt `IntegerField` (precis som `PrivateCourse.year`).
  Visningstitlar som "20/21" beräknas automatiskt av `academic_year_title()`.
  Årval i formulär genereras dynamiskt (nuvarande år ± 10) — inga
  databasposter behöver skapas i förväg.
- **`ensure_academic_years`-kommandot** — Borttaget (inte längre behövt).

### Borttagna fält
- **`Course.closed`** — Oanvänt fält borttaget.

### Oförändrade fält
- **`CourseOccasion.contact_name`** och **`CourseOccasion.contact_email`** —
  Kvar som förut på kurstillfällen. Dessa kopieras **inte** automatiskt vid
  schemaläggning, men kan fortfarande redigeras manuellt per kurstillfälle.

## Steg-för-steg

### 1. Säkerhetskopia

```bash
# Kopiera databasen innan migrering
cp mydatabase mydatabase.backup_$(date +%Y%m%d)
```

### 2. Hämta senaste koden

```bash
git pull origin main
```

### 3. Installera beroenden (om uppdaterade)

```bash
pip install -r requirements.txt
```

### 4. Kopiera år-data från AcademicYear till CourseOccasion (INNAN makemigrations)

Innan du kör `makemigrations` måste befintliga FK-värden kopieras. Kör
följande i Django-shell:

```bash
python manage.py shell -c "
from rodatraden.models import CourseOccasion
# This only works BEFORE the model changes are applied.
# If academic_year_id still exists, copy the year values.
from django.db import connection
cursor = connection.cursor()
cursor.execute('''
    UPDATE rodatraden_courseoccasion co
    SET year = (
        SELECT ay.year
        FROM rodatraden_academicyear ay
        WHERE ay.id = co.academic_year_id
    )
''')
print(f'Updated {cursor.rowcount} rows')
"
```

Alternativt kan du skapa en data-migrering (se steg 5).

### 5. Skapa migreringsfiler

```bash
python manage.py makemigrations rodatraden
```

Django kommer att skapa migrering(ar) som:
- Tar bort `Course.closed`
- Lägger till `CourseOccasion.auto_generated`
- Skapar `CourseScheduleSegment`-modellen
- **Lägger till `CourseOccasion.year` (IntegerField)**
- **Tar bort `CourseOccasion.academic_year` (ForeignKey)**
- **Tar bort `AcademicYear`-modellen**

**VIKTIGT**: Om Django frågar om fältet `year` bytt namn från
`academic_year`, svara **Nej** — det är ett nytt fält. Du kan behöva
justera migreringsordningen så att data kopieras innan FK:n tas bort.

### 6. Granska migreringen (valfritt)

```bash
python manage.py sqlmigrate rodatraden <nummer>
```

### 7. Tillämpa migreringarna

```bash
python manage.py migrate
```

### 8. Samla statiska filer

```bash
python manage.py collectstatic --noinput
```

### 9. Tilldela behörighet

Ge rätt användare behörigheten `can_manage_scheduling` via Djangos
admin-panel (`/admin/auth/user/`) eller med ett skript:

```bash
python manage.py shell -c "
from django.contrib.auth.models import Permission
from django.contrib.auth import get_user_model
User = get_user_model()
perm = Permission.objects.get(codename='can_manage_scheduling')
for user in User.objects.filter(is_staff=True):
    user.user_permissions.add(perm)
    print(f'Gav behörighet till {user.username}')
"
```

### 10. Importera schemaläggningssegment

Segmenten för befintliga kurser kan genereras automatiskt från befintliga
kurstillfällen:

```bash
# Förhandsvisning (ingen data ändras)
python manage.py infer_course_scheduling

# Tillämpa
python manage.py infer_course_scheduling --apply
```

### 11. Validera

Kontrollera att segmenten matchar befintliga kurstillfällen:

```bash
python manage.py validate_course_schedule_parity
```

### 12. Starta om servern

Starta om webbservern (t.ex. IIS, gunicorn, eller liknande).

## Felsökning

| Problem | Lösning |
|---------|---------|
| `makemigrations` skapar oväntade migreringar | Kontrollera att inga gamla migreringsfiler finns kvar |
| Behörighetsfelet vid schemaläggning | Tilldela `can_manage_scheduling` (steg 9) |
| Segment saknas | Kör `infer_course_scheduling --apply` (steg 10) |
| `CourseOccasion.year` är NULL efter migrering | Steg 4 missades — kör SQL-kopieringen manuellt |
