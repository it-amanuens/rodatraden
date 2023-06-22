import updateBlockSchedule from './update_block_schedule.js'
import {
  splitCoursesOverTermBoundary,
  assignPositionsAndGroupByYear,
  groupCoursesByTerm,
  addAcademicYear
} from './rodatraden_blocks.js'

// Variables from the data parameters in a script tag. These are global (using
// "window.") so that they can be used in other scripts.
window.dataElement = document.getElementById('string-data');
window.startYear = parseInt(dataElement.dataset.startYear);
window.isLoggedIn = dataElement.dataset.isLoggedIn === 'True';
window.courseoccasionInfoUrl = dataElement.dataset.courseoccasionInfoUrl;
window.blockRemoveCourseUrl = dataElement.dataset.blockRemoveCourseUrl;
window.blockCourseListUrl = dataElement.dataset.blockCourseListUrl;

// Data that needs to be global so that their lifetime persist. These are
// global (using "window.") so that they can be used in other scripts.
window.shouldStackTerms = isNarrowWindow();
window.allCourses = undefined;
window.coursesByYear = undefined;
window.coursesByTerm = undefined;

/**
 * Updates the global course data. Splits courses that overlap both the fall an
 * spring ter if the terms are to be stacked vertically.
 */
function updateCourseData() {
  allCourses = getAllCourses();
  if (shouldStackTerms) {
    splitCoursesOverTermBoundary(allCourses);
  }
  coursesByYear = assignPositionsAndGroupByYear(allCourses, startYear);
  coursesByTerm = groupCoursesByTerm(coursesByYear);
}

/**
 * Determines if the window is narrow or not.
 * 
 * @returns True if the window is too narrow.
 */
function isNarrowWindow() {
  // TEMP: Arbitrarily chosen pixel value.
  const windowWidthThreshold = 800;
  return window.innerWidth < windowWidthThreshold;
}

/**
 * Setups event listeners for the buttons to update and delete the block-
 * schedule.
 */
function setupUpdateAndDeleteButtons() {
  $(".update-block").each(function () {
    $(this).modalForm({formURL: $(this).data('id')});
  });

  $(".delete-block").each(function () {
    $(this).modalForm({
      formURL: $(this).data('id'),
      isDeleteForm: true
    });
  });
}

/**
 * Setups the three different sections on the page (Block, chart and ISP) by
 * hiding all but one and seting up onclick event listeners for the related
 * buttons.
 */
function setupSections() {
  // Hide Chart and ISP sections.
  $("#chart").hide("fast");
  $("#ISP").hide("fast");
  
  // Setup onclick event listeners to show and hide the three different sections.
  $(".show-block").click(function() {
    $("#block-schedule").show("slow");
    $("#chart").hide("fast");
    $("#ISP").hide("fast");
  });
  $(".show-chart").click(function() {
    $("#block-schedule").hide("fast");
    $("#chart").show("slow");
    $("#ISP").hide("fast");
  });
  $(".show-ISP").click(function() {
    $("#block-schedule").hide("fast");
    $("#chart").hide("fast");
    $("#ISP").show("slow");
  });
}

/**
 * Setups the button that adds a year to the block schedule by adding an
 * onclick eventlistener. Clicking on it adds an additional year to the
 * schedule.
 */
function setupAddYearButton() {
  const button = document.getElementById('block-addyear');
  button.addEventListener('click', () => {
    addAcademicYear(coursesByTerm, startYear);
    updateBlockSchedule();
  });
}

/**
 * Creates a horizontal bar-chart that shows point sums for each category.
 * There are two bars for each category: one bar with the sum of all courses
 * in the schedule within that category, and one bar with the required points
 * within that category.
 */
function createCategorySumChart() {
  // Get data from data attributes.
  const categoriesTitle = JSON.parse(
    document.getElementById('categories-title-data').textContent
  );
  const categoriesEcts = JSON.parse(
    document.getElementById('categories-ects-data').textContent
  );
  const categoriesSum = JSON.parse(
    document.getElementById('categories-sum-data').textContent
  );

  // Set global chart options.
  Highcharts.setOptions({
    colors: ['var(--gray)', 'var(--main-color)']
  });  

  // Create the actual chart.
  Highcharts.chart('chart', {
    chart: {
      type: 'bar'
    },
    title: {
      text: ''
    },
    xAxis: {
      categories: categoriesTitle
    },
    yAxis: {
      min: 0,
      tickInterval: 7.5,
      title: {
        text: 'Poäng per kategori'
      }
    },
    tooltip: {
      headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
      pointFormat: '<tr><td style="font-size:12px;color:{series.color};padding:0">{series.name}:</td>'
        + '<td style="font-size:12px;padding:0"><b>{point.y:.1f} hp</b></td></tr>',
      footerFormat: '</table>',
      shared: true,
      useHTML: true
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0
      }
    },
    credits: {
      enabled: false
    },
    series: [
      {
        name: 'Krav',
        data: categoriesEcts
      },
      {
        name: 'Summa',
        data: categoriesSum
      }
    ]
  });
}

/**
 * Gets all private and non-private courses in the block-schedule from external
 * script tags and return them as a single collection.
 * 
 * @returns {Array} Private and non-private courses.
 */
function getAllCourses() {
  let courses = JSON.parse(
    document.getElementById('course-occasions-data').textContent
  );
  
  const privateCourses = JSON.parse(
    document.getElementById('private-courses-data').textContent
  );
  
  // Add speed to the non-private courses.
  for (let course of courses) {
    course.speed = parseInt(course.ects * 10 * 5 / course.weeks);
    // TODO: Replace all mentions of "length" with "weeks".
    course.length = course.weeks;
  }

  // Add speed to the private courses and add them to the other courses.
  for (let course of privateCourses) {
    // XXX: Course speed feels arbitrary. Why multiply by 50?
    course.speed = parseInt(course.ects * 10 * 5 / course.weeks);
    // TODO: Replace all mentions of "length" with "weeks".
    course.length = course.weeks;
    // XXX: Is this needed? Doesn't the course have an "is_priv" attribute?
    course.type = 'private';
    courses.push(course);
  }

  return courses;
}

/**
 * Main function for this file.
 */
function block_interface_main() {
  // Initialize the course data for the first time.
  updateCourseData();

  // Setup the three sections and most buttons.
  setupUpdateAndDeleteButtons();
  setupSections();
  setupAddYearButton();

  // Create the chart showing ECTS sums for each category.
  createCategorySumChart();

  // Create the block-schedule.
  updateBlockSchedule();  

  // Show the name of the file to be uploaded when a new file has been selected.
  document.querySelector('.custom-file-input').addEventListener(
    'change',
    function(e) {
      const fileName = document.getElementById("inputExcelFile").files[0].name;
      let label = e.target.nextElementSibling;
      label.innerText = fileName;
    }
  );

  // When the window resizes from narrow to wide or vice versa, update the data
  // and redraw the block-schdule.
  window.addEventListener('resize', () => {
    const oldTermLayout = shouldStackTerms;
    shouldStackTerms = isNarrowWindow();
    if (shouldStackTerms !== oldTermLayout) {
      updateCourseData();
      updateBlockSchedule();
    }
  })
}

// Run main function when the script is loaded.
block_interface_main();