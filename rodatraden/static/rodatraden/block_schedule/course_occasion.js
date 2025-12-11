import Prerequisite from "./prerequisite.js";

/**
 * This class holds all the data relevant for a course occasion. The terms
 * "course" and "course occasion" are expected to often be interchanged.
 */
export default class CourseOccasion {
  /**
   * Create a Course instance from JSON data.
   * 
   * @param {any} json - Course as a JSON object.
   */
  static fromJSON(json) {
    // Convert prerequisites from JSON to Prerequisite instances.
    const prerequisites = json?.prerequisites?.map(prerequisite => {
      return Prerequisite.fromJSON(prerequisite);
    });

    return new CourseOccasion(
      json.title,
      json.slug,
      json.ects,
      json.year,
      json.start,
      json.weeks,
      json.isPrivate,
      json?.courseID,
      prerequisites
    );
  }

  /**
   * Gets all private and non-private courses in the block-schedule from
   * external script tags and return them as a single collection.
   * 
   * @param {string} elementID - The ID of the script tag containing the courses.
   * @returns All courses, private and non-private in no particular order.
   */
  static fromElement(elementID) {
    const courseOccasionsAsJSON = JSON.parse(
      document.getElementById(elementID).textContent
    );

    /** @type {CourseOccasion[]} */
    const courseOccasions = courseOccasionsAsJSON.map(occasion => {
      return this.fromJSON(occasion);
    });

    return courseOccasions;
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
   * @param {Prerequisite[]} prerequisites
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
    this.visibleWeeks = this.weeks;

    this.isGhost = false;
  }

  /**
   * Returns a copy of the course occasion.
   * 
   * @returns {CourseOccasion} Copy of the course occasion.
   */
  clone() {
    let clone = new CourseOccasion();

    // Copy all properties.
    for (const key in this) {
      clone[key] = this[key];
    }

    return clone;
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
  /** @type {Prerequisite[]} */
  prerequisites;
  /** 
   * True if this is a temporary target spawned during a drag-and-drop action.
   * 
   * @type {boolean} */
  isGhost;

  /** 
   * IDs of all unmet prerequisites.
   * 
   * @type {number[]}
   */
  unmetPrerequisiteIDs = [];

  /**
   * True if this course already appears earlier in the schedule (retake).
   * 
   * @type {boolean}
   */
  isRetake = false;

  /** @type {number} */
  termStart;
  /** @type {number} */
  visibleWeeks;

  /** @type {number} */
  firstRowIndex = 0;
  
  get speed() {
    // XXX: Course speed feels arbitrary. Why multiply by 50?
    return parseInt(this.ects * 10 * 5 / this.weeks);
  }

  /**
   * Returns the IDs of all courses that have started before the course
   * occasion starts. Ignores courses without IDs. Iterates over all course
   * occasions and therefore doesn't need the occasions to be sorted.
   * 
   * @param {CourseOccasion[]} courseOccasions - Course occasions in schedule
   * @returns {number[]} IDs of courses that have started before this occasion starts.
   */
  getEarlierStartedCourseIDs(courseOccasions) {
    let earlierCourseIDs = [];

    for (const courseOccasion of courseOccasions) {
      if (courseOccasion.courseID === null) {
        continue;
      }

      const startYear = courseOccasion.academicYear;
      const startWeek = courseOccasion.start;

      if (startYear < this.academicYear) {
        earlierCourseIDs.push(courseOccasion.courseID);
      } else if (startYear === this.academicYear && startWeek < this.start) {
        earlierCourseIDs.push(courseOccasion.courseID);
      }
    }

    return earlierCourseIDs;
  }

  /**
   * Update the list of IDs of the course's prerequisites that have not been
   * met. The supplied list of course occasions is used to determine which
   * courses have been started before this course occasion and therefore
   * should be used to check prerequisites against.
   * 
   * @param {CourseOccasion[]} courseOccasions - Course occasions in schedule.
   */
  updateUnmetPrerequisites(courseOccasions) {
    // None can be unmet if there are no prerequisites to be begin with.
    if (this.prerequisites.length === 0) {
      this.unmetPrerequisiteIDs = [];
      return;
    }

    const startedCourses = this.getEarlierStartedCourseIDs(courseOccasions);
    // Can't meet any prerequisites without started courses.
    if (startedCourses.length === 0) {
      this.unmetPrerequisiteIDs = this.prerequisites.map(prerequisite => prerequisite.id);
      return;
    }

    this.unmetPrerequisiteIDs = [];
    for (const prerequisite of this.prerequisites) {
      if (!prerequisite.isMetBy(startedCourses)) {
        this.unmetPrerequisiteIDs.push(prerequisite.id);
      }
    }
  }

  /**
   * Update whether this course is a retake (same course appears earlier in schedule).
   * Private courses are never considered retakes since they don't share a courseID.
   * 
   * @param {CourseOccasion[]} courseOccasions - Course occasions in schedule.
   */
  updateRetakeStatus(courseOccasions) {
    // Private courses can't be retakes (no shared courseID)
    if (this.isPrivate || this.courseID === null) {
      this.isRetake = false;
      return;
    }

    // Check if the same course (by courseID) appears earlier in the schedule
    for (const other of courseOccasions) {
      // Skip self, private courses, and courses without IDs
      if (other === this || other.isPrivate || other.courseID === null) {
        continue;
      }

      // Only consider courses with the same courseID
      if (other.courseID !== this.courseID) {
        continue;
      }

      // Check if the other course starts before this one
      if (other.academicYear < this.academicYear) {
        this.isRetake = true;
        return;
      } else if (other.academicYear === this.academicYear && other.start < this.start) {
        this.isRetake = true;
        return;
      }
    }

    this.isRetake = false;
  }

  /**
   * Create a ghost form of the course. The ghost form is used to visualize
   * a possible drag-and-drop target.
   * 
   * @returns Ghost form of the course.
   */
  createGhost() {
    const ghost = this.clone();
    ghost.isGhost = true;
    return ghost;
  }
}
