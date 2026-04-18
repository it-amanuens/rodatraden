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

### 4. Skapa migreringsfiler

```bash
python manage.py makemigrations rodatraden
```

### 5. Redigera migreringen (viktigt för befintlig data)

För databaser som redan innehåller kurstillfällen behöver du justera den
lokalt skapade migreringen så att data kopieras innan gamla FK-fält tas bort.

Säker ordning i migreringen:
- Lägg till `CourseOccasion.year` som **nullable** (`null=True`) först.
- Lägg till `CourseOccasion.start` (om den inte redan finns) först.
- Kör en data-kopiering (SQL eller `RunPython`):
  - `CourseOccasion.year` från `AcademicYear.year`
  - `CourseOccasion.start` från `TimePeriod.week`
- Ta bort gamla FK-fält (`academic_year`, `time_period`).
- Ta bort modellerna `AcademicYear` och `TimePeriod`.
- Avsluta med att göra `CourseOccasion.year` icke-nullable.

Exempel-SQL (i migrationsfilen, efter att `year`/`start` har lagts till):

```sql
UPDATE rodatraden_courseoccasion co
SET year = ay.year
FROM rodatraden_academicyear ay
WHERE ay.id = co.academic_year_id;

UPDATE rodatraden_courseoccasion co
SET start = tp.week
FROM rodatraden_timeperiod tp
WHERE tp.id = co.time_period_id;
```

Utan detta steg riskerar befintliga rader att få felaktiga värden eller tappa
år/period-information.

Typiska operationer i den lokala migreringen:
- Tar bort `Course.closed`
- Lägger till `CourseOccasion.auto_generated`
- Skapar `CourseScheduleSegment`-modellen
- **Lägger till `CourseOccasion.year` (IntegerField)**
- **Tar bort `CourseOccasion.academic_year` (ForeignKey)**
- **Tar bort `AcademicYear`-modellen**

**VIKTIGT**: Om Django frågar om fältet `year` bytt namn från
`academic_year`, svara **Nej** — det är ett nytt fält.

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
