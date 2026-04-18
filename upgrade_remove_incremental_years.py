#!/usr/bin/env python3
from __future__ import annotations

import ast
import re
import subprocess
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent
MIGRATIONS_DIR = ROOT_DIR / "rodatraden" / "migrations"


def run(cmd: list[str], capture: bool = False) -> str:
    result = subprocess.run(
        cmd,
        cwd=ROOT_DIR,
        check=True,
        text=True,
        capture_output=capture,
    )
    if capture:
        return result.stdout.strip()
    return ""


def get_branch_name() -> str:
    try:
        return run(["git", "rev-parse", "--abbrev-ref", "HEAD"], capture=True)
    except Exception:
        return "unknown"


def slugify_branch(branch_name: str) -> str:
    slug = branch_name.replace("/", "_").replace("-", "_")
    slug = re.sub(r"[^A-Za-z0-9_]", "", slug)
    if not slug:
        slug = "unknown"
    return slug[:24]


def get_or_create_migration(tag: str) -> Path:
    existing = sorted(MIGRATIONS_DIR.glob(f"*_{tag}.py"))
    if existing:
        migration_file = existing[-1]
        print(f"Using existing {migration_file}")
        return migration_file

    run(
        [
            sys.executable,
            "manage.py",
            "makemigrations",
            "rodatraden",
            "--empty",
            "--name",
            tag,
            "--noinput",
        ]
    )
    created = sorted(MIGRATIONS_DIR.glob(f"*_{tag}.py"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not created:
        raise RuntimeError(f"Could not find generated migration file for tag {tag}")
    migration_file = created[0]
    print(f"Created {migration_file}")
    return migration_file


def extract_dependency(migration_file: Path) -> str:
    tree = ast.parse(migration_file.read_text(encoding="utf-8"), filename=str(migration_file))

    for node in tree.body:
        if isinstance(node, ast.ClassDef) and node.name == "Migration":
            for stmt in node.body:
                if isinstance(stmt, ast.Assign):
                    if any(isinstance(t, ast.Name) and t.id == "dependencies" for t in stmt.targets):
                        deps = ast.literal_eval(stmt.value)
                        for app_label, migration_name in deps:
                            if app_label == "rodatraden":
                                return migration_name

    raise RuntimeError("Could not determine rodatraden dependency from empty migration")


def write_migration(migration_file: Path, dependency_name: str) -> None:
    content = f'''from django.db import migrations, models


def copy_time_period_and_academic_year_data(apps, schema_editor):
    CourseOccasion = apps.get_model("rodatraden", "CourseOccasion")
    CourseScheduleSegment = apps.get_model("rodatraden", "CourseScheduleSegment")

    for occasion in CourseOccasion.objects.select_related("academic_year", "time_period").all():
        occasion.year = occasion.academic_year.year
        occasion.start = occasion.time_period.week
        occasion.save(update_fields=["year", "start"])

    for segment in CourseScheduleSegment.objects.select_related("time_period").all():
        segment.start = segment.time_period.week
        segment.save(update_fields=["start"])


class Migration(migrations.Migration):

    dependencies = [
        ("rodatraden", "{dependency_name}"),
    ]

    operations = [
        migrations.AddField(
            model_name="courseoccasion",
            name="year",
            field=models.IntegerField(blank=True, null=True, verbose_name="\u00c5r"),
        ),
        migrations.AddField(
            model_name="courseoccasion",
            name="start",
            field=models.IntegerField(blank=True, default=0, null=True, verbose_name="L\u00e4speriod"),
        ),
        migrations.AddField(
            model_name="courseschedulesegment",
            name="start",
            field=models.IntegerField(
                blank=True,
                default=0,
                help_text="Startvecka f\u00f6r perioden (0 = LP1, 10 = LP2, 20 = LP3, 30 = LP4, 40 = LP5)",
                null=True,
                verbose_name="L\u00e4speriod",
            ),
        ),
        migrations.RunPython(copy_time_period_and_academic_year_data, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="courseoccasion",
            name="academic_year",
        ),
        migrations.RemoveField(
            model_name="courseoccasion",
            name="time_period",
        ),
        migrations.RemoveField(
            model_name="courseschedulesegment",
            name="time_period",
        ),
        migrations.AlterField(
            model_name="courseoccasion",
            name="start",
            field=models.IntegerField(default=0, verbose_name="L\u00e4speriod"),
        ),
        migrations.AlterField(
            model_name="courseoccasion",
            name="year",
            field=models.IntegerField(verbose_name="\u00c5r"),
        ),
        migrations.AlterField(
            model_name="courseschedulesegment",
            name="start",
            field=models.IntegerField(
                default=0,
                help_text="Startvecka f\u00f6r perioden (0 = LP1, 10 = LP2, 20 = LP3, 30 = LP4, 40 = LP5)",
                verbose_name="L\u00e4speriod",
            ),
        ),
        migrations.AlterModelOptions(
            name="courseschedulesegment",
            options={{
                "ordering": ["start_year", "start"],
                "permissions": [("can_manage_scheduling", "Kan hantera schemal\u00e4ggning")],
                "verbose_name": "Schemal\u00e4ggningssegment",
                "verbose_name_plural": "Schemal\u00e4ggningssegment",
            }},
        ),
        migrations.DeleteModel(
            name="AcademicYear",
        ),
        migrations.DeleteModel(
            name="TimePeriod",
        ),
    ]
'''
    migration_file.write_text(content, encoding="utf-8")


def main() -> int:
    branch_name = get_branch_name()
    tag = f"remove_incremental_years_{slugify_branch(branch_name)}"

    migration_file = get_or_create_migration(tag)
    dependency_name = extract_dependency(migration_file)
    write_migration(migration_file, dependency_name)

    run([sys.executable, "manage.py", "migrate", "rodatraden"])
    run([sys.executable, "manage.py", "migrate"])

    print(f"Upgrade migration complete for branch: {branch_name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())