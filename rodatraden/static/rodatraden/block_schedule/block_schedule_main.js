import BlockScheduleData from './block_schedule_data.js';
import updateBlockSchedule from './update_block_schedule.js'

// Variables from data parameters in a script tag. These can be made global
// (using "window.") so that they can be used in other scripts.
const dataElement = document.getElementById('string-data');
const startYear = parseInt(dataElement.dataset.startYear);
window.isLoggedIn = dataElement.dataset.isLoggedIn === 'True';
window.courseoccasionInfoUrl = dataElement.dataset.courseoccasionInfoUrl;
window.blockRemoveCourseUrl = dataElement.dataset.blockRemoveCourseUrl;
window.blockCourseListUrl = dataElement.dataset.blockCourseListUrl;

// Data that whose lifetime has to persist due to event listeners.
let coursesData = new BlockScheduleData(startYear);
let shouldStackTerms = isNarrowWindow();

/**
 * Setups the button that adds a year to the block schedule by adding an
 * onclick eventlistener. Clicking on it adds an additional year to the
 * schedule.
 */
function setupAddYearButton() {
  const button = document.getElementById('block-schedule-add-year');
  button.addEventListener('click', () => {
    coursesData.addAcademicYear();
    updateBlockSchedule(coursesData.academicYears, shouldStackTerms);
  });
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
 * Main function for this script.
 */
function main() {
  // Initialize the course data for the first time.
  coursesData.update(shouldStackTerms);

  // Create the block-schedule.
  updateBlockSchedule(coursesData.academicYears, shouldStackTerms); 

  // Setup the button to add more years to the block-schedule.
  setupAddYearButton(); 

  // When the window resizes from narrow to wide or vice versa, update the data
  // and redraw the block-schdule.
  window.addEventListener('resize', () => {
    const didStackTerms = shouldStackTerms;
    shouldStackTerms = isNarrowWindow();
    
    if (shouldStackTerms !== didStackTerms) {
      coursesData.update(shouldStackTerms);
      updateBlockSchedule(coursesData.academicYears, shouldStackTerms);
    }
  })
}

// Run main function when the script is loaded.
main();
