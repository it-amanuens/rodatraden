import CourseOccasion from "./course_occasion.js";
import Term from "./term.js";
import CourseGrid from "./course_grid.js";

/**
 * Sorts the courses by start week in ascending order. Courses that start
 * simultaneously are sorted by length in decending order.
 * 
 * @param {CourseOccasion[]} courses
 */
function sortCoursesByStartAndLength(courses) {
  courses.sort((a, b) => {
    const areSimultaneous = a.start == b.start;
    if (areSimultaneous) {
      return b.weeks - a.weeks;
    } else {
      return a.start - b.start;
    }
  });
}

/**
 * Generates a position for each course. The position is the index of the first
 * row that the course occupies in a virtual grid. The courses are as a side
 * effect sorted in a way that is needed for generating the positions.
 *
 * @param {CourseOccasion[]} coursesInSameYear
 */
function generateCoursePositions(coursesInSameYear) {
  sortCoursesByStartAndLength(coursesInSameYear);

  let grid = new CourseGrid();

  for (let course of coursesInSameYear) {
    course.firstRowIndex = grid.writeCourseToGrid(course);
  }
}

/**
 * Splits courses that overlap both terms into two shorter course blocks.
 * 
 * @param {CourseOccasion[]} courses
 */
function splitCoursesOverTermBoundary(courses) {
  const springWeekStart = Term.springWeekStart;
  const summerWeekStart = Term.summerWeekStart;

  // Only process the original courses, not the clones we append.
  const originalLength = courses.length;

  for (let i = 0; i < originalLength; i++) {
    let course = courses[i];
    const courseEnd = course.start + course.weeks - 1;

    // Split across fall → spring boundary.
    const isStartingInFall = course.start < springWeekStart;
    const isEndingInSpring = courseEnd >= springWeekStart;
    if (isStartingInFall && isEndingInSpring) {
      let courseSpringCopy = course.clone();

      courseSpringCopy.start = springWeekStart;

      const weekOverlap = courseEnd - springWeekStart + 1;
      course.visibleWeeks = course.weeks - weekOverlap;
      courseSpringCopy.visibleWeeks = Math.min(weekOverlap, summerWeekStart - springWeekStart);

      courses.push(courseSpringCopy);

      // If the course also extends into summer, split again.
      if (courseEnd >= summerWeekStart) {
        let courseSummerCopy = course.clone();
        courseSummerCopy.start = summerWeekStart;
        courseSummerCopy.visibleWeeks = courseEnd - summerWeekStart + 1;
        courses.push(courseSummerCopy);
      }

      continue;
    }

    // Split across spring → summer boundary (course starts in spring).
    const isStartingInSpring = course.start >= springWeekStart && course.start < summerWeekStart;
    const isEndingInSummer = courseEnd >= summerWeekStart;
    if (isStartingInSpring && isEndingInSummer) {
      let courseSummerCopy = course.clone();

      courseSummerCopy.start = summerWeekStart;

      const weekOverlap = courseEnd - summerWeekStart + 1;
      course.visibleWeeks = course.weeks - weekOverlap;
      courseSummerCopy.visibleWeeks = weekOverlap;

      courses.push(courseSummerCopy);
    }
  }
}

/**
 * Reset the length of all course occasion blocks to their original length.
 */
function resetBlockLengths(courses) {
  for (let course of courses) {
    course.visibleWeeks = course.weeks;
  }
}

export default class AcademicYear {
  /**
   * Returns the result of an ascending order comparison between two academic
   * years. This can be used to sort academic years.
   * @param {AcademicYear} a - Left-hand-side academic year.
   * @param {AcademicYear} b - Right-hand-side academic year.
   */
  static compareAscending(a, b) {
    return a.year - b.year;
  }

  /**
   * @param {number} year - Academic year.
   * @param {CourseOccasion[]} courses - Courses corresponding to the academic year.
   */
  constructor(year, courses = [], shouldSplitCourses = false, hasSummer = false) {
    if (courses.length !== 0) {
      if (shouldSplitCourses) {
        splitCoursesOverTermBoundary(courses);
      } else{
        resetBlockLengths(courses);
      }

      generateCoursePositions(courses);
    }

    this.#year = year;
    this.#hasSummer = hasSummer;
    this.fall = Term.createFall(year, courses);
    this.spring = Term.createSpring(year, courses);
    this.summer = Term.createSummer(year, courses);
  }
  
  /** @type {Term} */
  fall;
  /** @type {Term} */
  spring;
  /** @type {Term} */
  summer;

  get year() {
    return this.#year;
  }

  /**
   * Whether the summer term should be shown for this academic year.
   * True if explicitly enabled or if there are courses in the summer.
   */
  get hasSummer() {
    return this.#hasSummer || this.summer.courses.length > 0;
  }

  /** @type {number} */
  #year;
  /** @type {boolean} */
  #hasSummer;
}
