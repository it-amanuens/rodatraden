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

// Store the chart instance globally so we can update it later.
let categorySumChart = null;

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

  // Get the CSS variable values for consistent styling.
  const style = getComputedStyle(document.documentElement);
  const grayColor = style.getPropertyValue('--gray').trim() || '#808080';
  const mainColor = style.getPropertyValue('--main-color').trim() || '#c0392b';

  // Create the Chart.js horizontal bar chart and store the reference.
  const ctx = document.getElementById('category-chart').getContext('2d');
  categorySumChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categoriesTitle,
      datasets: [
        {
          label: 'Krav',
          data: categoriesEcts,
          backgroundColor: grayColor
        },
        {
          label: 'Summa',
          data: categoriesSum,
          backgroundColor: mainColor
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            stepSize: 7.5
          },
          title: {
            display: true,
            text: 'Poäng per kategori'
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + context.parsed.x.toFixed(1) + ' hp';
            }
          }
        }
      }
    }
  });
}

/**
 * Updates the category sum chart and total HP by fetching new data from the server.
 * Call this function after adding or removing courses from the block schedule.
 * 
 * @param {string} categorySumsUrl - URL to fetch updated category sums and total ECTS.
 */
function updateCategorySumChart(categorySumsUrl) {
  if (!categorySumsUrl) {
    return;
  }

  fetch(categorySumsUrl)
    .then(response => response.json())
    .then(data => {
      // Update the "Summa" dataset (index 1) with new data.
      if (categorySumChart) {
        categorySumChart.data.datasets[1].data = data.categorySums;
        categorySumChart.update();
      }
      
      // Update the total HP display.
      const totalEctsElement = document.querySelector('.text-center > .lead');
      if (totalEctsElement) {
        totalEctsElement.textContent = 'Total hp: ' + data.totalEcts;
      }
    })
    .catch(error => console.error('Error updating category chart:', error));
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
  const blockReplaceCourseUrl = stringDataset.blockReplaceCourseUrl;
  const blockCourseListUrl = stringDataset.blockCourseListUrl;
  const blockGetRelatedOccasionsUrl = stringDataset.blockGetRelatedOccasionsUrl;
  const blockCategorySumsUrl = stringDataset.blockCategorySumsUrl;
  const prerequisiteCheckUrl = stringDataset.prerequisiteCheckUrl;
  const blockToggleCoursePrereqUrl = stringDataset.blockToggleCoursePrereqUrl;

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
    blockReplaceCourseUrl,
    blockCourseListUrl,
    blockGetRelatedOccasionsUrl,
    blockToggleCoursePrereqUrl,
    margin,
    scale
  );

  // Set up callback to update the category chart when courses change.
  if (blockCategorySumsUrl) {
    blockSchedule.setOnCoursesChangedCallback(() => {
      updateCategorySumChart(blockCategorySumsUrl);
    });
  }

  // Setup the button to add more years to the block-schedule.
  blockSchedule.setupAddYearButton('block-schedule-add-year');

  // When the window resizes from narrow to wide or vice versa, update the data
  // and redraw the block-schdule.
  blockSchedule.addResizeEventListener(isNarrowWindow);

  // Setup and update prerequisite checkbox.
  setupPrerequisiteCheckbox(prerequisiteCheckUrl);

  // Enable closing the modal by clicking outside the content box.
  /** @type { HTMLDialogElement } */
  const modal = document.getElementById('native-modal');

  // Helper function to close the modal with fade animation.
  function closeModalWithAnimation() {
    modal.classList.add('closing');
    modal.addEventListener(
      'animationend',
      () => {
        modal.classList.remove('closing');
        modal.close();
      },
      // Run the animation only once.
      { once: true }
    );
  }

  modal.addEventListener('click', event => {
    // Only clicks outside the modal content closes the modal. The modal itself
    // spans the whole window which is how we detect clicks outside the content.
    if (event.target === event.currentTarget) {
      closeModalWithAnimation();
      return;
    }

    // Handle clicks on elements with data-dismiss="modal" (close buttons).
    // This makes Bootstrap-style close buttons work with native <dialog>.
    const dismissButton = event.target.closest('[data-dismiss="modal"]');
    if (dismissButton) {
      event.preventDefault();
      closeModalWithAnimation();
    }
  });
}

// Run main function when the script is loaded.
main();
