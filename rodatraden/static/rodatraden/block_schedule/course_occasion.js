/**
 * This class holds all the data relevant for a course occasion. The terms
 * "course" and "course occasion" are expected to often be interchanged.
 */
export default class CourseOccasion {
  /**
   * Create a Course instance from JSON data.
   * 
   * @param {any} json - Course as a JSON object.
   * @param {boolean} isPrivate - True if the course (course-occasion) is user-created.
   */
  static fromJSON(json, isPrivate) {
    // XXX: isPrivate should be taken from JSON data and not as a parameter.
    return new CourseOccasion(
      json.title,
      json.slug,
      json.ects,
      json.year,
      json.start,
      json.weeks,
      isPrivate
    );
  }

  /**
   * @param {string} title 
   * @param {string} slug 
   * @param {number} ects 
   * @param {number} academicYear 
   * @param {number} start 
   * @param {number} weeks 
   * @param {boolean} isPrivate 
   */
  constructor(title, slug, ects, academicYear, start, weeks, isPrivate) {
    this.title = title;
    this.slug = slug;
    this.ects = ects;
    this.academicYear = academicYear;
    this.start = start;
    this.weeks = weeks;
    this.isPrivate = isPrivate;

    this.termStart = this.start;
    // TODO: Replace all mentions of "length" with "weeks".
    this.length = this.weeks;
  }

  /** @type {string} */
  title;
  /** @type {string} */
  slug;
  /** @type {number} */
  ects;
  /** @type {number} */
  academicYear;
  /** @type {number} */
  start;
  /** @type {number} */
  weeks;
  /** @type {booelan} */
  isPrivate;

  /** @type {number} */
  termStart;
  /** @type {number} */
  length;

  /** @type {number} */
  firstRowIndex = 0;
  
  get speed() {
    // XXX: Course speed feels arbitrary. Why multiply by 50?
    return parseInt(this.ects * 10 * 5 / this.weeks);
  }
}
