import CourseOccasion from "./course_occasion.js";
import AcademicYear from "./academic_year.js";

/**
 * Groups courses by their academic year using a Map.
 * 
 * @param {CourseOccasion[]} courses
 * @returns {Map<number, {year: number}>} Map of courses grouped by academic year.
 */
function groupCoursesByYear(courses) {
  let coursesByYear = new Map();

  for (const course of courses) {
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
 * @param {number} startYear - Start year specified by the user when creating the block-schedule.
 */
function addFirstFiveYearsIfMissing(coursesByYear, startYear) {
  for (let year = startYear; year < startYear + 5; ++year) {
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
function addMissingGapYears(coursesByYear) {
  const firstYear = Math.min(...coursesByYear.keys());
  const lastYear = Math.max(...coursesByYear.keys());

  for (let year = firstYear; year <= lastYear; ++year) {
    if (!coursesByYear.has(year)) {
      coursesByYear.set(year, []);
    }
  }
}

/**
 * Takes courses grouped by year and further group them by term. Some other
 * useful data is also calculated that will be used when rendering the block-
 * schedule.
 * 
 * @param {Map<number, Course[]>} coursesByYear
 * @param {boolean} shouldSplitCourses - True if courses that overlap terms should be split into two course-blocks.
 * @returns {AcademicYear[]}
 */
function groupCoursesByTerm(coursesByYear, shouldSplitCourses) {
  let academicYears = [];

  for (const courseGroup of coursesByYear) {
    const year = courseGroup[0];
    const courses = courseGroup[1];

    academicYears.push(new AcademicYear(year, courses, shouldSplitCourses));
  }
  
  // Make sure the years are sorted in ascending order.
  academicYears.sort(AcademicYear.compareAscending);
  
  return academicYears;
}

/**
 * Class containing all courses. This class is also used to manipulate said
 * data.
 */
export default class BlockScheduleData {
  /**
   * @param {number} startYear - Start year specified by the user when creating the block-schedule.
   * @param {any[]} courses - List of courses formatted as JSON.
   * @param {boolean} shouldSplitCourses - True if courses that overlap terms should be split into two course-blocks.
   */
  constructor(startYear, courses, shouldSplitCourses) {
    this.#startYear = startYear;
    this.#courses = courses;

    this.update(shouldSplitCourses);
  }

  /**
   * Updates the block-schedule's data. Splits courses that overlap both the
   * fall and spring term if requested.
   * 
   * @param {boolean} shouldSplitCourses - True if courses that overlap terms should be split into two course-blocks.
   */
  update(shouldSplitCourses) {
    let coursesByYear = groupCoursesByYear(this.#courses);

    // Add missing years.
    addFirstFiveYearsIfMissing(coursesByYear, this.#startYear);
    addMissingGapYears(coursesByYear);

    this.#academicYears = groupCoursesByTerm(coursesByYear, shouldSplitCourses);
  }

  /**
   * Appends an empty year to the coursesByTerm data. Uses the starting year of
   * the block-schedule as fallback if no years exists yet.
   */
  addAcademicYear() {
    let year;

    // If no years exists yet then wa want to add the start year.
    if (this.#academicYears.length === 0) {
      year = this.#startYear;
      
    // Otherwise, we want to add the academic year after the last.
    } else {
      const lastYear = this.#academicYears.reduce(
        (lastYear, academicYear) => Math.max(lastYear, academicYear.year),
        -Infinity
      );
      year = lastYear + 1;
    }

    // Create and add the new empty academic year.
    this.#academicYears.push(new AcademicYear(year));
  }

  /**
   * Getter for the courses, grouped by term for each year.
   */
  get academicYears() {
    return this.#academicYears;
  }

  /** @type {number} */
  #startYear;
  /** @type {CourseOccasion[]} */
  #courses;
  /** @type {AcademicYear[]} */
  #academicYears = [];
}
