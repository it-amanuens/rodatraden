import CourseOccasion from "./block_schedule/course_occasion.js";
import BlockSchedule from './block_schedule/block_schedule.js';

/**
 * A barebones representation of a block schedule, only including elective courses.
 */
class BarebonesBlockSchedule {
  /**
   * @param {string} title
   * @param {number} startYear - Start year as defined when creating the block.
   * @param {CourseOccasion[]} electiveCourses - Courses from year 3, period 4 an onward. 
   */
  constructor(title, startYear, electiveCourses) {
    this.title = title;
    this.startYear = startYear;
    this.electiveCourses = electiveCourses;
  }

  /** @type {string[]} */
  title;
  /** @type {number[]} */
  startYear;
  /** @type {CourseOccasion[]} */
  electiveCourses;
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
    let electiveCourses = [];

    for (const course of schedule['electiveCourseOccasions']) {
      const isPrivate = false;
      electiveCourses.push(CourseOccasion.fromJSON(course, isPrivate));
    }

    schedules.push(new BarebonesBlockSchedule(title, startYear, electiveCourses));
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
  const title = 'Baskurser';
  const slug = '';
  const ects = 45;
  const start = 0;
  const weeks = 30;
  const isPrivate = false;

  for (let schedule of schedules) {
    const academicYear = schedule.startYear + 2;

    schedule.electiveCourses.push(new CourseOccasion(
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
function instantiateTemplates(scheduleCount) {
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

    scheduleContainer.appendChild(templateInstance);
  }

  return containerIds;
}

function renderSchedules(schedules, containerIds) {
  // We want the whole academic year together on a single row.
  const shouldStackTerms = false;

  // Get variables from data parameters in a script tag.
  const stringDataset = document.getElementById('string-data').dataset;
  const courseoccasionInfoUrl = stringDataset.courseoccasionInfoUrl;

  // The user is set to logged out to make sure the schedule is read-only.
  const isLoggedIn = false;

  // These will be unused since the user is logged out.
  const blockRemoveCourseUrl = null;
  const blockCourseListUrl = null;

  // Margin and scale affects the rendered blocks appearance.
  const margin = 0.5;
  const scale = 1.5;

  for (let i = 0; i < schedules.length; ++i) {
    const startYear = schedules[i].startYear;
    const courseOccasions = schedules[i].electiveCourses;
    const containerId = containerIds[i];

    // The block schedule renderer will populate this container.
    const academicYearContainer = document.getElementById(containerId);
  
    // Create a block schedule which renders it automatically in the specified
    // container.
    new BlockSchedule(
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
      
      termHeaders[termIndex].textContent = `${termPrefix} år ${academicYear}`;
    }
  }
}

/**
 * Main function for this script.
 */
function main() {
  
  // Courses loaded from the content of an external script tag.
  const schedules = loadSchedulesFromElement();

  // add placeholder block for courses in the base block.
  addBaseBlockPlaceholder(schedules);

  // Use a template tag to create all containers needed for rendering.
  const containerIds = instantiateTemplates(schedules.length);

  renderSchedules(schedules, containerIds);
  adjustPlaceholderBlocks();
  adjustTermHeaders();
}

// Run main function when the script is loaded.
main();
