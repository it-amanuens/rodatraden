import CourseOccasion from "./course_occasion.js";

const springWeekStart = 20;

/**
 * Takes courses within the same year and returns those that start in the fall.
 * 
 * @param {CourseOccasion[]} coursesInSameYear
 * @returns The courses that start in the fall.
 */
function getFallCourses(coursesInSameYear) {
  let courses = [];

  for (const course of coursesInSameYear) {
    if (course.start < springWeekStart) {
      // The terms are positioned based on their starting offset relative to
      // the start of the term. For fall courses the start is the same.
      course.termStart = course.start;
      courses.push(course);
    }
  }

  return courses;
}

/**
 * Takes courses within the same year and returns those that start in the
 * spring.
 * 
 * @param {CourseOccasion[]} coursesInSameYear
 * @returns The courses that start in the spring.
 */
function getSpringCourses(coursesInSameYear) {
  let courses = [];

  for (const course of coursesInSameYear) {
    if (course.start >= springWeekStart) {
      // The terms are positioned based on their starting offset relative to
      // the start of the term. For spring courses we therefore need to
      // subtract 20 weeks from the academic year start.
      course.termStart = course.start - springWeekStart;
      courses.push(course);
    }
  }

  return courses;
}

/**
   * Calculates the total ECTS of all courses in a spceific period. If only
   * part of the course is in that period then a proportional part of the ECTS
   * for that course is added to the sum.
   * 
   * @param {CourseOccasion[]} coursesInSameYear - Courses during the same academic year.
   * @param {number} periodNumber - 1, 2, 3 or 4.
   * @returns Total ECTS in the given period.
   */
function getEctsSumInPeriod(coursesInSameYear, periodNumber) {
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
 * Class containing courses within the term and other useful data.
 */
export default class Term {
  /**
   * Creates a fall term.
   * @param {number} academicYear
   * @param {CourseOccasion[]} coursesInAcademicYear
   * @returns Fall term.
   */
  static createFall(academicYear, coursesInAcademicYear) {
    return new Term(
      'HT',
      academicYear,
      getFallCourses(coursesInAcademicYear),
      [
        getEctsSumInPeriod(coursesInAcademicYear, 1),
        getEctsSumInPeriod(coursesInAcademicYear, 2)
      ]
    );
  }

  /**
   * Creates a spring term.
   * @param {number} academicYear
   * @param {CourseOccasion[]} coursesInAcademicYear
   * @returns Spring term.
   */
  static createSpring(academicYear, coursesInAcademicYear) {
    return new Term(
      'VT',
      academicYear,
      getSpringCourses(coursesInAcademicYear),
      [
        getEctsSumInPeriod(coursesInAcademicYear, 3),
        getEctsSumInPeriod(coursesInAcademicYear, 4)
      ]
    );
  }

  /**
   * @param {string} termPrefix 
   * @param {number} academicYear 
   * @param {CourseOccasion[]} termCourses 
   * @param {[number, number]} ectsSumPerPeriod 
   */
  constructor(termPrefix, academicYear, termCourses = [], ectsSumPerPeriod = [0, 0]) {
    this.#prefix = termPrefix;
    this.#academicYear = academicYear;
    this.#courses = termCourses;
    this.#ectsSumPerPeriod = ectsSumPerPeriod;
  }

  get prefix() {
    return this.#prefix;
  }
  get academicYear() {
    return this.#academicYear;
  }
  get courses() {
    return this.#courses;
  }
  get ectsSumPerPeriod() {
    return this.#ectsSumPerPeriod;
  }

  /**
   * Combines the term prefix and the last two digits of the term year to
   * create the title. The term year differs from the academic year during the
   * spring.
   */
  get title() {
    // The term year is one more than the academic year in the spring.
    const termYear = this.#academicYear + (this.#prefix === 'VT');
    return this.#prefix + termYear.toString().slice(-2);
  }

  /** @type {string} */
  #prefix;
  /** @type {number} */
  #academicYear;
  /** @type {CourseOccasion[]} */
  #courses;
  /** @type {number[]} */
  #ectsSumPerPeriod;
}
