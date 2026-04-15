"""
Ensure AcademicYear rows exist for every year from a base year up to
current year + a configurable future buffer.

The command is idempotent: it only creates rows that are missing and never
modifies existing ones.  Run it once during initial setup and then once per
year (e.g. from a cron job or a deployment script) so that new years are
added automatically.

Title format: year 2011 → "11/12", year 2020 → "20/21" (same convention
as the AcademicYear model docstring: "year 2018 is associated to period 18/19").

Usage:
    python manage.py ensure_academic_years              # dry-run
    python manage.py ensure_academic_years --apply      # create missing rows
    python manage.py ensure_academic_years --apply --future-years 5
    python manage.py ensure_academic_years --apply --base-year 2012
"""

import datetime

from django.core.management.base import BaseCommand

from rodatraden.models import AcademicYear

# Default starting year.  The first AcademicYear in production is around 2011.
DEFAULT_BASE_YEAR = 2011

# How many years beyond the current calendar year to pre-create.
DEFAULT_FUTURE_BUFFER = 10


def _year_title(year: int) -> str:
    """Return the conventional title string for an academic year.

    Example: 2011 → "11/12", 2020 → "20/21".

    Note: this format uses only the last two digits of each calendar year and
    is only meaningful for years in the range 2000–2099.  The base year
    (DEFAULT_BASE_YEAR = 2011) and the ten-year future buffer keep all
    generated titles well within that range.
    """
    return f"{str(year)[2:]}/{str(year + 1)[2:]}"


class Command(BaseCommand):
    help = (
        "Ensure AcademicYear rows exist from a base year up to "
        "current year + future buffer.  Safe to re-run at any time."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Actually create missing rows (default is dry-run).",
        )
        parser.add_argument(
            "--base-year",
            type=int,
            default=None,
            help=(
                f"First year to ensure exists.  Defaults to the minimum year "
                f"already in the database, or {DEFAULT_BASE_YEAR} if the "
                f"table is empty."
            ),
        )
        parser.add_argument(
            "--future-years",
            type=int,
            default=DEFAULT_FUTURE_BUFFER,
            help=(
                f"Number of years beyond the current year to pre-create "
                f"(default: {DEFAULT_FUTURE_BUFFER})."
            ),
        )

    def handle(self, *args, **options):
        apply = options["apply"]
        future_buffer = options["future_years"]

        if not apply:
            self.stdout.write(
                self.style.WARNING(
                    "DRY-RUN MODE — no rows will be created. "
                    "Use --apply to write.\n"
                )
            )

        # Determine base year: explicit arg → min existing DB year → hardcoded default.
        if options["base_year"] is not None:
            base_year = options["base_year"]
        else:
            existing_min = AcademicYear.objects.order_by("year").values_list(
                "year", flat=True
            ).first()
            base_year = existing_min if existing_min is not None else DEFAULT_BASE_YEAR

        current_year = datetime.date.today().year
        end_year = current_year + future_buffer

        self.stdout.write(
            f"Ensuring AcademicYear rows for {base_year} – {end_year} "
            f"(current year: {current_year}, buffer: +{future_buffer})\n"
        )

        created_count = 0
        skipped_count = 0

        for year in range(base_year, end_year + 1):
            title = _year_title(year)
            if apply:
                _, created = AcademicYear.objects.get_or_create(
                    year=year,
                    defaults={"title": title},
                )
            else:
                created = not AcademicYear.objects.filter(year=year).exists()

            if created:
                created_count += 1
                self.stdout.write(
                    f"  {'CREATE' if apply else 'WOULD CREATE'}  {year}  ({title})"
                )
            else:
                skipped_count += 1

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(
            f"Range:    {base_year} – {end_year}\n"
            f"Created:  {created_count}\n"
            f"Skipped (already exist): {skipped_count}"
        )

        if not apply:
            self.stdout.write(
                self.style.WARNING("\nNo rows created. Run with --apply to write.")
            )
        else:
            self.stdout.write(self.style.SUCCESS("\nDone."))
