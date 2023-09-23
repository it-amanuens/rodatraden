import {
  parseQueryString, getSortOrder, setSortOrder, applySortURL, addCaret,
  removeCaret
} from './rt_table.js';

/**
 * Updates the header links used to sort the courses. Clicking on a link should
 * either switch sorting category or reverse the order of the currently
 * sorted-by category.
 */
function updateSortingLinks() {
  const titleLinks = document.getElementsByClassName('title-link');
  const ectsLinks = document.getElementsByClassName('ects-link');
  const yearLinks = document.getElementsByClassName('year-link');
  const startLinks = document.getElementsByClassName('start-link');
  const weeksLinks = document.getElementsByClassName('weeks-link');

  const queryString = window.location.search;

  // No need to update the links if there are no GET-parameters.
  if (!queryString) return;

  const parameters = parseQueryString(queryString);
  // Create a set of parameters for each sorting category.
  let titleParameters = structuredClone(parameters);
  let ectsParameters = structuredClone(parameters);
  let yearParameters = structuredClone(parameters);
  let startParameters = structuredClone(parameters);
  let weeksParameters = structuredClone(parameters);
  
  // Set all sorting to ascending order as a start. Then only the incorrect one
  // need to be changed.
  setSortOrder(titleParameters, 'title', true);
  setSortOrder(ectsParameters, 'ects', true);
  setSortOrder(yearParameters, 'year', true);
  setSortOrder(startParameters, 'start', true);
  setSortOrder(weeksParameters, 'weeks', true);

  // Remove caret icons. The correct one will be added later.
  removeCaret(titleLinks);
  removeCaret(ectsLinks);
  removeCaret(yearLinks);
  removeCaret(startLinks);
  removeCaret(weeksLinks);

  const currentSortOrder = getSortOrder(parameters);

  if (currentSortOrder) {
    const { category, isAscending } = currentSortOrder;
    
    // Clicking on the header of the currently sorted-by category should reverse
    // the sort order. The caret should highlight the current sort order.
    switch (category) {
      case 'title':
        setSortOrder(titleParameters, 'title', !isAscending);
        addCaret(titleLinks, isAscending);
        break;
      case 'ects':
        setSortOrder(ectsParameters, 'ects', !isAscending);
        addCaret(ectsLinks, isAscending);
        break;
      case 'year':
        setSortOrder(yearParameters, 'year', !isAscending);
        addCaret(yearLinks, isAscending);
      break;
      case 'start':
        setSortOrder(startParameters, 'start', !isAscending);
        addCaret(startLinks, isAscending);
      break;
      case 'weeks':
        setSortOrder(weeksParameters, 'weeks', !isAscending);
        addCaret(weeksLinks, isAscending);
        break;
    }
  } else {
    // The courses are sorted by title in ascending order if no sort order is
    // specified.
    setSortOrder(titleParameters, 'title', false);
    addCaret(titleLinks, false);
  }
  
  // Update all href attributes with the new URLs.
  applySortURL(titleLinks, titleParameters);
  applySortURL(ectsLinks, ectsParameters);
  applySortURL(yearLinks, yearParameters);
  applySortURL(startLinks, startParameters);
  applySortURL(weeksLinks, weeksParameters);
}

/**
 * Main function for this script.
 */
function main() {
  updateSortingLinks();
}

// Run main function when the script is loaded.
main();
