"""
Generate CourseOccasion rows from CourseScheduleSegment rules for a given year.

Only creates new occasions — never updates or deletes existing ones.
Marks all generated rows with auto_generated=True.

Usage:
    python manage.py generate_course_occasions 2027              # dry-run
    python manage.py generate_course_occasions 2027 --apply      # create rows
    python manage.py generate_course_occasions 2027 --course-id 5
"""

from django.core.management.base import BaseCommand

from rodatraden.models import Course, CourseOccasion, academic_year_title


class Command(BaseCommand):
    help = 'Generate CourseOccasion entries from CourseScheduleSegment rules'

    def add_arguments(self, parser):
        parser.add_argument(
            'year',
            type=int,
            help='Academic year to generate occasions for',
        )
        parser.add_argument(
            '--apply',
            action='store_true',
            help='Actually create rows (default is dry-run)',
        )
        parser.add_argument(
            '--course-id',
            type=int,
            default=None,
            help='Generate only for a specific course by ID',
        )

    def handle(self, *args, **options):
        year = options['year']
        apply = options['apply']
        course_id = options['course_id']

        if not apply:
            self.stdout.write(self.style.WARNING(
                'DRY-RUN MODE — no rows will be created. '
                'Use --apply to write.\n'
            ))

        title = academic_year_title(year)

        courses = Course.objects.all().order_by('title')
        if course_id:
            courses = courses.filter(pk=course_id)

        created = 0
        skipped_no_segments = 0
        skipped_exists = 0

        for course in courses:
            segments = course.get_segments_for_year(year)
            if not segments:
                skipped_no_segments += 1
                continue

            for segment in segments:
                exists = CourseOccasion.objects.filter(
                    course=course,
                    year=year,
                    start=segment.start,
                ).exists()

                if exists:
                    skipped_exists += 1
                    continue

                weeks_in_period = 10
                period_number = segment.start // weeks_in_period + 1
                self.stdout.write(
                    f'  {"CREATE" if apply else "WOULD CREATE"}  '
                    f'{course.title} — {title} '
                    f'LP{period_number} '
                    f'({segment.weeks} weeks)'
                )

                if apply:
                    CourseOccasion.objects.create(
                        course=course,
                        year=year,
                        start=segment.start,
                        weeks=segment.weeks,
                        official=True,
                        auto_generated=True,
                    )

                created += 1

        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(
            f'Year: {year}\n'
            f'Created:              {created}\n'
            f'Skipped (no segs):    {skipped_no_segments}\n'
            f'Skipped (exists):     {skipped_exists}'
        )
        if not apply:
            self.stdout.write(self.style.WARNING(
                '\nNo rows created. Run with --apply to write.'
            ))
        else:
            self.stdout.write(self.style.SUCCESS('\nDone.'))
