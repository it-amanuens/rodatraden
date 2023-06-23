import CourseOccasion from "./course_occasion.js";
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
    // Create a new year with the startYear to begin with.
    let newCourseGroup = {
      year: this.#startYear,
      fall: {
        courses: [],
        ectsSumPeriod1: 0,
        ectsSumPeriod2: 0
      },
      spring: {
        courses: [],
        ectsSumPeriod3: 0,
        ectsSumPeriod4: 0
      },
      height: 0
    };

    // Replace the year used as a fallback if possible.
    if (this.#coursesByTerm.length !== 0) {
      const lastYear = this.#coursesByTerm.reduce(
        (lastYear, courseGroup) => Math.max(lastYear, courseGroup.year),
        -Infinity
      );
      newCourseGroup.year = lastYear + 1;
    }
    
    this.#coursesByTerm.push(newCourseGroup);
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
  /** @type {any[]} */
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
      const year = course.year;
  
      if (coursesByYear.has(year)) {
        coursesByYear.get(year).push(course);
      } else {
        coursesByYear.set(year, [course]);
      }
    }
  
    return coursesByYear;
  }

  /**
   * Adds empty years if needed to make sure that the first five years exists.
   */
  #addFirstFiveYearsIfMissing() {
    for (let year = this.#startYear; year < this.#startYear + 5; ++year) {
      if (!this.#coursesByYear.has(year)) {
        this.#coursesByYear.set(year, []);
      }
    }
  }

  /**
   * Adds empty years if needed to make sure that there are no missing years
   * between existing years.
   */
  #addMissingGapYears() {
    const firstYear = Math.min(...this.#coursesByYear.keys());
    const lastYear = Math.max(...this.#coursesByYear.keys());
  
    for (let year = firstYear; year <= lastYear; ++year) {
      if (!this.#coursesByYear.has(year)) {
        this.#coursesByYear.set(year, []);
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
      const year = courseGroup[0];
      const coursesInAcademicYear = courseGroup[1];

      const terms = this.#divideCoursesIntoTerms(coursesInAcademicYear);
      
      expectedStructure.push({
        year: year,
        fall: {
          courses: terms.fall,
          ectsSumPeriod1: this.#getEctsSumInPeriod(coursesInAcademicYear, 1),
          ectsSumPeriod2: this.#getEctsSumInPeriod(coursesInAcademicYear, 2)
        },
        spring: {
          courses: terms.spring,
          ectsSumPeriod3: this.#getEctsSumInPeriod(coursesInAcademicYear, 3),
          ectsSumPeriod4: this.#getEctsSumInPeriod(coursesInAcademicYear, 4)
        },
        height: this.#getCourseContainerHeight(coursesInAcademicYear)
      });
    }

    // Make sure the structure is sorted by year in ascending order.
    expectedStructure.sort((a, b) => a.year - b.year);

    this.#coursesByTerm = expectedStructure;
  }

  /**
   * Splits the courses for an academic year into two groups: fall and spring
   * courses.
   * 
   * @param {CourseOccasion[]} coursesInSameYear
   * @returns The courses split into a fall and spring term.
   */
  #divideCoursesIntoTerms(coursesInSameYear) {
    const springWeekStart = 20;

    let fallCourses = [];
    let springCourses = [];

    for (const course of coursesInSameYear) {
      if (course.start >= springWeekStart) {
        // The terms are positioned based on their starting offset relative to
        // the start of the term. For spring courses we therefore need to
        // subtract 20 weeks from the academic year start.
        course.termStart = course.start - springWeekStart;
        springCourses.push(course);
      } else {
        course.termStart = course.start;
        fallCourses.push(course);
      }
    }

    return {
      fall: fallCourses,
      spring: springCourses
    }
  }

  /**
   * Calculates the total ECTS of all courses in a spceific period.
   * 
   * @param {CourseOccasion[]} coursesInSameYear - All courses during an academic year.
   * @param {number} periodNumber - 1, 2, 3 or 4.
   * @returns The total ECTS of all courses in the given period.
   */
  #getEctsSumInPeriod(coursesInSameYear, periodNumber) {
    const periodWeekLength = 10;
    const periodStart = periodWeekLength * (periodNumber - 1);
    const periodEnd = periodStart + periodWeekLength - 1;

    const ectsSum = coursesInSameYear.reduce(
      (ectsSum, course) => {
        const courseStart = course.start;
        const courseEnd = course.start + course.weeks - 1;

        // Skip the course if it doesn't overlap with the period.
        if (courseEnd < periodStart || periodEnd < courseStart) {
          return ectsSum;
        }

        // Calculate how many weeks the course overlaps with the period.
        const overlapStart = Math.max(courseStart, periodStart);
        const overlapEnd = Math.min(courseEnd, periodEnd);
        const overlapInWeeks = overlapEnd - overlapStart + 1;

        const ectsPerWeek = course.ects / course.weeks;
        const ectsInPeriod = ectsPerWeek * overlapInWeeks;

        return ectsSum + ectsInPeriod;
      },
      0
    );

    return ectsSum;
  }

  /**
   * Calculates the height required to contain all given courses.
   * 
   * @param {CourseOccasion[]} coursesInSameYear
   * @returns Height of the course container.
   */
  #getCourseContainerHeight(coursesInSameYear) {
    // TEMP: These have been copied here to make it work.
    const margin = 1;
    const scale = 3;

    let containerHeight = 0;

    for(const course of coursesInSameYear) {
      const courseHeight = course.firstRowIndex + course.speed;
      containerHeight = Math.max(containerHeight, courseHeight);
    }

    return containerHeight * scale + 2 * margin;
  }
}
