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
 * Group courses by their academic year using a Map.
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
function splitCoursesOverTermBoundary(courses) {
  const springWeekStart = 20;

  for (let course of courses) {
    const courseEnd = course.start + course.length - 1;
    if (course.start < springWeekStart && courseEnd >= springWeekStart) {
      let courseRemainder = { ...course };

      courseRemainder.start = springWeekStart;

      const weekOverlap = courseEnd - springWeekStart + 1;
      course.length -= weekOverlap;
      courseRemainder.length = weekOverlap;

      courses.push(courseRemainder);
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
 * @param {number} startYear - Start year specified by the user when creating the block schedule.
 * @returns {Map<number, any>} Courses with their positions set, grouped by year.
 */
function assignPositionsAndGroupByYear(allCourses, startYear) {
  let coursesByYear = groupCoursesByYear(allCourses);

  // XXX: This function now does a bit more that the function name suggests.
  addFirstFiveYearsIfMissing(coursesByYear, startYear);
  addMissingGapYears(coursesByYear);
  
  for (let courses of coursesByYear.values()) {
    generateCoursePositions(courses);
  }

  return coursesByYear;
}

function divideCoursesIntoTerms(courses) {
  const springWeekStart = 20;

  let fallCourses = [];
  let springCourses = [];

  for (const course of courses) {
    if (course.start >= springWeekStart) {
      // XXX: This is needed for now to position the courses correctly.
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

function assignPositionsAndGroupByTerm(coursesByYear) {
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
      height: courseBlockHeight(courses)
    });
  }

  return expectedStructure;
}

  /**
   * RENDERING STUDYBLOCK
   */

/*
 * Calculates the courseBlock height from the
 * coursesData[i].courses dataset
 */
function courseBlockHeight(dataset){
  // TEMP: These have been copied here to make it work.
  const margin = 1;
  const scale = 3;

  var maxHeight = 1;
  for(var i = 0; i < dataset.length; i++){
    var block = dataset[i];
    var height = block.firstRowIndex + block.speed;
    if(height > maxHeight)
      maxHeight = height;
  }
  return maxHeight * scale + 2 * margin;
}

/*
 * Calculates the height of a blockrow without the
 * Height of the part with courses (courseBlock), since this is a constant
 * for all rows i call in it blockRowBaseHeight! Even tough that can
 * be slightly misleading, WHAT THA HELL IS A BASE ANYWAY!?
 *
 * All heights is calculated from basic css properties so if that change
 * this function will take that into consideration
 */
function blockRowBaseHeight() {
  //Need to add some hidden divs with correct class to get css properties
  var blockFooter = $("<div class='block-footer'><div class='block-footer-lp'><p style='margin: 0px;'>text</p></div></div>")
    .hide().appendTo("body");
  var blockHeader = $("<div class='block-header'>1234</div>")
    .hide().appendTo("body");

  //Get height values from css properties
  var footerHeight = parseInt($(".block-footer").css("height")),
    titleHeight = parseInt($(".block-header").css("height")),
    //Here we need to specify Left,Right,Top or Bottom according to stupid firefox
    titlePadding = parseInt($(".block-header").css("paddingTop")),
    baseHeight = footerHeight+titleHeight+titlePadding;

  //Remove hidden divs
  blockFooter.remove();
  blockHeader.remove();

  return baseHeight
}

function yearButtonHeight() {
  var yearButton = $("<div class='block-row block-header add-year text-center' style='opacity: 1; left: 0px; right: 0px; position: absolute;'>Add Year</div>").hide().appendTo("body");
  var yearButtonHeightValue = parseInt($(".add-year").css("height"));

  yearButton.remove();

  return yearButtonHeightValue;
}

function blockRowMargin() {
  var	blockHeader = $("<div class='block-row'></div>").hide().appendTo("body");
  //Here we need to specify Left,Right,Top or Bottom according to stupid firefox
  var blockRowMarginValue = parseInt($(".block-row").css("marginTop"))
  blockHeader.remove();

  return blockRowMarginValue;
}

/**
 * Append a year to {@link coursesByYear}. Uses {@link startYear} as fallback
 * if no years exists yet.
 * 
 * @param {{year: number, courses: any}[]} coursesByYear
 * @param {number} startYear - Used as a fallback if no years exists yet.
 */
function addAcademicYear(coursesByTerm, startYear) {
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

  if (coursesByTerm.length !== 0) {
    const lastYear = coursesByTerm.reduce(
      (lastYear, courseGroup) => Math.max(lastYear, courseGroup.year),
      -Infinity
    );
    newCourseGroup.year = lastYear + 1;
  }
  
  coursesByTerm.push(newCourseGroup);
}

/*
 * Goes through the block and finds if you have all
 * the prerequisites to take a course.
 * Returns 1 if yes, 0 if no
 */
function doIHavePrerequisites(coursesData, prerequisites, year, start) {
  var prerequisitesId = [];
  if (!prerequisites) {
    return 1;
  }

  for (var i in prerequisites) {
    prerequisitesId.push(prerequisites[i].id);
  }

  var start_year = parseInt(coursesData[0].year);
  var ids = [];

  for (var i = year-start_year; i >= 0; i--) {
    if (i == year-start_year) {
      for (var j in coursesData[i].courses) {
        if (coursesData[i].courses[j].start < start) {
          ids.push(coursesData[i].courses[j].course_id);
        }
      }
    } else {
      for (var j in coursesData[i].courses) {
        ids.push(coursesData[i].courses[j].course_id);
      }
    }
  }

  for (var i in prerequisitesId) {
    if (ids.indexOf(prerequisitesId[i]) == -1) {
      return 0;
    }
  }

  /* If any of the plucked course ids fits with the prerequisites return 1 */
  return 1;
}

/*
 * Sums over the amount of ects in a study period.
 */
function getEctsSumInPeriod(courses, periodNumber) {
  let ectsSum = 0;

  const periodWeekLength = 10;
  const periodStart = periodWeekLength * (periodNumber - 1);
  const periodEnd = periodStart + periodWeekLength - 1;

  for (let course of courses) {
    const courseStart = course.start;
    const courseEnd = course.start + course.weeks - 1;

    // Skip the course if it doesn't overlap with the period.
    if (courseEnd < periodStart || periodEnd < courseStart) continue;

    // Calculate how many weeks the course overlaps with the period.
    const overlapStart = Math.max(courseStart, periodStart);
    const overlapEnd = Math.min(courseEnd, periodEnd);
    const overlapInWeeks = overlapEnd - overlapStart + 1;

    const ectsPerWeek = course.ects / course.weeks;
    const ectsInPeriod = ectsPerWeek * overlapInWeeks;

    ectsSum += ectsInPeriod;
  }

  return ectsSum;
}
