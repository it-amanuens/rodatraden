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
      return b.length - a.length;
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

  for (let course of courses) {
    const courseEnd = course.start + course.length - 1;

    if (course.start < springWeekStart && courseEnd >= springWeekStart) {
      let courseSpringCopy = { ...course };

      courseSpringCopy.start = springWeekStart;

      const weekOverlap = courseEnd - springWeekStart + 1;
      course.length -= weekOverlap;
      courseSpringCopy.length = weekOverlap;

      courses.push(courseSpringCopy);
    }
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
  constructor(year, courses = [], shouldSplitCourses = false) {
    if (shouldSplitCourses) {
      splitCoursesOverTermBoundary(courses);
    }

    generateCoursePositions(courses);

    this.#year = year;
    this.fall = Term.createFall(year, courses);
    this.spring = Term.createSpring(year, courses);
  }
  
  /** @type {CourseOccasion[]} */
  fall;
  /** @type {CourseOccasion[]} */
  spring;

  get year() {
    return this.#year;
  }

  /** @type {number} */
  #year;
}
