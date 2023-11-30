/**
 * Prerequisite for a course.
 */
export default class Prerequisite {
  /**
   * Create an instance from JSON data.
   * 
   * @param {any} json - Prerequisite as a JSON object.
   */
  static fromJSON(json) {
    return new Prerequisite(
      json.id,
      json.equivalentCourses
    );
  }

  /**
   * @param {number} id
   * @param {number[]} equivalentCourses
   */
  constructor(id, equivalentCourses) {
    this.id = id;
    this.equivalentCourses = equivalentCourses;
  }

  /** @type {number} */
  id;
  /** 
   * IDs the equivalent courses.
   * 
   * @type {number[]} */
  equivalentCourses;

  /**
   * Check if the prerequisite is met by the any of the given courses.
   * 
   * @param {number[]} startedCourseIDs - CourseIDs to check against.
   * @returns True if the prerequisite is met.
   */
  isMetBy(startedCourseIDs) {
    return this.equivalentCourses.some(courseID => startedCourseIDs.includes(courseID));
  }
}