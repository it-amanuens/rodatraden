import CourseOccasion from "./block_schedule/course_occasion.js";
import BlockSchedule from './block_schedule/block_schedule.js';
import { updatePrerequisiteWarnings } from './block_schedule/block_schedule_renderer.js';

// To be able to update the block-schedule at a later time, it has to be defined
// outside of any function. This way its lifetime will persist.
/** @type {BlockSchedule} */
let blockSchedule;

/**
 * Sends a request to the server to enable or disable the prerequisite check.
 * When enabled, errors will be shown for courses that have unmet prerequisites.
 * 
 * @param {string} url - The url to send the request to.
 * @param {bool} shouldEnable - True if the prerequisite check should be enabled. Otherwise it will be disabled.
 */
function sendPrerequisiteCheckState(url, shouldEnable) {
  if (shouldEnable) {
    url += "?enable=1";
  }
  fetch(url, {
    method: 'GET'
  })
  .catch(error => console.error(error));
}

/**
 * Setups the prerequisite toggle checkbox to show or hide warning icons and
 * tooltips.
 */
function setupPrerequisiteCheckbox(prerequisiteCheckUrl) {
  const checkbox = document.getElementById('prerequisite-checkbox');
  checkbox.addEventListener('change', () => {
    updatePrerequisiteWarnings(prerequisiteCheckUrl);
    sendPrerequisiteCheckState(prerequisiteCheckUrl, checkbox.checked);
  });
}

/**
 * Setups event listeners for the buttons to update and delete the block-
 * schedule, as well as import from other schedules.
 */
function setupMenuButtons() {
  $(".update-block").each(function () {
    $(this).modalForm({formURL: $(this).data('id')});
  });

  $(".import-block").each(function () {
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
 * Given a starting year and week, return the IDs of all courses that have
 * finished by that time. Ignore courses without IDs. Iterates over all course
 * occasions and therefore doesn't need occasions to be sorted.
 * 
 * @param {number} start_year 
 * @param {number} start_week 
 * @param {number[]} courseOccasions 
 */
function getEarlierCourseIDs(start_year, start_week, courseOccasions) {
  let earlierCourseIDs = [];

  for (const courseOccasion of courseOccasions) {
    // Ignore courses without IDs.
    if (courseOccasion.courseID === null) {
      continue;
    }

    // Check if the course was finished before the given start time.
    if (courseOccasion.academicYear < start_year) {
      earlierCourseIDs.push(courseOccasion.courseID);
    } else if (courseOccasion.academicYear === start_year) {
      if (courseOccasion.start + courseOccasion.weeks <= start_week) {
        earlierCourseIDs.push(courseOccasion.courseID);
      }
    }
  }

  return earlierCourseIDs;
}

/**
 * Determines if the window is narrow or not.
 * 
 * @returns True if the window is too narrow to fit the terms on the same row.
 */
function isNarrowWindow() {
  // TEMP: Arbitrarily chosen pixel value.
  const windowWidthThreshold = 800;
  return window.innerWidth < windowWidthThreshold;
}

/**
 * Main function for this script.
 */
function main() {
  // Setup the three sections and most buttons.
  setupMenuButtons();
  setupSections();
  
  // Create the chart showing ECTS sums for each category.
  createCategorySumChart();
  
  // Show the name of the file to be uploaded when a new file has been selected.
  document.querySelector('.custom-file-input').addEventListener(
    'change',
    function(e) {
      const fileName = document.getElementById("inputExcelFile").files[0].name;
      let label = e.target.nextElementSibling;
      label.innerText = fileName;
    }
  );

  const courseOccasions = CourseOccasion.fromElement('course-occasions-data');

  // The block schedule renderer will populate this container with elements.
  const academicYearContainer = document.getElementById('academic-year-container');

  // Make sure that terms are rendered correctly from start.
  const shouldStackTerms = isNarrowWindow();

  // Get variables from data parameters in a script tag.
  const stringDataset = document.getElementById('string-data').dataset;
  const startYear = parseInt(stringDataset.startYear);
  const isLoggedIn = stringDataset.isLoggedIn === 'True';
  const courseoccasionInfoUrl = stringDataset.courseoccasionInfoUrl;
  const blockRemoveCourseUrl = stringDataset.blockRemoveCourseUrl;
  const blockCourseListUrl = stringDataset.blockCourseListUrl;
  const blockGetCoursesUrl = stringDataset.blockGetCoursesUrl;
  const prerequisiteCheckUrl = stringDataset.prerequisiteCheckUrl;

  // Margin and scale affects the rendered blocks appearance.
  const margin = 1;
  const scale = 3;

  // Create a block schedule which renders it automatically in the specified
  // container.
  blockSchedule = new BlockSchedule(
    startYear,
    courseOccasions,
    academicYearContainer,
    shouldStackTerms,
    isLoggedIn,
    courseoccasionInfoUrl,
    blockRemoveCourseUrl,
    blockCourseListUrl,
    margin,
    scale
  );

  // Setup the button to add more years to the block-schedule.
  blockSchedule.setupAddYearButton('block-schedule-add-year');

  // When the window resizes from narrow to wide or vice versa, update the data
  // and redraw the block-schdule.
  blockSchedule.addResizeEventListener(isNarrowWindow);

  // Setup and update prerequisite checkbox.
  setupPrerequisiteCheckbox(prerequisiteCheckUrl);

  // Make sure to reload the block-schedule if any course occasions are added.
  document.getElementById('modal').addEventListener('click', event => {
    // We only care for clicks outside of the modal that causes the modal to
    // close. If that is the case, there is a chance a course occasion was
    // added, so we need to get them and update the block-schedule.
    if (event.target === event.currentTarget) {
      blockSchedule.downloadCourses(blockGetCoursesUrl);
    }
  });
}

// Run main function when the script is loaded.
main();
