import CourseOccasion from "./block_schedule/course_occasion.js";
import BlockSchedule from './block_schedule/block_schedule.js';

/**
 * A barebones representation of a block, only including elective courses.
 */
class ProfileBlock {
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
 * Gets all blocks related to the profile from an external script tag and
 * return them as a single collection.
 * 
 * @returns All blocks in no particular order.
 */
function loadBlocksFromElement() {
  /** @type {ProfileBlock[]} */
  let blocks = [];

  const blocksAsJSON = JSON.parse(
    document.getElementById('blocks-data').textContent
  );

  for (const block of blocksAsJSON) {
    /** @type {string} */
    const title = block['title'];
    /** @type {number} */
    const startYear = block['startYear'];
    /** @type {CourseOccasion[]} */
    let electiveCourses = [];

    for (const course of block['electiveCourseOccasions']) {
      const isPrivate = false;
      electiveCourses.push(CourseOccasion.fromJSON(course, isPrivate));
    }

    blocks.push(new ProfileBlock(title, startYear, electiveCourses));
  }

  return blocks;
}

/**
 * Adds a block that represents all the third year courses in the base block.
 * 
 * This block will have a pace of 100% during the first three periods.
 * @param {number} startYear
 * @param {ProfileBlock[]} blocks
 */
function addBaseBlockPlaceholder(blocks) {
  const title = 'Baskurser';
  const slug = '';
  const ects = 45;
  const start = 0;
  const weeks = 30;
  const isPrivate = false;

  for (let block of blocks) {
    const academicYear = block.startYear + 2;

    block.electiveCourses.push(new CourseOccasion(
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

    for (let i = 0; i < termHeaders.length; ++i) {
      const termPrefix = i % 2 ? 'VT' : 'HT';
      // one-based academic year index. The division by two is needed since
      // we iterate over two terms per year.
      const academicYear = Math.floor(i / 2 + 1);
      
      termHeaders[i].textContent = `${termPrefix} år ${academicYear}`;
    }
  }
}

/**
 * Main function for this script.
 */
function main() {
  
  // Courses loaded from the content of an external script tag.
  const blocks = loadBlocksFromElement();

  // add placeholder block for courses in the base block.
  addBaseBlockPlaceholder(blocks);

  // TEMP ---------------------------------------------------------------------------------------------
  const courseOccasions = blocks[0].electiveCourses;
  const startYear = blocks[0].startYear;

  // The block schedule renderer will populate this container with elements.
  const academicYearContainer = document.getElementById('academic-year-container');

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

  // Create a block schedule which renders it automatically in the specified
  // container.
  const blockSchedule = new BlockSchedule(
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

  adjustPlaceholderBlocks();
  adjustTermHeaders();
}

// Run main function when the script is loaded.
main();
