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
 * @param {Map<number, CourseOccasion[]>} coursesByYear
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
 * @param {Map<number, CourseOccasion[]>} coursesByYear
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
 * @param {Map<number, CourseOccasion[]>} coursesByYear
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
   * @param {CourseOccasion[]} courses - List of course occasions.
   * @param {boolean} shouldSplitCourses - True if courses that overlap terms should be split into two course-blocks.
   */
  constructor(startYear, courses, shouldSplitCourses) {
    this.#startYear = startYear;
    this.#courses = courses;
    this.#shouldSplitCourses = shouldSplitCourses;

    this.update();
  }

  /**
   * Overwrites the courses with new ones and updates the block-schedule data.
   * 
   * @param {CourseOccasion[]} courses 
   */
  updateCourses(courses) {
    this.#courses = courses;
    this.update();
  }

  /**
   * Appends new courses to the existing ones and updates the block-schedule
   * data.
   * 
   * @param {CourseOccasion[]} courses
   */
  addCourses(courses) {
    // Only add courses if they are not already in the list by comparing slugs.
    const currentSlugs = this.#courses.map(course => course.slug);
    const newCourses = courses.filter(course =>
      !currentSlugs.includes(course.slug)
    );

    this.#courses = this.#courses.concat(newCourses);
    this.update();
  }

  /**
   * Removes courses from the existing ones and updates the block-schedule data.
   * 
   * @param {string[]} courseSlugs - List of slugs for course occasions.
   */
  removeCourses(courseSlugs) {
    const remainingCourses = this.#courses.filter(course =>
      !courseSlugs.includes(course.slug)
    );
    this.#courses = remainingCourses;
    this.update();
  }

  /**
   * Overwrites the split-courses setting and updates the block-schedule data.
   * 
   * @param {boolean} shouldSplitCourses 
   */
  updateSplit(shouldSplitCourses) {
    this.#shouldSplitCourses = shouldSplitCourses;
    this.update();
  }

  /**
   * Updates the block-schedule data by formatting it suitable for rendering.
   */
  update() {
    // Sort the course occasions by title so that their placement in the
    // block-schedule is predictable.
    this.#courses.sort((a, b) => a.title.localeCompare(b.title));

    // Update which prerequisites are unmet for each course.
    for (const occasion of this.#courses) {
      occasion.updateUnmetPrerequisites(this.#courses);
    }

    let coursesByYear = groupCoursesByYear(this.#courses);

    // Add missing years.
    addFirstFiveYearsIfMissing(coursesByYear, this.#startYear);
    addMissingGapYears(coursesByYear);

    this.#academicYears = groupCoursesByTerm(coursesByYear, this.#shouldSplitCourses);
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
   * Returns the inclusive span of years that the block-schedule covers, not to be confused with the AcademicYear class.
   * 
   * @returns {number[]} First and last year of the block-schedule as numbers.
   */
  getYearSpan() {
    const firstYear = this.#startYear;
    const lastYear = this.#startYear + this.#academicYears.length - 1;
    return [firstYear, lastYear];
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
  /** @type {boolean} */
  #shouldSplitCourses;

  /** @type {AcademicYear[]} */
  #academicYears = [];
}
