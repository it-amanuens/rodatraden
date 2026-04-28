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
   * @param {string} blockReplaceCourseUrl - URL to replace a course occasion.blockGetRelatedOccasionsUrl
   * @param {string} blockCourseListUrl - URL to get a list of courses to add.
   * @param {string} blockGetRelatedOccasionsUrl - URL to get a list of other course occasions related to the same course.
   * @param {string} blockToggleCoursePrereqUrl - URL to toggle per-course prerequisite checking.
   * @param {string} blockToggleCourseCompleteUrl - URL to toggle per-course completed (avklarad) state.
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
              blockReplaceCourseUrl,
              blockCourseListUrl,
              blockGetRelatedOccasionsUrl,
              blockToggleCoursePrereqUrl,
              blockToggleCourseCompleteUrl,
              margin,
              scale) {
    this.#coursesData = new BlockScheduleData(startYear, courses, shouldStackTerms);

    this.#academicYearContainer = academicYearContainer;
    this.#shouldStackTerms = shouldStackTerms;
    this.#isLoggedIn = isLoggedIn;
    this.#courseoccasionInfoUrl = courseoccasionInfoUrl;
    this.#blockRemoveCourseUrl = blockRemoveCourseUrl;
    this.#blockReplaceCourseUrl = blockReplaceCourseUrl;
    this.#blockCourseListUrl = blockCourseListUrl;
    this.#blockGetRelatedOccasionsUrl = blockGetRelatedOccasionsUrl;
    this.#blockToggleCoursePrereqUrl = blockToggleCoursePrereqUrl;
    this.#blockToggleCourseCompleteUrl = blockToggleCourseCompleteUrl;

    this.#margin = margin;
    this.#scale = scale;

    this.#render();
    this.#setupDragAndDrop();
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
      
      this.#render();
    });
  }

  /**
   * Enables the summer term for the given academic year and redraws.
   * 
   * @param {number} year - Academic year.
   */
  addSummer(year) {
    this.#coursesData.addSummer(year);
    this.#render();
  }

  /**
   * Disables the summer term for the given academic year and redraws.
   * 
   * @param {number} year - Academic year.
   */
  removeSummer(year) {
    this.#coursesData.removeSummer(year);
    this.#render();
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
        this.#render();
      }
    });
  }

  /**
   * Overwrites the courses in the block-schedule and redraws it.
   * 
   * @param {CourseOccasion[]} courses - List of course occasions.
   */
  updateCourses(courses) {
    this.#coursesData.updateCourses(courses);
    this.#render();
    
    // Call the callback if one has been set.
    if (this.#onCoursesChangedCallback) {
      this.#onCoursesChangedCallback();
    }
  }

  /**
   * Sets a callback to be called whenever courses are changed (added, removed,
   * or replaced). This can be used to update other parts of the page that
   * depend on the course data, such as the category sum chart.
   * 
   * @param {Function} callback - Function to call when courses change.
   */
  setOnCoursesChangedCallback(callback) {
    this.#onCoursesChangedCallback = callback;
  }

  /**
   * Downloads and update the courses in block-schedule and redraws it.
   * 
   * @param {string} downloadUrl - URL to download courses from.
   */
  downloadCourses(downloadUrl) {
    fetch(downloadUrl, {
      method: 'GET'
    })
    .then(response => response.json())
    .then(courseOccasionsJSON => {
      const courseOccasions = courseOccasionsJSON.map(occasion => {
        return CourseOccasion.fromJSON(occasion);
      });

      this.updateCourses(courseOccasions);
      
    })
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
  #blockReplaceCourseUrl;
  /** @type {string} */
  #blockCourseListUrl;
  /** @type {string} */
  #blockGetRelatedOccasionsUrl;
  /** @type {string} */
  #blockToggleCoursePrereqUrl;
  /** @type {string} */
  #blockToggleCourseCompleteUrl;
  /** @type {Function|null} */
  #onCoursesChangedCallback = null;

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
  #render() {
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
      this.#blockToggleCoursePrereqUrl,
      this.#blockToggleCourseCompleteUrl,
      this
    );

    // Add a footer to all new terms.
    renderer.addFooter(
      termSelection,
      this.#isLoggedIn,
      this.#blockCourseListUrl,
      this
    );

    // Add summer toggle buttons after each academic year.
    renderer.addSummerToggle(
      academicYearSelection,
      this.#isLoggedIn,
      this
    );
    
    // Update the prerequisite warnings for all courses.
    renderer.updatePrerequisiteWarnings();
  }

  /**
   * Adds courses to the block-schedule and redraws it.
   * 
   * @param {CourseOccasion[]} courses - List of course occasions.
   */
  #addCourses(courses) {
    this.#coursesData.addCourses(courses);
    this.#render();
  }

  /**
   * Removes courses from the block-schedule and redraws it.
   * 
   * @param {string[]} courseSlugs - List of slugs for course occasions.
   */
  #removeCourses(courseSlugs) {
    this.#coursesData.removeCourses(courseSlugs);
    this.#render();
  }

  /**
   * Setups drag-and-drop for the block-schedule by creating the necessary
   * event listeners.
   */
  #setupDragAndDrop() {
    // 
    this.#academicYearContainer.addEventListener('dragstart', event => {
      // Get slug from data attribute.
      const course_occasion_slug = event.target.dataset.slug;

      // Ignore elements without a slug since these are not course blocks.
      if (!course_occasion_slug) {
        return;
      }

      // Make sure the drop target knows what was being dragged.
      event.dataTransfer.setData('text/plain', course_occasion_slug);
      event.dataTransfer.effectAllowed = 'move';
      
      // Spawn targets for drag-and-drop.
      const url = this.#blockGetRelatedOccasionsUrl
      + "?slug=" + course_occasion_slug;
      fetch(url, {
        method: 'GET'
      })
      .then(response => response.json())
      .then(courseOccasionsJSON => {
        const [firstYear, lastYear] = this.#coursesData.getYearSpan();
        
        /** @type {CourseOccasion[]} */
        const courseOccasions = courseOccasionsJSON
        .map(occasion => {
          return CourseOccasion.fromJSON(occasion);
        })
        // Filter out course occasions that do not fit in the block schedule.
        .filter(occasion => {
          return occasion.academicYear >= firstYear
                 && occasion.academicYear <= lastYear;
        });
        
        const ghosts = courseOccasions.map(occasion => occasion.createGhost());
        this.#addCourses(ghosts);
      })
      .catch(error => console.error(error));
    });

    // Show the correct drag effect.
    this.#academicYearContainer.addEventListener('dragenter', event => {
      if (event.target.dataset.ghost ==='true') {
        event.dataTransfer.dropEffect = 'move';
      }
    });

    // Prevent the default dragover event to allow for drop.
    this.#academicYearContainer.addEventListener('dragover', event => {
      if (event.target.dataset.ghost ==='true') {
        event.preventDefault();
      }
    });

    // Replace the temporary ghost with the dropped course occasion.
    this.#academicYearContainer.addEventListener('drop', event => {
      if (event.target.dataset.ghost ==='true') {
        event.preventDefault();

        // XXX: This might be a race condition. Prevent the ghost that will
        // become a regular course from being removed by the dragend event
        // before the new course occasion has been fully rendered. This prevents
        // the block blinking out of existence and reappearing slightly after.
        event.target.dataset.ghost = 'false';

        const slugToAdd = event.target.dataset.slug;
        const slugToRemove = event.dataTransfer.getData('text/plain');

        // Replace the course occasions not only visually.
        const url = this.#blockReplaceCourseUrl
        + "?slugToRemove=" + slugToRemove + "&slugToAdd=" + slugToAdd;
        fetch(url, {
          method: 'GET'
        })
        .then(response => response.json())
        .then(courseOccasionsJSON => {
          const courseOccasions = courseOccasionsJSON.map(occasion => {
            return CourseOccasion.fromJSON(occasion);
          });

          this.updateCourses(courseOccasions);
        })
        .catch(error => console.error(error));
      }
    });

    // Remove drop targets when the drag is completed.
    this.#academicYearContainer.addEventListener('dragend', event => {
      const ghosts = event.currentTarget.querySelectorAll(
        '[data-ghost="true"]'
      );
      
      // Remove the ghosts.
      const slugsToRemove = Array.from(ghosts).map(ghost => ghost.dataset.slug);
      
      // Remove the course occasion visually if it was successfully moved.
      if (event.dataTransfer.dropEffect === 'move') {
        const thisSlug = event.target.dataset.slug;
        slugsToRemove.push(thisSlug);
      }

      this.#removeCourses(slugsToRemove);
    });
  }
}
