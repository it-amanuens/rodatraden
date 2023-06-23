import CourseOccasion from "./course_occasion.js";
import Term from "./term.js";


export default class AcademicYear {
  /**
   * @param {number} year - Academic year.
   * @param {CourseOccasion[]} courses - Courses corresponding to the academic year.
   */
  constructor(year, courses = []) {
    this.#year = year;
    this.fall = Term.createFall(year, courses);
    this.spring = Term.createSpring(year, courses);
  }

  get year() {
    return this.#year;
  }

  /** @type {number} */
  #year;
  /** @type {CourseOccasion[]} */
  fall;
  /** @type {CourseOccasion[]} */
  spring;
}
