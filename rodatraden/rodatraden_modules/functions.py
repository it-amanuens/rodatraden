from rodatraden.models import Block, CourseOccasion


def is_ajax(request):
    """Check if the request is an ajax request.

    This was a standard function in django before, but no more. Sad day.

    Arguments
        request -- HTTPrequest?

    Returns
        True if ajax, False if not
    """
    if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
        return True
    return False


def import_course_occasions(start_year: int, imported_block: Block):
    """Create course occasions from imported block.

    Takes the year difference between the two blocks and adjusts for the new
    block.
    """

    # Get all courseoccasions from selected block
    course_occasions = imported_block.courseoccasions.all().order_by(
        'academic_year__year', 'time_period__week'
    )

    # Difference in years from new block to the import block
    year_diff = int(start_year) - imported_block.start_year

    # Create new courseoccasions
    new_course_occasions: list[CourseOccasion] = []
    for course_occasion in course_occasions:
        new_year = course_occasion.academic_year.year + year_diff
        # Get the new course occasion. Just skip if something bad happens,
        # like if it doesn't exist for the new year.
        try:
            new_course_occasion = CourseOccasion.objects.get(
                course = course_occasion.course,
                academic_year__year = new_year,
                time_period__week = course_occasion.time_period.week
            )
            new_course_occasions.append(new_course_occasion)
        except:
            pass

    return new_course_occasions
