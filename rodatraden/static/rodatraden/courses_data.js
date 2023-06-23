import CourseOccasion from "./course_occasion.js";
import Term from "./term.js";
import CourseGrid from "./course_grid.js";

/**
 * Class containing all courses. This class is also used to manipulate said
 * data.
 */
export default class CoursesData {
  /**
   * @param {number} startYear - Start year specified by the user when creating the block-schedule.
   */
  constructor(startYear) {
    this.#startYear = startYear;
  }

  /**
   * Updates the global course data. Splits courses that overlap both the fall an
   * spring ter if the terms are to be stacked vertically.
   * 
   * @param {boolean} shouldStackTerms - True if terms should be stacked vertically.
   */
  update(shouldStackTerms) {
    this.#loadCoursesFromElement();
    if (shouldStackTerms) {
      this.#splitCoursesOverTermBoundary();
    }
    this.#assignPositionsAndGroupByYear();
    this.#groupCoursesByTerm();
  }

  /**
   * Appends an empty year to the coursesByTerm data. Uses the starting year of
   * the block-schedule as fallback if no years exists yet.
   */
  addAcademicYear() {
    let academicYear;

    // If no years exists yet then wa want to add the start year.
    if (this.#coursesByTerm.length === 0) {
      academicYear = this.#startYear;
      
    // Otherwise, we want to add the academic year after the last.
    } else {
      const lastYear = this.#coursesByTerm.reduce(
        (lastYear, terms) => Math.max(lastYear, terms.academicYear),
        -Infinity
      );
      academicYear = lastYear + 1;
    }

    // Create and add the new academic year.
    this.#coursesByTerm.push({
      academicYear: academicYear,
      fall: new Term('HT', academicYear),
      spring: new Term('VTT', academicYear)
    });
  }

  /**
   * Getter for the courses, grouped by term for each year.
   */
  get coursesByTerm() {
    return this.#coursesByTerm;
  }

  /** @type {number} */
  #startYear;
  /** @type {CourseOccasion[]} */
  #courses;
  /** @type {Max<number, Course[]>} */
  #coursesByYear;
  /** @type {any[]} */
  #coursesByTerm;

  /**
   * Gets all private and non-private courses in the block-schedule from external
   * script tags and return them as a single collection.
   */
  #loadCoursesFromElement() {
    let courses = [];

    const coursesAsJSON = JSON.parse(
      document.getElementById('course-occasions-data').textContent
    );
    const privateCoursesAsJSON = JSON.parse(
      document.getElementById('private-courses-data').textContent
    );

    for (const course of coursesAsJSON) {
      const isPrivate = false;
      courses.push(CourseOccasion.fromJSON(course, isPrivate));
    }
    for (const course of privateCoursesAsJSON) {
      const isPrivate = true;
      courses.push(CourseOccasion.fromJSON(course, isPrivate));
    }
  
    this.#courses = courses;
  }

  /**
   * Splits courses that overlap both terms into two shorter course blocks.
   */
  #splitCoursesOverTermBoundary() {
    const springWeekStart = 20;

    for (let course of this.#courses) {
      const courseEnd = course.start + course.length - 1;

      if (course.start < springWeekStart && courseEnd >= springWeekStart) {
        let courseSpringCopy = { ...course };

        courseSpringCopy.start = springWeekStart;

        const weekOverlap = courseEnd - springWeekStart + 1;
        course.length -= weekOverlap;
        courseSpringCopy.length = weekOverlap;

        this.#courses.push(courseSpringCopy);
      }
    }
  }

  /**
   * Gives the courses a placement in the schedule and group the courses based on
   * their academic year. Their position defined as the index of the first
   * row that the course occupies in a virtual grid.
   * 
   * Also adds empty years to make sure that the first five years exists, as well
   * as adding missing years between exsiting years.
   */
  #assignPositionsAndGroupByYear() {
    let coursesByYear = this.#groupCoursesByYear();

    // XXX: This function now does a bit more that the function name suggests.
    this.#addFirstFiveYearsIfMissing(coursesByYear);
    this.#addMissingGapYears(coursesByYear);
    
    for (let coursesInAcademicYear of coursesByYear.values()) {
      this.#generateCoursePositions(coursesInAcademicYear);
    }

    this.#coursesByYear = coursesByYear;
  }

  /**
   * Groups courses by their academic year using a Map.
   * 
   * @returns {Map<number, {year: number}>} Map of courses grouped by academic year.
   */
  #groupCoursesByYear() {
    let coursesByYear = new Map();

    for (const course of this.#courses) {
      const academicYear = course.academicYear;
  
      if (coursesByYear.has(academicYear)) {
        coursesByYear.get(academicYear).push(course);
      } else {
        coursesByYear.set(academicYear, [course]);
      }
    }
  
    return coursesByYear;
  }

  /**
   * Adds empty years if needed to make sure that the first five years exists.
   * 
   * @param {Map<number, Course[]>} coursesByYear
   */
  #addFirstFiveYearsIfMissing(coursesByYear) {
    for (let year = this.#startYear; year < this.#startYear + 5; ++year) {
      if (!coursesByYear.has(year)) {
        coursesByYear.set(year, []);
      }
    }
  }

  /**
   * Adds empty years if needed to make sure that there are no missing years
   * between existing years.
   * 
   * @param {Map<number, Course[]>} coursesByYear
   */
  #addMissingGapYears(coursesByYear) {
    const firstYear = Math.min(...coursesByYear.keys());
    const lastYear = Math.max(...coursesByYear.keys());
  
    for (let year = firstYear; year <= lastYear; ++year) {
      if (!coursesByYear.has(year)) {
        coursesByYear.set(year, []);
      }
    }
  }

  /**
   * Generates a position for each course. The position is the index of the first
   * row that the course occupies in a virtual grid. The courses are as a side
   * effect sorted in a way that is needed for generating the positions.
   *
   * @param {{start: number, length: number, firstRowIndex: number}[]} coursesInAcademicYear
   */
  #generateCoursePositions(coursesInAcademicYear) {
    this.#sortCoursesByStartAndLength(coursesInAcademicYear);

    let grid = new CourseGrid();

    for (let course of coursesInAcademicYear) {
      course.firstRowIndex = grid.writeCourseToGrid(course);
    }
  }

  /**
   * Sorts the courses by start week in ascending order. Courses that start
   * simultaneously are sorted by length in decending order.
   * 
   * @param {CourseOccasion[]} courses
   */
  #sortCoursesByStartAndLength(courses) {
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
   * Takes courses grouped by year and further group them by term. Some other
   * useful data is also calculated that will be used when rendering the block-
   * schedule.
   */
  #groupCoursesByTerm() {
    let expectedStructure = [];

    for (const courseGroup of this.#coursesByYear) {
      const academicYear = courseGroup[0];
      const coursesInAcademicYear = courseGroup[1];

      const fallTerm = Term.createFall(academicYear, coursesInAcademicYear);
      const springTerm = Term.createSpring(academicYear, coursesInAcademicYear);
      
      expectedStructure.push({
        academicYear: academicYear,
        fall: fallTerm,
        spring: springTerm
      });
    }

    // Make sure the structure is sorted by year in ascending order.
    expectedStructure.sort((a, b) => a.academicYear - b.academicYear);

    this.#coursesByTerm = expectedStructure;
  }
}
