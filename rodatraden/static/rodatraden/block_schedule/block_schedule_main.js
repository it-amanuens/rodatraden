import BlockScheduleData from './block_schedule_data.js';
import updateBlockSchedule from './update_block_schedule.js'

// Data that whose lifetime has to persist due to event listeners.
let coursesData;
let shouldStackTerms = isNarrowWindow();

/**
 * Setups the button that adds a year to the block schedule by adding an
 * onclick eventlistener. Clicking on it adds an additional year to the
 * schedule.
 * 
 * @param {boolean} isLoggedIn - True if the user is a logged in owner of the schedule.
 * @param {string} courseoccasionInfoUrl - URL for the course occasion info view.
 * @param {string} blockRemoveCourseUrl - URL to remove a course occasion.
 * @param {string} blockCourseListUrl - URL to get a list of courses to add.
 */
function setupAddYearButton(isLoggedIn, courseoccasionInfoUrl,
                            blockRemoveCourseUrl, blockCourseListUrl) {
  const button = document.getElementById('block-schedule-add-year');
  button.addEventListener('click', () => {
    coursesData.addAcademicYear();
    updateBlockSchedule(
      coursesData.academicYears,
      shouldStackTerms,
      isLoggedIn,
      courseoccasionInfoUrl,
      blockRemoveCourseUrl,
      blockCourseListUrl
    );
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
 * Initializes a single block schedule.
 * 
 * @param {number} startYear - Start year defined when the block was created.
 * @param {boolean} isLoggedIn - True if the user is a logged in owner of the schedule.
 * @param {string} courseoccasionInfoUrl - URL for the course occasion info view.
 * @param {string} blockRemoveCourseUrl - URL to remove a course occasion.
 * @param {string} blockCourseListUrl - URL to get a list of courses to add.
 */
export default function initializeBlockSchedule(startYear,
                                                isLoggedIn,
                                                courseoccasionInfoUrl,
                                                blockRemoveCourseUrl,
                                                blockCourseListUrl) {
  coursesData = new BlockScheduleData(startYear);

  // Initialize the course data for the first time.
  coursesData.update(shouldStackTerms);

  // Create the block-schedule.
  updateBlockSchedule(
    coursesData.academicYears,
    shouldStackTerms,
    isLoggedIn,
    courseoccasionInfoUrl,
    blockRemoveCourseUrl,
    blockCourseListUrl
  );

  // Setup the button to add more years to the block-schedule.
  setupAddYearButton(
    isLoggedIn,
    courseoccasionInfoUrl,
    blockRemoveCourseUrl,
    blockCourseListUrl
  );

  // When the window resizes from narrow to wide or vice versa, update the data
  // and redraw the block-schdule.
  window.addEventListener('resize', () => {
    const didStackTerms = shouldStackTerms;
    shouldStackTerms = isNarrowWindow();
    
    if (shouldStackTerms !== didStackTerms) {
      coursesData.update(shouldStackTerms);
      updateBlockSchedule(
        coursesData.academicYears,
        shouldStackTerms,
        isLoggedIn,
        courseoccasionInfoUrl,
        blockRemoveCourseUrl,
        blockCourseListUrl
      );
    }
  })
}
