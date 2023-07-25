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
 * @param {HTMLElement} academicYearContainer - Container for all the academic years. Each year has headers, a set of courses and a footer.
 * @param {boolean} isLoggedIn - True if the user is a logged in owner of the schedule.
 * @param {string} courseoccasionInfoUrl - URL for the course occasion info view.
 * @param {string} blockRemoveCourseUrl - URL to remove a course occasion.
 * @param {string} blockCourseListUrl - URL to get a list of courses to add.
 */
function setupAddYearButton(academicYearContainer, isLoggedIn,
                            courseoccasionInfoUrl, blockRemoveCourseUrl,
                            blockCourseListUrl) {
  const button = document.getElementById('block-schedule-add-year');
  button.addEventListener('click', () => {
    coursesData.addAcademicYear();
    updateBlockSchedule(
      academicYearContainer,
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
 * @param {HTMLElement} academicYearContainer - Container for all the academic years. Each year has headers, a set of courses and a footer.
 * @param {any[]} courses - List of courses formatted as JSON.
 * @param {number} startYear - Start year defined when the block was created.
 * @param {boolean} isLoggedIn - True if the user is a logged in owner of the schedule.
 * @param {string} courseoccasionInfoUrl - URL for the course occasion info view.
 * @param {string} blockRemoveCourseUrl - URL to remove a course occasion.
 * @param {string} blockCourseListUrl - URL to get a list of courses to add.
 */
export default function initializeBlockSchedule(academicYearContainer,
                                                courses,
                                                startYear,
                                                isLoggedIn,
                                                courseoccasionInfoUrl,
                                                blockRemoveCourseUrl,
                                                blockCourseListUrl) {
  coursesData = new BlockScheduleData(startYear, courses);

  // Initialize the course data for the first time.
  coursesData.update(shouldStackTerms);

  // Create the block-schedule.
  updateBlockSchedule(
    academicYearContainer,
    coursesData.academicYears,
    shouldStackTerms,
    isLoggedIn,
    courseoccasionInfoUrl,
    blockRemoveCourseUrl,
    blockCourseListUrl
  );

  // Setup the button to add more years to the block-schedule.
  setupAddYearButton(
    academicYearContainer,
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
        academicYearContainer,
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
