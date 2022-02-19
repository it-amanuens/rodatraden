from datetime import datetime, timedelta
from time import strptime
from django.db import models
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils.text import slugify

# Get the user model
User = get_user_model()

def get_unique_slug(to_slug, model):
    """Generate unique slug for insert in model.

    Given a string to be slugified, tries to find an unique slug by looking at
    the given model, appending an increasing number to the slug if required.

    Keyword arguments:
    to_slug -- string to be slugified
    model -- the model to check for duplicates in
    """

    slug = slugify(to_slug)
    unique_slug = slug
    num = 1
    while model.objects.filter(slug=unique_slug).exists():
        unique_slug = '{}-{}'.format(slug, num)
        num += 1

    return unique_slug


class Report(models.Model):
    """User can send reports about the site."""

    from_email = models.EmailField(verbose_name='Din mailadress')
    subject = models.CharField(max_length=250, verbose_name='Ämne')
    message = models.TextField(max_length=5000, verbose_name='Innehåll')
    # If the report is handled
    fixed = models.BooleanField(default=False, verbose_name='Hanterat')
    note = models.TextField(max_length=5000, verbose_name='Kommentarer',
            blank=True, null=True)
    slug = models.SlugField(unique=True, editable=False)

    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False, verbose_name='Skapad')
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False, verbose_name='Uppdaterad')

    __original_subject = None

    def __init__(self, *args, **kwargs):
        """Extend __init__ to store original title"""

        super().__init__(*args, **kwargs)
        self.__original_subject = self.subject

    def __str__(self):
        return self.subject

    def save(self, *args, **kwargs):
        """Extend save to add unique slug."""

        if self.subject != self.__original_subject or not self.slug:
            self.slug = get_unique_slug(to_slug=self.subject, model=Report)

        self.__original_subject = self.subject

        super().save(*args, **kwargs)


class Department(models.Model):
    """Different departments at the university."""

    title = models.CharField(max_length=250)
    description = models.TextField(max_length=5000, blank=True, null=True,
            verbose_name='Beskrivning')
    abbreviation = models.CharField(max_length=20, blank=True, null=True)
    url = models.URLField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = 'Institut'
        verbose_name_plural = 'Institution'


class Level(models.Model):
    """Course can have different levels, such as 'Grundläggande' and
    'Avancerat'.
    """

    title = models.CharField(max_length=250)
    description = models.TextField(max_length=5000, blank=True, null=True,
            verbose_name='Beskrivning')

    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)

    def __str__(self):
        return self.title

    def first_letter(self):
        """Return first letter of title."""

        return self.title[0]

    class Meta:
        verbose_name = 'Nivå'
        verbose_name_plural = 'Nivåer'


class AcademicYear(models.Model):
    """'Akademiska perioder' to which all courses is associated with. 

    For example, year 2018 is associated to period 18/19.
    """

    title = models.CharField(max_length=250)
    year = models.IntegerField()

    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = 'Akademiskt år'
        verbose_name_plural = 'Akademiska år'


class TimePeriod(models.Model):
    """'Läsperioder' to which all courses is associated with.

    For example, läsperiod 1 is at week 0 of the academic year.
    """
    title = models.CharField(max_length=250)
    week = models.IntegerField()
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = 'Tidsperiod'
        verbose_name_plural = 'Tidsperioder'


class Profile(models.Model):
    """Different profiles for the program"""

    title = models.CharField(max_length=250, verbose_name='Titel')
    description = models.TextField(max_length=5000, blank=True, null=True,
            verbose_name='Beskrivning')
    abbreviation = models.CharField(max_length=20, blank=True, null=True,
            verbose_name='Förkortning')
    image = models.ImageField(upload_to='profiles/', blank=True, null=True,
            verbose_name='Bild')
    slug = models.SlugField(unique=True, editable=False)

    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)

    __original_title = None

    def __init__(self, *args, **kwargs):
        """Extend __init__ to store original title"""

        super().__init__(*args, **kwargs)
        self.__original_title = self.title

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        """Extend save to add unique slug."""

        if self.title != self.__original_title or not self.slug:
            self.slug = get_unique_slug(to_slug=self.title, model=Profile)

        self.__original_title = self.title

        super().save(*args, **kwargs)


class Category(models.Model):
    """Categories for exam goals."""

    title = models.CharField(max_length=250)
    description = models.TextField(max_length=5000, blank=True, null=True,
            verbose_name='Beskrivning')
    abbreviation = models.CharField(max_length=20, blank=True, null=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    slug = models.SlugField(max_length=100, unique=True, editable=False)

    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)

    __original_title = None

    def __init__(self, *args, **kwargs):
        """Extend __init__ to store original title"""

        super().__init__(*args, **kwargs)
        self.__original_title = self.title

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        """Extend save to add unique slug."""

        if self.title != self.__original_title or not self.slug:
            self.slug = get_unique_slug(to_slug=self.title, model=Category)

        self.__original_title = self.title

        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('category-detail', kwargs={'slug': self.slug})

    def time_since_updated(self):
        """Get time since last updated in specific format.

        Returns the time since changed in a specific format at a fixed
        resolution. If more than 60 seconds, present the number of minutes. If
        more than 60 minutes, present the number of hours and so on.
        """

        # Time is stored as UTC as a django standard so it has to be converted
        update_time = self.updated_at + timedelta(hours=2)
        time = datetime.now()

        if update_time.day == time.day:
            if update_time.hour == time.hour:
                if update_time.minute == time.minute:
                    return str(time.second - update_time.second) + ' sekund(er) sen'
                return str(time.minute - update_time.minute) + ' minut(er) sen'
            return str(time.hour - update_time.hour) + ' timma(r) sen'
        else:
            if update_time.month == time.month:
                return str(time.day - update_time.day) + ' dag(ar) sen'
            else:
                if update_time.year == time.year:
                    return str(time.month - update_time.month) + ' månad(er) sen'

        return update_time


class Track(models.Model):
    """'Spår' that is connected to profiles."""

    title = models.CharField(max_length=250)
    description = models.TextField(max_length=5000, blank=True, null=True,
            verbose_name='Beskrivning')
    # If the track is valid
    valid = models.BooleanField(default=True, blank=True, null=True)
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE)
    slug = models.SlugField(unique=True, editable=False)

    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)

    __original_title = None

    def __init__(self, *args, **kwargs):
        """Extend __init__ to store original title"""

        super().__init__(*args, **kwargs)
        self.__original_title = self.title

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        """Extend save to add unique slug."""

        if self.title != self.__original_title or not self.slug:
            self.slug = get_unique_slug(to_slug=self.title, model=Track)

        self.__original_title = self.title

        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'Spår'
        verbose_name_plural = 'Spår'


class Course(models.Model):
    """Courses. Self-explanatory."""

    title = models.CharField(verbose_name='Kursnamn', max_length=250)
    description = models.TextField(max_length=5000, blank=True, null=True,
            verbose_name='Beskrivning')
    code = models.CharField(max_length=10, verbose_name='Kod')
    ects = models.DecimalField(verbose_name='Poäng',
            max_digits=3,decimal_places=1, default='7.5')
    # If the course is approved
    approved = models.BooleanField(default=True, blank=True, null=True,
            verbose_name='Godkänd')
    # I think this is to check if the course will still continue
    closed = models.BooleanField(default=False, verbose_name='Stängd')
    note = models.CharField(max_length=250, blank=True, null=True)
    homepage_url = models.URLField(blank=True, null=True,
            verbose_name='Hemsida')
    evaluation_url = models.URLField(blank=True, null=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE,
            verbose_name='Institution', default=1)
    level = models.ForeignKey(Level, on_delete=models.CASCADE,
            verbose_name='Nivå', default=1)
    categories = models.ManyToManyField(Category, blank=True,
            through='CategoryCourse', verbose_name='Kategorier')
    tracks = models.ManyToManyField(Track, blank=True, verbose_name='Ingår')
    recommended = models.ManyToManyField(Track, blank=True,
            related_name='recommended_track', verbose_name='Rekommenderad',)
    prerequisites = models.ManyToManyField('self', blank=True,
            through='Prerequisite', symmetrical = False,
            verbose_name='Förkunskapskrav')
    slug = models.SlugField(max_length=100, unique=True, editable=False)

    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)

    __original_title = None

    def __init__(self, *args, **kwargs):
        """Extend __init__ to store original title"""
        super().__init__(*args, **kwargs)
        self.__original_title = self.title

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse('course-detail', kwargs={'slug': self.slug})

    # Override .save() to add unique slug
    def save(self, *args, **kwargs):
        """Extend save to add unique slug and save all courseoccasions."""

        if self.title != self.__original_title or not self.slug:
            self.slug = get_unique_slug(to_slug=self.title, model=Course)

        self.__original_title = self.title

        super().save(*args, **kwargs)

        # All corresponding courseoccasions are saved to update their slugs
        for courseoccasion in CourseOccasion.objects.filter(course=self):
            courseoccasion.save()

    def time_since_updated(self):
        """Get time since last updated in specific format.

        Returns the time since changed in a specific format at a fixed
        resolution. If more than 60 seconds, present the number of minutes. If
        more than 60 minutes, present the number of hours and so on.
        """

        # Time is stored as UTC so has to be converted
        update_time = self.updated_at + timedelta(hours=2)
        time = datetime.now()

        if update_time.day == time.day:
            if update_time.hour == time.hour:
                if update_time.minute == time.minute:
                    return str(time.second - update_time.second) + ' sekund(er) sen'
                return str(time.minute - update_time.minute) + ' minut(er) sen'
            return str(time.hour - update_time.hour) + ' timm(ar) sen'
        else:
            if update_time.month == time.month:
                return str(time.day - update_time.day) + ' dag(ar) sen'
            else:
                if update_time.year == time.year:
                    return str(time.month - update_time.month) + ' månad(er) sen'

        return update_time

    def category_ects(self, category_sum):
        """Get the ects sum per category.

        Given an input dict with the wanted categories as keys, loops through
        the models categories and adds their sum to the dict at the specific key
        (if the key exists)

        Keyword arguments:
        category_sum -- dict with category keys
        """

        for category in self.categorycourse_set.all():
            title = category.category.title
            # Only sum if key is existent in dict
            if title in category_sum:
                category_sum[title] += category.ects

        return category_sum


class Prerequisite(models.Model):
    """Prerequisites for a course.

    NOTE: This is not important, but rather a left-over from the old website,
    which stored these connections with dates.
    """
    
    course = models.ForeignKey(Course, related_name = 'curr_course',
            on_delete=models.CASCADE)
    prereq = models.ForeignKey(Course, related_name = 'prereq_course',
            on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)

    def __str__(self):
        return '{}->{}'.format(self.prereq.title, self.course.title)


class CategoryCourse(models.Model):
    """Connects categories to course with a given ects."""

    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    ects = models.DecimalField(max_digits=3,decimal_places=1)

    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)


class CourseOccasion(models.Model):
    """Occasions for a given course."""
    weeks = models.IntegerField(verbose_name='Längd')
    official = models.BooleanField(default=True, verbose_name='Godkänd')
    note = models.TextField(max_length=250, blank=True, null=True,
            verbose_name="Anteckning")
    homepage_url = models.URLField(blank=True, null=True)
    evaluation_url = models.URLField(blank=True, null=True)
    syllabus_url = models.URLField(blank=True, null=True)
    contact_name = models.CharField(max_length=250, blank=True, null=True,
            verbose_name='Kontaktperson')
    contact_email = models.EmailField(blank=True, null=True,
            verbose_name='Kontaktadress')
    course = models.ForeignKey(Course, on_delete=models.CASCADE,
            verbose_name='Kurs')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE,
            verbose_name='År')
    time_period = models.ForeignKey(TimePeriod, on_delete=models.CASCADE,
            verbose_name='Läsperiod')
    slug = models.SlugField(max_length=100, unique=True, editable=False)

    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)

    def __str__(self):
        return self.course.title + ' - ' + str(self.academic_year.year)

    def save(self, *args, **kwargs):
        """Extend save to add unique slug."""

        if not self.slug:  # Create a new slug if it doesn't exist
            self.slug = get_unique_slug(to_slug=self.course.title,
                                        model=CourseOccasion)
        else:
            # To avoid trailing number
            course_slug = self.course.slug.split('-')
            courseocc_slug = self.slug.split('-')

            # Remove trailing number if applicable
            if len(course_slug) != len(courseocc_slug):
                courseocc_slug = courseocc_slug[:-1]

            if not "".join(course_slug) == "".join(courseocc_slug):
                self.slug = get_unique_slug(to_slug=self.course.title,
                        model=CourseOccasion)

        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('courseoccasion-detail', kwargs={'year':
            self.academic_year.year, 'slug': self.slug})

    def as_json(self):
        """Function to return important data as dict for usage in json
        requests."""

        return dict(
                year=self.academic_year.year,
                start=self.time_period.week,
                title=self.course.title,
                ects=self.course.ects,
                weeks=self.weeks,
                prerequisites=1,
                slug = self.slug,
                is_priv = '',
                )

    def get_tempo(self):
        """Return in percent the courseoccasion tempo.

        7.5 hp in four weeks is 100%
        """

        return round(self.course.ects/self.weeks*200/3, 0)

    def category_ects(self, category_sum):
        """Pass through.
        
        See category_ects in the course model.
        """

        self.course.category_ects(category_sum)


class Exam(models.Model):
    """Exams such as teknisk fysik."""

    title = models.CharField(max_length=250, verbose_name='Examensnamn')
    ects = models.DecimalField(max_digits=4,decimal_places=1,
            verbose_name='Poäng')
    description = models.TextField(max_length=5000, blank=True, null=True,
            verbose_name='Beskrivning')
    code = models.CharField(max_length=10, blank=True, null=True)
    note = models.CharField(max_length=250, blank=True, null=True)
    categories = models.ManyToManyField(Category, through='CategoryExam',
            blank=True)
    slug = models.SlugField(unique=True, editable=False)

    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False, verbose_name='Skapad')
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False, verbose_name='Senast uppdaterad')

    __original_title = None

    def __init__(self, *args, **kwargs):
        """Extend __init__ to store original title"""

        super().__init__(*args, **kwargs)
        self.__original_title = self.title

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse('exam-detail', kwargs={'slug': self.slug})

    def save(self, *args, **kwargs):
        """Extend save to add unique slug."""

        if self.title != self.__original_title or not self.slug:
            self.slug = get_unique_slug(to_slug=self.title, model=Exam)

        self.__original_title = self.title

        super().save(*args, **kwargs)


class CategoryExam(models.Model):
    """Connection between exam and categories with a given ects."""

    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    ects = models.DecimalField(max_digits=3,decimal_places=1)

    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)


class PrivateCourse(models.Model):
    """User specified courses."""
    title = models.CharField(max_length=250, verbose_name='Kursnamn')
    ects = models.DecimalField(max_digits=3,decimal_places=1,
            verbose_name='Poäng')
    note = models.CharField(max_length=250, blank=True, null=True)
    weeks = models.IntegerField(verbose_name='Längd')
    # Users can specify their own years and starts
    year = models.IntegerField(verbose_name='Startår')
    start = models.IntegerField(verbose_name='Startvecka')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    categories = models.ManyToManyField(Category,
            through='PrivateCourseCategory')
    slug = models.SlugField(unique=False, editable=False)

    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)

    __original_title = None

    def __init__(self, *args, **kwargs):
        """Extend __init__ to store original title"""

        super().__init__(*args, **kwargs)
        self.__original_title = self.title

    def __str__(self):
        return self.title + ' - ' + self.user.username

    def get_absolute_url(self):
        return reverse('privatecourse-detail', kwargs={'username':
            self.user.username, 'slug': self.slug})

    def save(self, *args, **kwargs):
        """Extend save to add unique slug."""

        if self.title != self.__original_title or not self.slug:
            self.slug = get_unique_slug(to_slug=self.title,
                    model=PrivateCourse)

        self.__original_title = self.title

        super().save(*args, **kwargs)

    def as_json(self):
        """Function to return important data as dict for usage in json
        requests."""

        return dict(
                year=self.year,
                start=self.start,
                title=self.title,
                ects=self.ects,
                weeks=self.weeks,
                prerequisites=1,
                slug = self.slug,
                is_priv = 1,
                )

    def category_ects(self, category_sum):
        """Get the ects sum per category.

        Given an input dict with the wanted categories as keys, loops through
        the models categories and adds their sum to the dict at the specific key
        (if the key exists)

        Keyword arguments:
        category_sum -- dict with category keys
        """

        for category in self.privatecoursecategory_set.all():
            title = category.category.title
            # Only sum if key is existent in dict
            if title in category_sum:
                category_sum[title] += category.ects

        return category_sum


class PrivateCourseCategory(models.Model):
    """Connection between private courses and categories with a given ects."""

    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    private_course = models.ForeignKey(PrivateCourse, on_delete=models.CASCADE)
    ects = models.DecimalField(max_digits=3,decimal_places=1)

    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)


class Block(models.Model):
    """Blockscheman!"""

    title = models.CharField(max_length=250, verbose_name='Titel')
    description = models.TextField(max_length=5000, blank=True, null=True,
            verbose_name='Beskrivning')
    start_year = models.IntegerField(default=datetime.now().year,
            verbose_name='Startår')
    private = models.BooleanField(default=True, verbose_name='Privat')
    note = models.CharField(max_length=250, blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    courseoccasions = models.ManyToManyField(CourseOccasion, blank=True)
    privatecourses = models.ManyToManyField(PrivateCourse)
    track = models.ForeignKey(Track, on_delete=models.CASCADE, null=True,
            blank=True, verbose_name='Spår')
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, 
            verbose_name='Examen')
    slug = models.SlugField(unique=False, editable=False)

    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)

    __original_title = None

    def __init__(self, *args, **kwargs):
        """Extend __init__ to store original title"""

        super().__init__(*args, **kwargs)
        self.__original_title = self.title

    def __str__(self):
        return self.title + ' - ' + self.user.username

    def save(self, *args, **kwargs):
        """Extend save to add unique slug."""

        if self.title != self.__original_title or not self.slug:
            self.slug = get_unique_slug(to_slug=self.title, model=Block)

        self.__original_title = self.title

        super().save(*args, **kwargs)

    def total_course_ects(self):
        """Sum the total ects for the block.

        Loops over all courseoccasions and adds together the total ECTS for the
        block.
        """

        ects_sum = 0

        for courseoccasion in self.courseoccasions.all():
            ects_sum += courseoccasion.course.ects

        for privatecourse in self.privatecourses.all():
            ects_sum += privatecourse.ects

        return ects_sum

    def total_category_ects(self, category_sum):
        """Sum all ects per categories for a block.
        
        Loops over all of the courses and private courses in the block and sums
        the total ects together.

        Keyword arguments:
        category_sum -- dict with category keys
        """
        for courseoccasion in self.courseoccasions.all():
            courseoccasion.category_ects(category_sum)

        for privatecourse in self.privatecourses.all():
            privatecourse.category_ects(category_sum)

    def time_since_updated(self):
        """Get time since last updated in specific format.

        Returns the time since changed in a specific format at a fixed
        resolution. If more than 60 seconds, present the number of minutes. If
        more than 60 minutes, present the number of hours and so on.
        """

        # Time is stored as UTC so has to be converted
        update_time = self.updated_at + timedelta(hours=2)
        time = datetime.now()

        if update_time.day == time.day:
            if update_time.hour == time.hour:
                if update_time.minute == time.minute:
                    return str(time.second - update_time.second) + ' sekund(er) sen'
                return str(time.minute - update_time.minute) + ' minut(er) sen'
            return str(time.hour - update_time.hour) + ' timm(ar) sen'
        else:
            if update_time.month == time.month:
                return str(time.day - update_time.day) + ' dag(ar) sen'
            else:
                if update_time.year == time.year:
                    return str(time.month - update_time.month) + ' månad(er) sen'

        return update_time
