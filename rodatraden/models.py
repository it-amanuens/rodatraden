from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify

# Get the user model
User = get_user_model()

# Create your models here.
class Department(models.Model):
    """
    Most likely departments at the university.
    """
    title = models.CharField(max_length=50)
    description = models.CharField(max_length=200, blank=True)
    title_eng = models.CharField(max_length=50, blank=True)
    description_eng = models.CharField(max_length=200, blank=True)
    abbreviation = models.CharField(max_length=20, blank=True)
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
    title = models.CharField(max_length=50)
    description = models.CharField(max_length=200, blank=True)
    title_eng = models.CharField(max_length=50, blank=True)
    description_eng = models.CharField(max_length=200, blank=True)
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
    title = models.CharField(max_length=50)
    description = models.CharField(max_length=200, blank=True)
    title_eng = models.CharField(max_length=50, blank=True)
    description_eng = models.CharField(max_length=200, blank=True)
    abbreviation = models.CharField(max_length=20, blank=True)
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
        if not self.slug:
            self.slug = self._get_unique_slug()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class Category(models.Model):
    """
    Categories for different exam goals
    """
    title = models.CharField(max_length=50)
    description = models.CharField(max_length=200, blank=True)
    title_eng = models.CharField(max_length=50, blank=True)
    description_eng = models.CharField(max_length=200, blank=True)
    abbreviation = models.CharField(max_length=20, blank=True)
    # Image storage
    # path will be MEDIA_ROOT/categories
    # TODO: Look into height and width configurations, what is proper for this
    # application
    image = models.ImageField(upload_to='categories/', blank=True)
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
        while Category.objects.filter(slug=unique_slug).exists():
            unique_slug = '{}-{}'.format(slug, num)
            num += 1
        return unique_slug

    # Override .save() to add unique slug
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._get_unique_slug()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class Track(models.Model):
    """
    (Spår). Tracks can be connected to profiles
    """
    title = models.CharField(max_length=50)
    # If the track is valid
    valid = models.BooleanField(default=True)
    description = models.CharField(max_length=200, blank=True)
    title_eng = models.CharField(max_length=50, blank=True)
    description_eng = models.CharField(max_length=200, blank=True)
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
        if not self.slug:
            self.slug = self._get_unique_slug()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class Course(models.Model):
    """
    Courses. Self-explanatory
    """
    title = models.CharField(max_length=50)
    description = models.CharField(max_length=200, blank=True)
    # Kurskod
    code = models.CharField(max_length=6)
    # Points - no more than 3 digits and one decimal point
    ects = models.DecimalField(max_digits=3,decimal_places=1)
    # If the course is approved
    approved = models.BooleanField(default=True)
    # I think this is to check if the course will still continue
    closed = models.BooleanField(default=False)
    # Note sure what this is for
    note = models.CharField(max_length=50, blank=True)
    title_eng = models.CharField(max_length=50, blank=True)
    description_eng = models.CharField(max_length=200, blank=True)
    # Url homepages
    homepage_url = models.URLField(blank=True)
    evaluation_url = models.URLField(blank=True)
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)
    # Connected to departments and levels
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    level = models.ForeignKey(Level, on_delete=models.CASCADE)
    # Connected to categories and tracks via many-to-many
    categories = models.ManyToManyField(Category, through='CategoryCourse')
    tracks = models.ManyToManyField(Track, blank=True)
    # Connected to itself via prerequisites
    prerequisites = models.ManyToManyField("self", blank=True)
    # Slug
    slug = models.SlugField(unique=True, editable=False)

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
        if not self.slug:
            self.slug = self._get_unique_slug()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

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
    year = models.IntegerField()
    # What 'läsperiod' to start at
    # I think it should just be number of weeks tho
    start = models.IntegerField()
    weeks = models.IntegerField()
    official = models.BooleanField(default=True)
    note = models.CharField(max_length=50, blank=True)
    # Url homepages
    homepage_url = models.URLField(blank=True)
    evaluation_url = models.URLField(blank=True)
    syllabus_url = models.URLField(blank=True)
    contact_name = models.CharField(max_length=50, blank=True)
    contact_email = models.EmailField(blank=True)
    # Connected to course
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)
    # Slug
    slug = models.SlugField(unique=True, editable=False)

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
        if not self.slug:
            self.slug = self._get_unique_slug()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.course.title + " - " + str(self.year) + " - " + str(self.start)

class Block(models.Model):
    """
    Blockscheman!
    """
    title = models.CharField(max_length=50)
    description = models.CharField(max_length=200, blank=True)
    start_year = models.IntegerField()
    # Not open for the public
    private = models.BooleanField(default=True)
    note = models.CharField(max_length=50, blank=True)
    # Connected to one user
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    # Can have course occasions many blocks
    courseoccasion = models.ManyToManyField(CourseOccasion, blank=True)
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)
    # Slug
    slug = models.SlugField(unique=True, editable=False)

    # Generate a slug that consists of the name and a number if not unique
    def _get_unique_slug(self):
        slug = slugify('{}-{}'.format(self.title, self.user.username))
        unique_slug = slug
        num = 1
        # If the slug is not unique (entry with same title), append a number
        while Block.objects.filter(slug=unique_slug).exists():
            unique_slug = '{}-{}'.format(slug, num)
            num += 1
        return unique_slug

    # Override .save() to add unique slug
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._get_unique_slug()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title + " - " + self.user.username

class Page(models.Model):
    """
    Unsure what this is used for
    """
    title = models.CharField(max_length=50)
    content = models.CharField(max_length=200, blank=True)
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
        if not self.slug:
            self.slug = self._get_unique_slug()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class AcademicYears(models.Model):
    """
    Läsperioder, such as year 2018 is associated with the period 18/19
    """
    year = models.IntegerField()
    title = models.CharField(max_length=50)
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
    title = models.CharField(max_length=50)
    year = models.IntegerField()
    ects = models.DecimalField(max_digits=3,decimal_places=1)
    # Kurskod
    code = models.CharField(max_length=6, blank=True)
    note = models.CharField(max_length=50, blank=True)
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
    title = models.CharField(max_length=50)
    year = models.IntegerField()
    # Points - no more than 3 digits and one decimal point
    ects = models.DecimalField(max_digits=3,decimal_places=1)
    note = models.CharField(max_length=50, blank=True)
    start = models.IntegerField()
    weeks = models.IntegerField()
    # Conected to a user
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    blocks = models.ManyToManyField(Block)
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, editable=False,
            null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False, null=False,
            blank=False)
    # Slug
    slug = models.SlugField(unique=True, editable=False)

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
        if not self.slug:
            self.slug = self._get_unique_slug()
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
