/* Bootstrap nice tooltips */
$(function () { $('[data-toggle="tooltip"]').tooltip() })
/* BOotstrap dropdown */
$(function(){ $('.dropdown-toggle').dropdown(); });


  /**
   * ORDERING AND FIXING COURSESDATA
   */

/**
 * creates a matrix of elements rows and assign each row with an empty array
 *
 * @param elements
 * @returns {Array}
 */
function createMatrix(elements) {
  var matrix = [];

  for (var i = 0; i < elements; i++) {
    matrix.push([]);
  }

  return matrix;
}

/**
 * Sort array on start attribute in ascending oreder
 *
 * @type {Array.<{start: number, length: number, speed: number, id: number}>}
 */
function sort(courses) {

  courses = courses.sort(function (a, b) {
    return b.length - a.length
  });

  return courses;
}

/**
 * Find first possible row where a submatrix defined by the course fits.
 *
 * @param course
 * @param matrix
 */
function getFreeRow(course, matrix) {
  var emptyRows = 0;

  for (var row = 0; row < 1000 && emptyRows < course.speed; row++) {

    if (isEmptyRow(course, row, matrix)) {
      emptyRows++;
    }
    else {
      emptyRows = 0;
    }

  }

  course.row = row - course.speed;
}

/**
 * Determine if a row for a course is empty
 *
 * @param course
 * @param row
 * @returns {boolean}
 */
function isEmptyRow(course, row, matrix) {
  var sum = 0;

  for (var col = course.start; 
    col < course.start + course.length && col < matrix.length; col++) {

    if (matrix[col][row] == undefined) {
      matrix[col].push(0);
    }

    sum += matrix[col][row];
  }

  return sum == 0;
}

/**
 * Allocates space in matrix for a course
 *
 * @param course
 * @param matrix
 */
function allocateRows(course, matrix) {

  for (var week = course.start; 
    week < course.start + course.length && week < matrix.length; week++) {

    for (var i = course.row; i < course.row + course.speed; i++) {
      matrix[week][i] = course.id;
    }

  }
}

/**
 * Generate position for all courses in the matrix
 *
 * @param courses
 * @param matrix
 */
function prepareBlock(courses, matrix) {

  for (var i = 0; i < courses.length; i++) {
    getFreeRow(courses[i], matrix);
    allocateRows(courses[i], matrix);
  }

}

/**
 * Render occasion from a set of occasions such that each course get a
 * placement and year in the block.
 * @param allCourses
 * @returns {Array}
 */
function render(allCourses, start_year){
  var data = [];
  var course;

  //Need to figure out the differance between
  //start year and the last year
  var endYear = start_year+5;

  for(var i=0; i<allCourses.length; i++) {

    if(parseInt(allCourses[i].year)>endYear) {
      endYear = parseInt(allCourses[i].year);
    }

  }

  for(var i = 0; i<(endYear-start_year); i++){
    data[start_year+i] = [];
  }

  allCourses = sort(allCourses);

  for (var i in allCourses) {
    course = allCourses[i];

    if (data[course.year] == undefined) {
      data[course.year] = [course];
    } else {
      data[course.year].push(course);
    }
  }

  var output = [];

  for (var year in data) {
    var courses = data[year];
    var matrix = createMatrix(40);

    prepareBlock(courses, matrix);
    output.push({year: year, courses: courses});
  }

  return output;
}

  /**
   * RENDERING STUDYBLOCK
   */

/*
 * Calculates the courseBlock height from the
 * coursesData[i].courses dataset
 */
function courseBlockHeight(dataset, scale, margin){
  var maxHeight = 1;
  for(var i = 0; i < dataset.length; i++){
    var block = dataset[i];
    var height = block.row + block.speed;
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

function getTopOffsets(coursesData, scale, margin) {

  var baseHeight = blockRowBaseHeight();
  var topOffsetValues = [0];

  //Logic is slightly forced here, but just recall that
  //we start with pixel value of zero and when we push
  //we always push to topOffsetValues[i+1]
  for(var i=0; i<coursesData.length; i++) {
    topOffsetValues.push(courseBlockHeight(coursesData[i].courses, scale, margin)+baseHeight);
    topOffsetValues[i+1] += topOffsetValues[i] + 30;
  }

  var topOffset = d3.scaleOrdinal()
    .domain(d3.range(coursesData.length))
    .range(topOffsetValues);


  return topOffset;
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

/*
 * Append a course year to courseData
 * Assumes sorted coursesData
 */
function addCourseYear(coursesData) {
  var curLastCourseYear = parseInt(coursesData[(coursesData.length)-1].year);
  var extraCourseYear = {courses: [], year: (curLastCourseYear+1)};
  coursesData.push(extraCourseYear);
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
 * Sums over the amount of hp in a study period.
 */
function hpSumInPeriod(coursesData, year, lp) {
  var start_year = parseInt(coursesData[0].year);
  var correctIndex = year - start_year;
  var correctCourses = coursesData[correctIndex].courses;
  var sum = 0;

  for (var i in correctCourses) {
    var start = correctCourses[i].start;
    var length = correctCourses[i].length;


    // Silly logic needed because apparently private and public courses do not store
    // their ects the same way
    //if ( correctCourses[i].type != 'private' ) {
      //var speed = parseFloat(correctCourses[i].course.ects)/length;
    //} else {
      //var speed = parseFloat(correctCourses[i].ects)/length;
    //}
      var speed = parseFloat(correctCourses[i].ects)/length;
    var temp = 0;

    if (start < 10 * (lp - 1)) {
      if (length > (10 * (lp - 1) - start)) {
        sum = sum + (length - (10 * (lp - 1) - start))*speed;
      }
    } else if (start < 10 * lp) {
      if (length > (10 * lp - start)) {
        sum = sum + (10 * lp - start)*speed;
      } else {
        sum = sum + length*speed;
      }
    }
  }
  return sum;
}
