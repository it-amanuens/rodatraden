import BlockScheduleData from './block_schedule_data.js';
import * as renderer from './block_schedule_renderer.js';
import CourseOccasion from './course_occasion.js';

export default class BlockSchedule {
  /**
   * @param {number} startYear - Start year specified by the user when creating the block-schedule.
   * @param {CourseOccasion[]} courses - List of course occasions.
   * @param {HTMLElement} academicYearContainer - Container for all the academic years. Each year has headers, a set of courses and a footer. 
   * @param {boolean} shouldStackTerms - True if terms should be split and stacked vertically.
   * @param {boolean} isLoggedIn - True if the user is a logged in owner of the schedule.
   * @param {string} courseoccasionInfoUrl - URL for the course occasion info view.
   * @param {string} blockRemoveCourseUrl - URL to remove a course occasion.
   * @param {string} blockCourseListUrl - URL to get a list of courses to add.
   * @param {number} scale - Scale used to calculating size and position.
   * @param {number} margin - Margin used to calculating size and position.
   */
  constructor(startYear,
              courses,
              academicYearContainer,
              shouldStackTerms,
              isLoggedIn,
              courseoccasionInfoUrl,
              blockRemoveCourseUrl,
              blockCourseListUrl,
              margin,
              scale) {
    this.#coursesData = new BlockScheduleData(startYear, courses, shouldStackTerms);

    this.#academicYearContainer = academicYearContainer;
    this.#shouldStackTerms = shouldStackTerms;
    this.#isLoggedIn = isLoggedIn;
    this.#courseoccasionInfoUrl = courseoccasionInfoUrl;
    this.#blockRemoveCourseUrl = blockRemoveCourseUrl;
    this.#blockCourseListUrl = blockCourseListUrl;

    this.#margin = margin;
    this.#scale = scale;

    // Create the block-schedule.
    this.#update();
  }

  /**
    * Setups the button that adds a year to the block schedule by adding an
    * onclick eventlistener. Clicking on it adds an additional year to the
    * schedule.
    * 
    * @param {string} buttonId
    */
  setupAddYearButton(buttonId) {
    const button = document.getElementById(buttonId);

    button.addEventListener('click', () => {
      this.#coursesData.addAcademicYear();
      
      this.#update();
    });
  }

  /**
   * Adds the feature to revaluate on window resize whether or not to stack the
   * terms and redraw the block-schedule.
   * 
   * Uses the given callback function to determine if a change occured.
   * 
   * @param {function(): boolean} shouldStackTermsCallback - Returns true if terms should be split and stacked vertically.
   */
  addResizeEventListener(shouldStackTermsCallback) {
    window.addEventListener('resize', () => {
      const didStackTerms = this.#shouldStackTerms;
      this.#shouldStackTerms = shouldStackTermsCallback();
      
      // Update only if a change occured.
      if (this.#shouldStackTerms !== didStackTerms) {
        this.#coursesData.updateSplit(this.#shouldStackTerms);
        this.#update();
      }
    });
  }

  /**
   * Updates the courses in the block-schedule and redraws it.
   * 
   * @param {CourseOccasion[]} courses - List of course occasions.
   */
  updateCourses(courses) {
    this.#coursesData.updateCourses(courses);
    this.#update();
  }

  /** @type {BlockScheduleData} */
  #coursesData;
  /** @type {HTMLElement} */
  #academicYearContainer;
  /** @type {boolean} */
  #shouldStackTerms;
  /** @type {boolean} */
  #isLoggedIn;
  /** @type {string} */
  #courseoccasionInfoUrl;
  /** @type {string} */
  #blockRemoveCourseUrl;
  /** @type {string} */
  #blockCourseListUrl;

  /** @type {number} */
  #margin = 1;
  /** @type {number} */
  #scale = 3;

  /**
   * Updates block-schedule DOM elements based on the course data. This
   * function should be called every time data is changed, for example when
   * adding/removing an academic year or course. The DOM elements are then
   * updated accordingly.
   */
  #update() {
    const transitionDuration = 500;

    // Start by removing old academic years, adding new and empty ones while
    // binding all with up-to-date data.
    const academicYearSelection = renderer.updateAcademicYear(
      this.#academicYearContainer,
      this.#coursesData.academicYears,
      this.#shouldStackTerms,
      transitionDuration
    );

    // Bind data to all terms and create new and empty terms if needed.
    const termSelection = renderer.updateTerm(
      academicYearSelection,
      this.#shouldStackTerms,
      this.#margin,
      this.#scale
    );

    // Add term and period headers to all new terms.
    renderer.addTermHeader(termSelection);
    renderer.addPeriodHeaders(termSelection);

    // Bind data to all course containers and create new and empty terms if
    // needed.
    const courseContainerSelection = renderer.updateCourseContainer(
      termSelection,
      this.#scale,
      this.#margin
    );

    // Bind data to all courses, update them if needed and create new ones that
    // are missing.
    renderer.updateCourseBlocks(
      courseContainerSelection,
      this.#scale,
      this.#margin,
      this.#isLoggedIn,
      this.#courseoccasionInfoUrl,
      this.#blockRemoveCourseUrl,
      this
    );

    // Add a footer to all new terms.
    renderer.addFooter(termSelection, this.#isLoggedIn, this.#blockCourseListUrl);
    
    // Update the prerequisite warnings for all courses.
    renderer.updatePrerequisiteWarnings();
  }
}
