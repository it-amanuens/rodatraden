import CourseOccasion from "./block_schedule/course_occasion.js";
import BlockSchedule from './block_schedule/block_schedule.js';

/**
 * A barebones representation of a block schedule, only including elective courses.
 */
class BarebonesBlockSchedule {
  /**
   * @param {string} title
   * @param {number} startYear - Start year as defined when creating the block.
   * @param {CourseOccasion[]} courseOccasions
   */
  constructor(title, startYear, courseOccasions) {
    this.title = title;
    this.startYear = startYear;
    this.courseOccasions = courseOccasions;
  }

  /** @type {string[]} */
  title;
  /** @type {number[]} */
  startYear;
  /** @type {CourseOccasion[]} */
  courseOccasions;
}

/**
 * Gets all block schedules related to the profile from an external script tag
 * and return them as a single collection.
 * 
 * @returns All block schdeules in no particular order.
 */
function loadSchedulesFromElement() {
  /** @type {BarebonesBlockSchedule[]} */
  let schedules = [];

  const schedulesAsJSON = JSON.parse(
    document.getElementById('blocks-data').textContent
  );

  for (const schedule of schedulesAsJSON) {
    /** @type {string} */
    const title = schedule['title'];
    /** @type {number} */
    const startYear = schedule['startYear'];
    /** @type {CourseOccasion[]} */
    let courseOccasions = [];

    for (const course of schedule['courseOccasions']) {
      courseOccasions.push(CourseOccasion.fromJSON(course));
    }

    schedules.push(new BarebonesBlockSchedule(title, startYear, courseOccasions));
  }

  return schedules;
}

/**
 * Adds a block that represents all the third year courses in the base block.
 * 
 * This block will have a pace of 100% during the first three periods.
 * @param {number} startYear
 * @param {BarebonesBlockSchedule[]} schedules
 */
function addBaseBlockPlaceholder(schedules) {
  const title = 'Baskurser åk 3';
  const slug = '';
  const ects = 45;
  const start = 0;
  const weeks = 30;
  const isPrivate = false;

  for (let schedule of schedules) {
    const academicYear = schedule.startYear + 2;

    schedule.courseOccasions.push(new CourseOccasion(
      title,
      slug,
      ects,
      academicYear,
      start,
      weeks,
      isPrivate
    ));
  }
}

/**
 * Creates containers for the block schedules using a template tag and adds
 * unique Ids to each.
 * 
 * @param {number} scheduleCount - The number of block scshedules to make room for.
 * @returns An array of Ids for each academic year container needed for rendering.
 */
function instantiateScheduleContainers(scheduleCount) {
  const scheduleContainer = document.getElementById('block-schedule-container');

  // The template to be reused.
  /** @type {HTMLTemplateElement} */
  const template = document.getElementById('block-schedule-template');

  /** @type {number[]} */
  let containerIds = [];

  for (let i = 0; i < scheduleCount; ++i) {
    /** @type {DocumentFragment} */
    const templateInstance = template.content.cloneNode(true);
    const yearContainer = templateInstance.getElementById('academic-year-container');

    // Create, apply and append ID.
    const newId = yearContainer.id + `-${i}`;
    yearContainer.id = newId;
    containerIds.push(newId);

    // Hide all but the first schedule.
    if (i !== 0) {
      yearContainer.parentElement.classList.add('visually-hidden')
    }

    scheduleContainer.appendChild(templateInstance);
  }

  return containerIds;
}

function instantiateScheduleTabs(schedules, containerIds) {
  const tabContainer = document.getElementById('tab-container');

  // The template to be reused.
  /** @type {HTMLTemplateElement} */
  const template = document.getElementById('tab-template');

  for (let i = 0; i < containerIds.length; ++i) {
    /** @type {DocumentFragment} */
    const templateInstance = template.content.cloneNode(true);
    const anchor = templateInstance.querySelector('a');

    // Create a unique id for the tab.
    const newId = anchor.id + `-${i}`;
    anchor.id = newId;

    // Link to a container. This is not used though since the default behaviour
    // is overridden.
    anchor.href = `#${containerIds[i]}`;

    // Insert the schedule title.
    anchor.innerText = schedules[i].title;

    // Make the first tab selected initially.
    if (i === 0) {
      anchor.parentElement.classList.add('selected');
    }

    // Override onclick for anchor to show the desired schedule.
    anchor.addEventListener('click', event => {
      // Don't scroll to the href location.
      event.preventDefault();

      const allTabs = document.getElementsByClassName('profile-tab');
      const selectedTab = event.target.parentElement;

      const allSchedules = document.getElementsByClassName('block-schedule');
      const selectedschedule = document.getElementById(containerIds[i]).parentElement;
      
      // Make the clicked tab selected.
      for (let tab of allTabs) {
        tab.classList.remove('selected');
      }
      selectedTab.classList.add('selected');

      // Show the selected schedule.
      for (let schedule of allSchedules) {
        schedule.classList.add('visually-hidden');
      }
      selectedschedule.classList.remove('visually-hidden');
    });

    tabContainer.appendChild(templateInstance);
  }
}

/**
 * Determines if the window is narrow or not.
 * 
 * @returns True if the window is too narrow to fit the terms on the same row.
 */
function isNarrowWindow() {
  // TEMP: Arbitrarily chosen pixel value.
  const windowWidthThreshold = 600;
  return window.innerWidth < windowWidthThreshold;
}

/**
 * Render the barebones versions of block schedules related to the profile.
 * 
 * @param {BarebonesBlockSchedule[]} schedules 
 * @param {string} courseoccasionInfoUrl 
 * @param {number[]} containerIds 
 */
function renderSchedules(schedules, courseoccasionInfoUrl, containerIds) {
  // We want the whole academic year together on a single row.
  const shouldStackTerms = false;

  // The user is set to logged out to make sure the schedule is read-only.
  const isLoggedIn = false;

  // These will be unused since the user is logged out.
  const blockUsername = null;
  const blockSlug = null;
  const blockRemoveCourseUrl = null;
  const blockReplaceCourseUrl = null;
  const blockCourseListUrl = null;
  const blockGetRelatedOccasionsUrl = null;
  const blockToggleCoursePrereqUrl = null;
  const blockToggleCourseCompleteUrl = null;

  // Margin and scale affects the rendered blocks appearance.
  const margin = 0.5;
  const scale = 1.5;

  for (let i = 0; i < schedules.length; ++i) {
    const startYear = schedules[i].startYear;
    const courseOccasions = schedules[i].courseOccasions;
    const containerId = containerIds[i];

    // The block schedule renderer will populate this container.
    const academicYearContainer = document.getElementById(containerId);
  
    // Create a block schedule which renders it automatically in the specified
    // container.
    const schedule = new BlockSchedule(
      startYear,
      courseOccasions,
      academicYearContainer,
      shouldStackTerms,
      isLoggedIn,
      blockUsername,
      blockSlug,
      courseoccasionInfoUrl,
      blockRemoveCourseUrl,
      blockReplaceCourseUrl,
      blockCourseListUrl,
      blockGetRelatedOccasionsUrl,
      blockToggleCoursePrereqUrl,
      blockToggleCourseCompleteUrl,
      margin,
      scale
    );

    // When the window resizes from narrow to wide or vice versa, update the data
    // and redraw the block-schdule.
    schedule.addResizeEventListener(isNarrowWindow);
  }
}

/**
 * Replace the link of the placeholder blocks with a span so that it can't be
 * clicked on. Also adds a class for styling.
 */
function adjustPlaceholderBlocks() {
  const blockSchedules = document.getElementsByClassName('block-schedule--profile');
  
  for (const schedule of blockSchedules) {
    const placeholderBlock = schedule.getElementsByClassName('course')[0];
    placeholderBlock.classList.add('course--base-block');
  
    // Existing link.
    const anchor = placeholderBlock.getElementsByTagName('a')[0];
    const title = anchor.textContent;
    
    // Non-clickable replacement.
    const span = document.createElement('span');
    span.textContent = title;
    
    // Swap the elements.
    anchor.parentNode.replaceChild(span, anchor);
  }
}

/**
 * Adjust term headers so that they don't show speciic years, but instead 1:st,
 * 2:nd, etc.
 */
function adjustTermHeaders() {
  const blockSchedules = document.getElementsByClassName('block-schedule--profile');

  for (const schedule of blockSchedules) {
    const termHeaders = schedule.getElementsByClassName('term-header');

    for (let termIndex = 0; termIndex < termHeaders.length; ++termIndex) {
      const termPrefix = termIndex % 2 ? 'VT' : 'HT';
      // one-based academic year index. The division by two is needed since
      // we iterate over two terms per year.
      const academicYear = Math.floor(termIndex / 2 + 1);
      
      termHeaders[termIndex].textContent = `${termPrefix} åk ${academicYear}`;
    }
  }
}

/**
 * Main function for this script.
 */
function main() {
  // Get variables from data parameters in a script tag.
  const stringDataset = document.getElementById('string-data').dataset;
  const courseoccasionInfoUrl = stringDataset.courseoccasionInfoUrl;
  const blockScheduleViewSetting = stringDataset.blockScheduleViewSetting;

  // Determine if the blocks are based on the base block or not.
  const usesBaseBlock = blockScheduleViewSetting === 'extended';

  // Courses loaded from the content of an external script tag.
  const schedules = loadSchedulesFromElement();

  if (usesBaseBlock) {
    // add placeholder block for courses in the base block.
    addBaseBlockPlaceholder(schedules);
  }

  // Use a template tag to create all containers needed for rendering.
  const containerIds = instantiateScheduleContainers(schedules.length);

  // Create a tab for each schedule.
  instantiateScheduleTabs(schedules, containerIds);

  renderSchedules(schedules, courseoccasionInfoUrl, containerIds);

  if (usesBaseBlock) {
    adjustPlaceholderBlocks();
  }
  adjustTermHeaders();

  // Enable closing the modal by clicking outside the content box or on
  // [data-dismiss="modal"] buttons.
  const modal = document.getElementById('native-modal');
  if (modal) {
    const closeModalWithAnimation = () => {
      if (modal.classList.contains('closing')) {
        return;
      }

      const finish = () => {
        modal.classList.remove('closing');
        if (modal.open) {
          modal.close();
        }
      };

      modal.classList.add('closing');

      if (getComputedStyle(modal).animationName === 'none') {
        finish();
        return;
      }

      modal.addEventListener('animationend', finish, { once: true });
      modal.addEventListener('animationcancel', finish, { once: true });
    };

    modal.addEventListener('click', event => {
      if (event.target === event.currentTarget) {
        closeModalWithAnimation();
        return;
      }

      const dismissButton = event.target.closest('[data-dismiss="modal"]');
      if (dismissButton) {
        event.preventDefault();
        closeModalWithAnimation();
      }
    });
  }
}

// Run main function when the script is loaded.
main();
