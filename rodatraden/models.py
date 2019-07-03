import datetime
from django.db import models
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils.text import slugify

# Get the user model
User = get_user_model()

INT_YEARS = [(x,x) for x in range(2012, 2022)]

# Create your models here.
class Department(models.Model):
    """
    Most likely departments at the university.
    """
    title = models.CharField(max_length=250)
    description = models.CharField(max_length=10000, blank=True, null=True)
    title_eng = models.CharField(max_length=250, blank=True, null=True)
    description_eng = models.CharField(max_length=10000, blank=True, null=True)
    abbreviation = models.CharField(max_length=20, blank=True, null=True)
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)

    def __str__(self):
        return self.title

class Level(models.Model):
    """
    Grundläggande or avancerad
    """
    title = models.CharField(max_length=250)
    description = models.CharField(max_length=10000, blank=True, null=True)
    title_eng = models.CharField(max_length=250, blank=True, null=True)
    description_eng = models.CharField(max_length=10000, blank=True, null=True)
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)

    def __str__(self):
        return self.title

class Profile(models.Model):
    """
    Program profiles
    """
    title = models.CharField(max_length=250)
    description = models.CharField(max_length=10000, blank=True, null=True)
    title_eng = models.CharField(max_length=250, blank=True, null=True)
    description_eng = models.CharField(max_length=10000, blank=True, null=True)
    abbreviation = models.CharField(max_length=20, blank=True, null=True)
    # Image storage
    # path will be MEDIA_ROOT/profiles
    # TODO: Look into height and width configurations, what is proper for this
    # application
    image = models.ImageField(upload_to='profiles/')
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)
    # Slug
    slug = models.SlugField(unique=True, editable=False)

    # Generate a slug that consists of the name and a number if not unique
    def _get_unique_slug(self):
        slug = slugify(self.title)
        unique_slug = slug
        num = 1
        # If the slug is not unique (entry with same title), append a number
        while Profile.objects.filter(slug=unique_slug).exists():
            unique_slug = '{}-{}'.format(slug, num)
            num += 1
        return unique_slug

    # Override .save() to add unique slug
    def save(self, *args, **kwargs):
        self.slug = ""
        self.slug = self._get_unique_slug()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class Category(models.Model):
    """
    Categories for different exam goals
    """
    title = models.CharField(max_length=250)
    description = models.CharField(max_length=10000, blank=True, null=True)
    title_eng = models.CharField(max_length=250, blank=True, null=True)
    description_eng = models.CharField(max_length=10000, blank=True, null=True)
    abbreviation = models.CharField(max_length=20, blank=True, null=True)
    # Image storage
    # path will be MEDIA_ROOT/categories
    # TODO: Look into height and width configurations, what is proper for this
    # application
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)
    # Slug
    slug = models.SlugField(max_length=100, unique=True, editable=False)

    # Generate a slug that consists of the name and a number if not unique
    def _get_unique_slug(self):
        slug = slugify(self.title)
        unique_slug = slug
        num = 1
        # If the slug is not unique (entry with same title), append a number
        while Category.objects.filter(slug=unique_slug).exists():
            unique_slug = '{}-{}'.format(slug, num)
            num += 1
        return unique_slug

    # Override .save() to add unique slug
    def save(self, *args, **kwargs):
        self.slug = ""
        self.slug = self._get_unique_slug()
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('category-detail', kwargs={'slug': self.slug})

    def __str__(self):
        return self.title

class Track(models.Model):
    """
    (Spår). Tracks can be connected to profiles
    """
    title = models.CharField(max_length=250)
    # If the track is valid
    valid = models.BooleanField(default=True, blank=True, null=True)
    description = models.CharField(max_length=10000, blank=True, null=True)
    title_eng = models.CharField(max_length=250, blank=True, null=True)
    description_eng = models.CharField(max_length=10000, blank=True, null=True)
    # Connected to profiles
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE)
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)
    # Slug
    slug = models.SlugField(unique=True, editable=False)

    # Generate a slug that consists of the name and a number if not unique
    def _get_unique_slug(self):
        slug = slugify(self.title)
        unique_slug = slug
        num = 1
        # If the slug is not unique (entry with same title), append a number
        while Track.objects.filter(slug=unique_slug).exists():
            unique_slug = '{}-{}'.format(slug, num)
            num += 1
        return unique_slug

    # Override .save() to add unique slug
    def save(self, *args, **kwargs):
        self.slug = ""
        self.slug = self._get_unique_slug()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class Course(models.Model):
    """
    Courses. Self-explanatory
    """
    title = models.CharField(verbose_name='Kursnamn', max_length=250)
    description = models.TextField(max_length=10000, blank=True, null=True,
            verbose_name='Beskrivning')
    # Kurskod
    code = models.CharField(max_length=10, verbose_name="Kod")
    # Points - no more than 3 digits and one decimal point
    ects = models.DecimalField(verbose_name='Poäng',
            max_digits=3,decimal_places=1, default="7.5")
    # If the course is approved
    approved = models.BooleanField(default=True, blank=True, null=True,
            verbose_name="Godkänd")
    # I think this is to check if the course will still continue
    closed = models.BooleanField(default=False, verbose_name="Stängd")
    # Note sure what this is for
    note = models.CharField(max_length=250, blank=True, null=True)
    title_eng = models.CharField(max_length=250, blank=True, null=True)
    description_eng = models.CharField(max_length=10000, blank=True, null=True)
    # Url homepages
    homepage_url = models.URLField(blank=True, null=True, verbose_name='Hemsida')
    evaluation_url = models.URLField(blank=True, null=True)
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)
    # Connected to departments and levels
    department = models.ForeignKey(Department, on_delete=models.CASCADE,
            verbose_name='Institution', default=1)
    level = models.ForeignKey(Level, on_delete=models.CASCADE,
            verbose_name='Nivå', default=1)
    # Connected to categories and tracks via many-to-many
    categories = models.ManyToManyField(Category, through='CategoryCourse',
            verbose_name='Kategorier')
    tracks = models.ManyToManyField(Track, blank=True)
    # Connected to itself via prerequisites
    prerequisites = models.ManyToManyField('self', through='Prerequisite',
            symmetrical = False)
    # Slug
    slug = models.SlugField(max_length=100, unique=True, editable=False)

    def category_ects(self, category_sum):
        """
        Sums through the points for each category given the input dict
        category_sum. Only sums for categories already defined in the dict
        """
        for category in self.categorycourse_set.all():
            title = category.category.title
            # Only sum if key is existent in dict
            if title in category_sum:
                category_sum[title] += category.ects

        return category_sum

    __original_title = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__original_title = self.title

    # Generate a slug that consists of the name and a number if not unique
    def _get_unique_slug(self):
        slug = slugify(self.title)
        unique_slug = slug
        num = 1
        # If the slug is not unique (entry with same title), append a number
        while Course.objects.filter(slug=unique_slug).exists():
            unique_slug = '{}-{}'.format(slug, num)
            num += 1
        return unique_slug

    # Override .save() to add unique slug
    def save(self, *args, **kwargs):
        if self.title != self.__original_title or not self.slug:
            self.slug = self._get_unique_slug()

        self.__original_title = self.title
        
        super().save(*args, **kwargs)

    # Url for the course for tables
    def get_absolute_url(self):
        return reverse('course-detail', kwargs={'slug': self.slug})

    def __str__(self):
        return self.title

class Prerequisite(models.Model):
    """
    Prerequisites for a course
    """
    course = models.ForeignKey(Course, related_name = 'curr_course',
            on_delete=models.CASCADE)
    prereq = models.ForeignKey(Course, related_name = 'prereq_course',
            on_delete=models.CASCADE)
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)

    def __str__(self):
        return '{}->{}'.format(self.prereq.title, self.course.title)


class CategoryCourse(models.Model):
    """
    Intermediary to the many-to-many relationship between courses and
    categories. The connection is defined by how many points a course gives to a
    given category.
    """
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    # Points - no more than 3 digits and one decimal point
    ects = models.DecimalField(max_digits=3,decimal_places=1)
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)

class CourseOccasion(models.Model):
    """
    Occasions for a given course
    Many to one
    """
    year = models.IntegerField(verbose_name="År")
    # What 'läsperiod' to start at
    # I think it should just be number of weeks tho
    start = models.IntegerField(verbose_name="TODO")
    weeks = models.IntegerField(verbose_name="Längd")
    official = models.BooleanField(default=True)
    note = models.CharField(max_length=250, blank=True, null=True)
    # Url homepages
    homepage_url = models.URLField(blank=True, null=True)
    evaluation_url = models.URLField(blank=True, null=True)
    syllabus_url = models.URLField(blank=True, null=True)
    contact_name = models.CharField(max_length=250, blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    # Connected to course
    course = models.ForeignKey(Course, on_delete=models.CASCADE,
            verbose_name="Kurs")
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)
    # Slug
    slug = models.SlugField(max_length=100, unique=True, editable=False)
    # slug = models.SlugField(max_length=100, default="hehe", blank=True, null=True)

    def category_ects(self, category_sum):
        """
        Pass through
        """
        self.course.category_ects(category_sum)

    __original_title = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__original_title = self.course.title

    # Generate a slug that consists of the name and a number if not unique
    def _get_unique_slug(self):
        slug = slugify(self.course.title)
        unique_slug = slug
        num = 1
        # If the slug is not unique (entry with same title), append a number
        while CourseOccasion.objects.filter(slug=unique_slug).exists():
            unique_slug = '{}-{}'.format(slug, num)
            num += 1
        return unique_slug

    # Override .save() to add unique slug
    def save(self, *args, **kwargs):
        if self.course.title != self.__original_title or not self.slug:
            self.slug = self._get_unique_slug()

        self.__original_title = self.course.title
        super().save(*args, **kwargs)

    def as_json(self):
        return dict(
                year=self.year,
                start=self.start,
                title=self.course.title,
                ects=self.course.ects,
                weeks=self.weeks,
                prerequisites=1,
                slug = self.slug,
                )


    # Url for the course for tables
    def get_absolute_url(self):
        return reverse('courseoccasion-detail', kwargs={'year': self.year, 'slug': self.slug})

    def __str__(self):
        return self.course.title + " - " + str(self.year) + " - " + str(self.start)

    def get_tempo(self):
        return round(self.course.ects/self.weeks*200/3, 0)

class Page(models.Model):
    """
    Unsure what this is used for
    """
    title = models.CharField(max_length=250)
    content = models.CharField(max_length=10000, blank=True, null=True)
    image = models.ImageField(upload_to='pages/%Y/%m/%d/')
    # Slug
    slug = models.SlugField(unique_for_date='created_at')
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)
    # Slug
    slug = models.SlugField(unique=True, editable=False)


    __original_title = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__original_title = self.title

    # Generate a slug that consists of the name and a number if not unique
    def _get_unique_slug(self):
        slug = slugify(self.title)
        unique_slug = slug
        num = 1
        # If the slug is not unique (entry with same title), append a number
        while Page.objects.filter(slug=unique_slug).exists():
            unique_slug = '{}-{}'.format(slug, num)
            num += 1
        return unique_slug

    # Override .save() to add unique slug
    def save(self, *args, **kwargs):
        if self.title != self.__original_title or not self.slug:
            self.slug = self._get_unique_slug()

        self.__original_title = self.title
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class AcademicYears(models.Model):
    """
    Läsperioder, such as year 2018 is associated with the period 18/19
    """
    year = models.IntegerField()
    title = models.CharField(max_length=250)
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)

    def __str__(self):
        return self.title

class Exam(models.Model):
    """
    Different exams. Such as teknisk fysik
    """
    title = models.CharField(max_length=250)
    year = models.IntegerField()
    ects = models.DecimalField(max_digits=4,decimal_places=1)
    # Kurskod
    code = models.CharField(max_length=10, blank=True, null=True)
    note = models.CharField(max_length=250, blank=True, null=True)
    # Exams can have many categories
    categories = models.ManyToManyField(Category, through='CategoryExam')
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)

    def __str__(self):
        return self.title

class CategoryExam(models.Model):
    """
    Exams and categories are connected with how many points are required for
    exam
    """
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    # Points - no more than 3 digits and one decimal point
    ects = models.DecimalField(max_digits=3,decimal_places=1)
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)

class PrivateCourse(models.Model):
    """
    Courses that users can specify themselves
    """
    title = models.CharField(max_length=250)
    year = models.IntegerField()
    # Points - no more than 3 digits and one decimal point
    ects = models.DecimalField(max_digits=3,decimal_places=1)
    note = models.CharField(max_length=250, blank=True, null=True)
    start = models.IntegerField()
    weeks = models.IntegerField()
    # Conected to a user
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)
    # Categories
    categories = models.ManyToManyField(Category,
            through='PrivateCourseCategory')
    # Slug
    slug = models.SlugField(unique=True, editable=False)


    __original_title = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__original_title = self.title

    # Generate a slug that consists of the name and a number if not unique
    def _get_unique_slug(self):
        slug = slugify('{}-{}'.format(self.title, self.user.username))
        unique_slug = slug
        num = 1
        # If the slug is not unique (entry with same title), append a number
        while PrivateCourse.objects.filter(slug=unique_slug).exists():
            unique_slug = '{}-{}'.format(slug, num)
            num += 1
        return unique_slug

    # Override .save() to add unique slug
    def save(self, *args, **kwargs):
        if self.title != self.__original_title or not self.slug:
            self.slug = self._get_unique_slug()

        self.__original_title = self.title
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title + " - " + self.user.username

class PrivateCourseCategory(models.Model):
    """
    Private courses and categories are connected with how many points a course
    gives in a category
    """
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    private_course = models.ForeignKey(PrivateCourse, on_delete=models.CASCADE)
    # Points - no more than 3 digits and one decimal point
    ects = models.DecimalField(max_digits=3,decimal_places=1)
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)

class Block(models.Model):
    """
    Blockscheman!
    """
    title = models.CharField(max_length=250, verbose_name="Titel")
    description = models.CharField(max_length=10000, blank=True, null=True,
            verbose_name="Beskrivning")
    start_year = models.IntegerField( default=datetime.datetime.now().year,
            verbose_name="Startår")
    # Not open for the public
    private = models.BooleanField(default=True, verbose_name="Privat")
    note = models.CharField(max_length=250, blank=True, null=True)
    # Connected to one user
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    # Can have course occasions many blocks
    courseoccasions = models.ManyToManyField(CourseOccasion, blank=True)
    privatecourses = models.ManyToManyField(PrivateCourse)
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)
    # Slug
    slug = models.SlugField(unique=True, editable=False)

    def total_category_ects(self, category_sum):
        """
        Using category_ects in Course model, loops over all courseoccasions for
        the block and sums the total ects per category
        See category_ects() in Course
        """
        for courseoccasion in self.courseoccasions.all():
            courseoccasion.category_ects(category_sum)

    __original_title = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__original_title = self.title

    # Generate a slug that consists of the name and a number if not unique
    def _get_unique_slug(self):
        slug = slugify(self.title)
        unique_slug = slug
        num = 1
        # If the slug is not unique (entry with same title), append a number
        while Block.objects.filter(slug=unique_slug).exists():
            unique_slug = '{}-{}'.format(slug, num)
            num += 1
        return unique_slug

    # Override .save() to add unique slug
    def save(self, *args, **kwargs):
        if self.title != self.__original_title or not self.slug:
            self.slug = self._get_unique_slug()

        self.__original_title = self.title
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title + " - " + self.user.username
