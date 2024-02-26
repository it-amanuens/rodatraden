import CourseOccasion from "./course_occasion.js";

/**
 * Grid used to determine the positions of courses in a block-schedule. One
 * grid is used per academic year.
 */
export default class CourseGrid {

  /**
   * Places the course in the grid where it fits.
   * 
   * @param {CourseOccasion} course
   * @returns Position of the course in the grid as an index of the first row that the course occupies.
   */
  writeCourseToGrid(course) {
    const firstRowIndex = this.#getFirstRowOfCourse(course);
    const courseHeight = course.speed;
    const courseLastRowIndex = firstRowIndex + courseHeight - 1;

    for (let rowIndex = firstRowIndex; rowIndex <= courseLastRowIndex; ++rowIndex) {
      this.#grid[rowIndex].fill(true, course.start, course.start + course.visibleWeeks);
    }

    return firstRowIndex;
  }

  #weekCount = 40;
  #grid = [];

  /**
   * Adds a row the grid. The width will be the number of weeks in an academic
   * year and the row elements will be initialized with false to indicate empty
   * spots.
   */
  #addRow() {
    const row = new Array(this.#weekCount).fill(false);
    this.#grid.push(row);
  }

  /**
   * Determines if a row has enough empty space for a course.
   *
   * @param {CourseOccasion} course
   * @param {number} rowIndex
   * @returns {boolean}
   */
  #doesCourseFitInRow(course, rowIndex) {
    // Make sure the row of interest exists in the grid.
    while (this.#grid.length <= rowIndex) {
      this.#addRow();
    }

    // The course shouldn't exceed the end of the row.
    const courseEnd = course.start + course.visibleWeeks - 1;
    if (courseEnd >= this.#grid[0].length) {
      console.error("Can't fit a course that extends beyond the width of the grid.");
      return false;
    }

    // The course doesn't fit if a spot is already occupied.
    for (let columnIndex = course.start; columnIndex <= courseEnd; ++columnIndex) {
      const isOccupied = this.#grid[rowIndex][columnIndex];
      if (isOccupied) {
        return false;
      }
    }

    return true;
  }

  /**
   * Returns the index of the first row in the grid where the course fits.
   * 
   * @param {CourseOccasion} course
   * @returns {number} Index of the first row where the course fits.
   */
  #getFirstRowOfCourse(course) {
    const maxRowCount = 1000;
    const courseHeight = course.speed;

    let rowIndex = 0;
    let suitableRowsFound = 0;

    while (suitableRowsFound < courseHeight) {
      // Something is wrong if it tries too many times to find suitable rows.
      if (rowIndex >= maxRowCount) {
        console.error("Couldn't find a spot in the grid for the following course:", course);
        return 0;
      }

      if (this.#doesCourseFitInRow(course, rowIndex)) {
        ++suitableRowsFound;
      } else {
        suitableRowsFound = 0;
      }

      ++rowIndex;
    }

    const firstRowIndex = rowIndex - courseHeight;
    return firstRowIndex;
  }
}
