"""
Infer CourseScheduleSegment rows from existing CourseOccasion history.

For each course, groups occasions by start week and creates one segment
per group with:
  - frequency = 'yearly'
  - start_year = earliest year in that (course, start) group
  - end_year   = latest year in that (course, start) group
  - weeks      = most common weeks value in the group
  - blacklisted_years = years in [start..end] that have no occasion

Skips courses that already have at least one segment.

Usage:
    python manage.py infer_course_scheduling              # dry-run (default)
    python manage.py infer_course_scheduling --apply       # write to database
    python manage.py infer_course_scheduling --course-id 5 # single course
"""

from collections import Counter

from django.core.management.base import BaseCommand

from rodatraden.models import Course, CourseOccasion, CourseScheduleSegment


class Command(BaseCommand):
    help = 'Infer CourseScheduleSegment rows from existing CourseOccasion data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply',
            action='store_true',
            help='Actually write changes to the database (default is dry-run)',
        )
        parser.add_argument(
            '--course-id',
            type=int,
            default=None,
            help='Process only a specific course by ID',
        )

    def handle(self, *args, **options):
        apply = options['apply']
        course_id = options['course_id']

        if not apply:
            self.stdout.write(self.style.WARNING(
                'DRY-RUN MODE — no changes will be saved. '
                'Use --apply to write.\n'
            ))

        courses = Course.objects.all().order_by('title')
        if course_id:
            courses = courses.filter(pk=course_id)

        if not courses.exists():
            self.stdout.write(self.style.ERROR('No courses found.'))
            return

        stats = {'processed': 0, 'segments_created': 0,
                 'skipped_no_occasions': 0, 'skipped_has_segments': 0,
                 'total': 0}

        for course in courses:
            stats['total'] += 1

            # Skip courses that already have segments
            if course.schedule_segments.exists():
                stats['skipped_has_segments'] += 1
                self.stdout.write(
                    f'  SKIP  {course.title} — already has segments'
                )
                continue

            occasions = CourseOccasion.objects.filter(
                course=course
            )

            if not occasions.exists():
                stats['skipped_no_occasions'] += 1
                self.stdout.write(
                    f'  SKIP  {course.title} — no occasions found'
                )
                continue

            segments = self._infer_segments(course, occasions)
            self._report(course, segments)

            if apply:
                self._apply(segments)

            stats['processed'] += 1
            stats['segments_created'] += len(segments)

        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(
            f"Total courses:        {stats['total']}\n"
            f"Processed:            {stats['processed']}\n"
            f"Segments created:     {stats['segments_created']}\n"
            f"Skipped (no occ):     {stats['skipped_no_occasions']}\n"
            f"Skipped (has segs):   {stats['skipped_has_segments']}"
        )
        if not apply:
            self.stdout.write(self.style.WARNING(
                '\nNo changes saved. Run with --apply to write.'
            ))
        else:
            self.stdout.write(self.style.SUCCESS('\nChanges saved.'))

    def _infer_segments(self, course, occasions):
        """Return list of dicts describing one segment per (course, start)."""
        # Group occasions by start week
        by_start = {}
        for occ in occasions:
            s = occ.start
            if s not in by_start:
                by_start[s] = {
                    'start': s,
                    'years': [],
                    'weeks': [],
                }
            by_start[s]['years'].append(occ.year)
            by_start[s]['weeks'].append(occ.weeks)

        segments = []
        for s, data in by_start.items():
            years = sorted(data['years'])
            start_year = min(years)
            end_year = max(years)
            year_set = set(years)
            full_range = set(range(start_year, end_year + 1))
            blacklist = sorted(full_range - year_set)
            weeks_counter = Counter(data['weeks'])
            most_common_weeks = weeks_counter.most_common(1)[0][0]

            segments.append({
                'course': course,
                'start': s,
                'start_year': start_year,
                'end_year': end_year,
                'frequency': 'yearly',
                'weeks': most_common_weeks,
                'blacklisted_years': blacklist,
            })

        return segments

    def _report(self, course, segments):
        weeks_in_period = 10
        self.stdout.write(f'\n  {course.title} ({len(segments)} segment(s)):')
        for seg in segments:
            bl_str = (', '.join(str(y) for y in seg['blacklisted_years'])
                      if seg['blacklisted_years'] else '(none)')
            period_number = seg['start'] // weeks_in_period + 1
            self.stdout.write(
                f"    LP{period_number}: "
                f"{seg['start_year']}–{seg['end_year']}  "
                f"freq={seg['frequency']}  "
                f"weeks={seg['weeks']}  "
                f"blacklist=[{bl_str}]"
            )

    def _apply(self, segments):
        for seg in segments:
            CourseScheduleSegment.objects.create(
                course=seg['course'],
                start=seg['start'],
                start_year=seg['start_year'],
                end_year=seg['end_year'],
                frequency=seg['frequency'],
                weeks=seg['weeks'],
                blacklisted_years=seg['blacklisted_years'],
            )
