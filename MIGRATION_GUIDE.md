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

### Borttagna fält
- **`Course.closed`** — Oanvänt fält borttaget.
- **`Course.approved`** — Legacy-fält borttaget. Fältet användes ursprungligen
  för att admins skulle kunna godkänna kurser som studenter föreslagit. Det
  arbetsflödet är borttaget och fältet var ej synligt i några mallar.

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

Eftersom migreringsfiler inte versionshanteras i detta projekt behöver de
skapas lokalt:

```bash
python manage.py makemigrations rodatraden
```

Detta bör skapa migrering(ar) som:
- Tar bort `Course.closed`
- Tar bort `Course.approved`
- Lägger till `CourseOccasion.auto_generated`
- Skapar `CourseScheduleSegment`-modellen med behörigheten
  `can_manage_scheduling`

### 5. Granska migreringen (valfritt)

```bash
python manage.py sqlmigrate rodatraden <nummer>
```

### 6. Tillämpa migreringarna

```bash
python manage.py migrate
```

### 7. Samla statiska filer

```bash
python manage.py collectstatic --noinput
```

### 8. Tilldela behörighet

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

### 9. Importera schemaläggningssegment

Segmenten för befintliga kurser kan genereras automatiskt från befintliga
kurstillfällen:

```bash
# Förhandsvisning (ingen data ändras)
python manage.py infer_course_scheduling

# Tillämpa
python manage.py infer_course_scheduling --apply
```

### 10. Validera

Kontrollera att segmenten matchar befintliga kurstillfällen:

```bash
python manage.py validate_course_schedule_parity
```

### 11. Starta om servern

Starta om webbservern (t.ex. IIS, gunicorn, eller liknande).

## Felsökning

| Problem | Lösning |
|---------|---------|
| `makemigrations` skapar oväntade migreringar | Kontrollera att inga gamla migreringsfiler finns kvar |
| Behörighetsfelet vid schemaläggning | Tilldela `can_manage_scheduling` (steg 8) |
| Segment saknas | Kör `infer_course_scheduling --apply` (steg 9) |
