"""
Validate that CourseScheduleSegment rules would generate the same
CourseOccasion set that already exists in the database.

Compares (course, year, period) tuples between:
  - EXISTING: actual CourseOccasion rows
  - EXPECTED: what active segments for each year/period would produce

Reports mismatches grouped as:
  - MISSING:  existing occasion not covered by any segment
  - EXTRA:    segments would create an occasion that doesn't exist

Usage:
    python manage.py validate_course_schedule_parity
    python manage.py validate_course_schedule_parity --course-id 5
    python manage.py validate_course_schedule_parity --strict
"""

from django.core.management.base import BaseCommand, CommandError

from rodatraden.models import Course, CourseOccasion, CourseScheduleSegment


class Command(BaseCommand):
    help = 'Validate parity between CourseScheduleSegment rules and existing CourseOccasion data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--course-id',
            type=int,
            default=None,
            help='Validate only a specific course by ID',
        )
        parser.add_argument(
            '--strict',
            action='store_true',
            help='Exit with error code if any mismatches are found',
        )

    def handle(self, *args, **options):
        course_id = options['course_id']
        strict = options['strict']

        courses = Course.objects.all().order_by('title')
        if course_id:
            courses = courses.filter(pk=course_id)

        total_missing = 0
        total_extra = 0
        total_match = 0
        courses_with_issues = []

        for course in courses:
            existing = self._get_existing_tuples(course)
            expected = self._get_expected_tuples(course)

            missing = existing - expected
            extra = expected - existing

            if missing or extra:
                courses_with_issues.append(course.title)
                self.stdout.write(
                    self.style.WARNING(f'\n  MISMATCH  {course.title}')
                )
                for year, period_title in sorted(missing):
                    self.stdout.write(
                        f'    MISSING (exists but rules skip): '
                        f'year={year}  period={period_title}'
                    )
                for year, period_title in sorted(extra):
                    self.stdout.write(
                        f'    EXTRA   (rules would create):    '
                        f'year={year}  period={period_title}'
                    )
                total_missing += len(missing)
                total_extra += len(extra)
            else:
                total_match += 1

        # Summary
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(
            f'Courses checked: {courses.count()}\n'
            f'Perfect match:   {total_match}\n'
            f'With issues:     {len(courses_with_issues)}\n'
            f'Total MISSING:   {total_missing}\n'
            f'Total EXTRA:     {total_extra}'
        )

        if courses_with_issues:
            self.stdout.write(self.style.WARNING(
                '\nCourses needing attention:\n  ' +
                '\n  '.join(courses_with_issues)
            ))

        if strict and (total_missing or total_extra):
            raise CommandError(
                f'Parity check failed: {total_missing} missing, '
                f'{total_extra} extra. Fix scheduling rules before proceeding.'
            )

    def _get_existing_tuples(self, course):
        """Return set of (year, period_title) from actual CourseOccasion rows."""
        occasions = CourseOccasion.objects.filter(
            course=course
        ).select_related('academic_year', 'time_period')
        return {
            (occ.academic_year.year, occ.time_period.title)
            for occ in occasions
        }

    def _get_expected_tuples(self, course):
        """Return set of (year, period_title) the segments would produce."""
        segments = course.schedule_segments.select_related('time_period').all()
        if not segments:
            return set()

        expected = set()
        for segment in segments:
            start = segment.start_year
            end = segment.end_year or segment.start_year
            for year in range(start, end + 1):
                if segment.is_active_in_year(year):
                    expected.add((year, segment.time_period.title))

        return expected
