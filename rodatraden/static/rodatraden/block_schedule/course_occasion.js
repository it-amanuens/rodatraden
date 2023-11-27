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
      isPrivate,
      json?.courseID,
      json?.prerequisites
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
   * @param {number|null} courseID
   * @param {number[][]} prerequisites
   */
  constructor(title, slug, ects, academicYear, start, weeks, isPrivate,
              courseID = null, prerequisites = []) {
    this.title = title;
    this.slug = slug;
    this.ects = ects;
    this.academicYear = academicYear;
    this.start = start;
    this.weeks = weeks;
    this.isPrivate = isPrivate;
    this.courseID = courseID;
    this.prerequisites = prerequisites;

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
  /** @type {boolean} */
  isPrivate;

  /** 
   * ID of the related course. Null if the course is private. This is used when
   * determining if prerequisites are met.
   * 
   * @type {number|null} */
  courseID;
  /**
   * Prerequisites expressed in terms of course IDs. It's a list of lists where
   * each list is a set of equivalent courses. If at least one course in each
   * list has been taken, the prerequisite is met.
   * 
   * @type {number[][]} */
  prerequisites;

  /** @type {number} */
  termStart;
  /** @type {number} */
  length;

  /** @type {number} */
  firstRowIndex = 0;

  /** 
   * IDs of all courses that have finished before this course starts. Used when
   * evaluating prerequisites.
   * 
   * @type {number[]} */
  earlierCourses = [];
  
  get speed() {
    // XXX: Course speed feels arbitrary. Why multiply by 50?
    return parseInt(this.ects * 10 * 5 / this.weeks);
  }
}
