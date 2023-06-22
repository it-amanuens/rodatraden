/* Helper code for rendering blocks. */

  /**
   * ORDERING AND FIXING COURSESDATA
   */

/**
 * Sorts the courses by start week in ascending order. Courses that start
 * simultaneously are sorted by length in decending order.
 * 
 * @param {{start: number, length: number}[]} courses
 */
function sortCoursesByStartAndLength(courses) {
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
 * Adds a row the grid. The width will be the number of weeks in an academic
 * year and the row elements will be initialized with false to indicate empty
 * spots.
 * 
 * @param {boolean[][]} grid
 */
function addRow(grid) {
  const weekCount = 40;
  const row = new Array(weekCount).fill(false);
  grid.push(row);
}

/**
 * Returns the index of the first row in the grid where the course fits.
 * 
 * @param {{start: number, length: number}} course
 * @param {boolean[][]} grid
 * @returns {number} Index of the first row where the course fits.
 */
function getFirstRowOfCourse(course, grid) {
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

    if (doesCourseFitInRow(course, grid, rowIndex)) {
      ++suitableRowsFound;
    } else {
      suitableRowsFound = 0;
    }

    ++rowIndex;
  }

  const firstRowIndex = rowIndex - courseHeight;
  return firstRowIndex;
}

/**
 * Determines if a row has enough empty space for a course.
 *
 * @param {{start: number, length: number}} course
 * @param {boolean[][]} grid
 * @param {number} rowIndex
 * @returns {boolean}
 */
function doesCourseFitInRow(course, grid, rowIndex) {
  // Make sure the row of interest exists in the grid.
  while (grid.length <= rowIndex) {
    addRow(grid);
  }

  // The course shouldn't exceed the end of the row.
  const courseEnd = course.start + course.length - 1;
  if (courseEnd >= grid[0].length) {
    console.error("Can't fit a course that extends beyond the width of the grid.");
    return false;
  }

  // The course doesn't fit if a spot is already occupied.
  for (let columnIndex = course.start; columnIndex <= courseEnd; ++columnIndex) {
    const isOccupied = grid[rowIndex][columnIndex];
    if (isOccupied) {
      return false;
    }
  }

  return true;
}

/**
 * Applies the position of the course by writing to each element in the grid
 * that the course occupies.
 * 
 * @param {{start: number, length: number, firstRowIndex: number}} course
 * @param {boolean[][]} grid
 */
function writeCourseToGrid(course, grid) {
  const courseHeight = course.speed;
  const courseLastRowIndex = course.firstRowIndex + courseHeight - 1;

  for (let rowIndex = course.firstRowIndex; rowIndex <= courseLastRowIndex; ++rowIndex) {
    grid[rowIndex].fill(true, course.start, course.start + course.length);
  }
}

/**
 * Generates a position for each course. The position is the index of the first
 * row that the course occupies in a virtual grid. The courses are as a side
 * effect sorted in a way that is needed for generating the positions.
 *
 * @param {{start: number, length: number, firstRowIndex: number}[]} courses
 */
function generateCoursePositions(courses) {
  sortCoursesByStartAndLength(courses);

  let grid = [];
  for (let course of courses) {
    course.firstRowIndex = getFirstRowOfCourse(course, grid);
    writeCourseToGrid(course, grid);
  }
}

/**
 * Groups courses by their academic year using a Map.
 * 
 * @param {{year: number}[]} courses - Array of courses.
 * @returns {Map<number, {year: number}>} Map of courses grouped by academic year.
 */
function groupCoursesByYear(courses) {
  let coursesByYear = new Map();

  for (const course of courses) {
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
 * Splits courses that overlap both terms into two shorter course blocks.
 * 
 * @param {{start: number, length: number}[]} courses 
 */
export function splitCoursesOverTermBoundary(courses) {
  const springWeekStart = 20;

  for (let course of courses) {
    const courseEnd = course.start + course.length - 1;
    if (course.start < springWeekStart && courseEnd >= springWeekStart) {
      let courseSpringCopy = { ...course };

      courseSpringCopy.start = springWeekStart;

      const weekOverlap = courseEnd - springWeekStart + 1;
      course.length -= weekOverlap;
      courseSpringCopy.length = weekOverlap;

      courses.push(courseSpringCopy);
    }
  }
}

/**
 * Adds empty years if needed to make sure that the first five years exists.
 * 
 * @param {Map<number, {year: number}>} coursesByYear
 * @param {number} startYear - Start year specified by the user when creating the block schedule.
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
 * @param {Map<number, {year: number}>} coursesByYear 
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
 * Gives the courses a placement in the schedule and group the courses based on
 * their academic year. Their position defined as the index of the first
 * row that the course occupies in a virtual grid.
 * 
 * Also adds empty years to make sure that the first five years exists, as well
 * as adding missing years between exsiting years.
 * 
 * @param {{year: number}[]} allCourses
 * @param {number} startYear - Start year specified by the user when creating the block-schedule.
 * @returns {Map<number, any>} Map of courses grouped by academic year.
 */
export function assignPositionsAndGroupByYear(allCourses, startYear) {
  let coursesByYear = groupCoursesByYear(allCourses);

  // XXX: This function now does a bit more that the function name suggests.
  addFirstFiveYearsIfMissing(coursesByYear, startYear);
  addMissingGapYears(coursesByYear);
  
  for (let courses of coursesByYear.values()) {
    generateCoursePositions(courses);
  }

  return coursesByYear;
}

/**
 * Splits the courses for an academic year into two groups: fall and spring
 * courses.
 * 
 * @param {any[]} courses
 * @returns The courses split into a fall and spring term.
 */
function divideCoursesIntoTerms(courses) {
  const springWeekStart = 20;

  let fallCourses = [];
  let springCourses = [];

  for (const course of courses) {
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
 * Takes courses grouped by year and further group them by term. Some other
 * useful data is also calculated that will be used when rendering the block-
 * schedule.
 * 
 * @param {Map<number, any>} coursesByYear - Map from an academic year to courses that year.
 * @returns Courses grouped by term, together with some useful data.
 */
export function groupCoursesByTerm(coursesByYear) {
  let expectedStructure = [];

  for (const courseGroup of coursesByYear) {
    const year = courseGroup[0];
    const courses = courseGroup[1];

    const terms = divideCoursesIntoTerms(courses);
    
    expectedStructure.push({
      year: year,
      fall: {
        courses: terms.fall,
        ectsSumPeriod1: getEctsSumInPeriod(courses, 1),
        ectsSumPeriod2: getEctsSumInPeriod(courses, 2)
      },
      spring: {
        courses: terms.spring,
        ectsSumPeriod3: getEctsSumInPeriod(courses, 3),
        ectsSumPeriod4: getEctsSumInPeriod(courses, 4)
      },
      height: getCourseContainerHeight(courses)
    });
  }

  return expectedStructure;
}

  /**
   * RENDERING STUDYBLOCK
   */

/**
 * Calculates the height required to contain all given courses.
 * 
 * @param {{firstRowIndex: number, speed: number}[]} courses
 * @returns Height of the course container.
 */
function getCourseContainerHeight(courses) {
  // TEMP: These have been copied here to make it work.
  const margin = 1;
  const scale = 3;

  let containerHeight = 0;

  for(const course of courses) {
    const courseHeight = course.firstRowIndex + course.speed;
    containerHeight = Math.max(containerHeight, courseHeight);
  }

  return containerHeight * scale + 2 * margin;
}

/**
 * Appends an empty year to {@link coursesByYear}. Uses {@link startYear} as
 * fallback if no years exists yet.
 * 
 * @param {{year: number, courses: any}[]} coursesByYear
 * @param {number} startYear - Used if the first year has to be created.
 */
export function addAcademicYear(coursesByTerm, startYear) {
  // Create a new year with the startYear to begin with.
  let newCourseGroup = {
    year: startYear,
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
  if (coursesByTerm.length !== 0) {
    const lastYear = coursesByTerm.reduce(
      (lastYear, courseGroup) => Math.max(lastYear, courseGroup.year),
      -Infinity
    );
    newCourseGroup.year = lastYear + 1;
  }
  
  coursesByTerm.push(newCourseGroup);
}

/**
 * Calculates the total ECTS of all courses in a spceific period.
 * 
 * @param {{start: number, weeks: number, ects: number}[]} courses - All courses during an academic year.
 * @param {number} periodNumber - 1, 2, 3 or 4.
 * @returns The total ECTS of all courses in the given period.
 */
function getEctsSumInPeriod(courses, periodNumber) {
  const periodWeekLength = 10;
  const periodStart = periodWeekLength * (periodNumber - 1);
  const periodEnd = periodStart + periodWeekLength - 1;

  const ectsSum = courses.reduce(
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
