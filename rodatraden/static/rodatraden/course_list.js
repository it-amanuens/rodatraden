/**
 * Parses out the parameters of the GET-request into a Map structure.
 * 
 * @param {string} queryString - String on the format "?k1=v1&k2=v2" etc.
 * @returns Map of GET-request parameters and their values.
 */
function parseQueryString(queryString) {
  // Remove the first '?' character and split the string.
  const parameterStrings = queryString.slice(1).split('&');

  /** @type {Map<string, string>} */
  let parameters = new Map();

  for (const parameterString of parameterStrings) {
    const [key, value] = parameterString.split('=');
    parameters.set(key, value);
  }

  return parameters;
}

/**
 * Creates a query string used in a GET request from a Map of parameters and
 * their values.
 * 
 * @param {Map<string, string>} parameters - GET request parameters.
 * @returns String on the format "?k1=v1&k2=v2" etc.
 */
function createQueryString(parameters) {
  // Leave the string empty if there are no parameters.
  if (parameters.size === 0) return '';

  // Create a list of key-value pair strings on the form 'key=value'.
  let parameterStrings = [];
  for (const [key, value] of parameters) {
    parameterStrings.push(key + '=' + value);
  }

  // Create a full query string from the key-value pairs.
  const queryString = '?' + parameterStrings.join('&');

  return queryString;
}

/**
 * Parses the URL to find the sort order. The sort order is expressed as a
 * sorting category and whether or not to sort in ascending order.
 * 
 * @param {Map<string, string>} parameters - GET request parameters.
 * @returns Sort order if found, otherwise null.
 */
function getSortOrder(parameters) {
  if (!parameters.has('sort_order')) return null;

  value = parameters.get('sort_order');

  // A leading minus sign signifies descending order.
  const isDecending = value[0] === '-';
  // Keep only the category name without any prefix.
  const category = isDecending ? value.slice(1) : value;

  return {
    category: category,
    isAscending: !isDecending
  };
}

/**
 * Sets the sort order parameter.
 * 
 * @param {Map<string, string>} parameters - GET request parameters.
 * @param {string} category - Sorting category, e.g., "title".
 * @param {boolean} isAscending - True if clicking the link should sort in ascending order.
 */
function setSortOrder(parameters, category, isAscending) {
  const sortOrder = (isAscending ? '' : '-') + category;
  parameters.set('sort_order', sortOrder);
}

/**
 * Creates a sorting URL and applies it to the href attributes of a collection
 * of links.
 * 
 * @param {HTMLCollection} links - Links whose href attributes will be updated.
 * @param {Map<string, string>} parameters - GET request parameters.
 */
function applySortURL(links, parameters) {
  // Create the URL for the sort links.
  const pathname = window.location.pathname;
  const queryString = createQueryString(parameters);
  const url = pathname + queryString;

  for (let link of links) {
    link.href = url;
  }
}

/**
 * Changes the direction of a caret, or adds it if missing, to each link.
 * 
 * @param {HTMLCollection} links - Links whose carets will be changed.
 * @param {boolean} isAscending - True if clicking the link should sort in ascending order.
 */
function addCaret(links, isAscending) {
  for (let link of links) {
    const icon = link.querySelector('.fa');

    if (isAscending) {
      icon.classList.add('fa-caret-up');
      icon.classList.remove('fa-caret-down');
    } else {
      icon.classList.remove('fa-caret-up');
      icon.classList.add('fa-caret-down');
    }
  }
}

/**
 * Removes any existing caret from the links.
 * @param {HTMLCollection} links - Links whose carets will be changed.
 */
function removeCaret(links) {
  for (let link of links) {
    const icon = link.querySelector('.fa');
    icon.classList.remove('fa-caret-up');
    icon.classList.remove('fa-caret-down');
  }
}

/**
 * Updates the header links used to sort the courses. Clicking on a link should
 * either switch sorting category or reverse the order of the currently
 * sorted-by category.
 */
function updateSortingLinks() {
  const titleLinks = document.getElementsByClassName('title-link');
  const ectsLinks = document.getElementsByClassName('ects-link');
  const levelLinks = document.getElementsByClassName('level-link');
  const queryString = window.location.search;

  // No need to update the links if there are no GET-parameters.
  if (!queryString) return;

  const parameters = parseQueryString(queryString);
  // Make sure that the user lands on the first page after sorting the courses.
  parameters.delete('page');
  // Create a set of parameters for each sorting category.
  let titleParameters = structuredClone(parameters);
  let ectsParameters = structuredClone(parameters);
  let levelParameters = structuredClone(parameters);
  
  // Set all sorting to ascending order as a start. Then only the incorrect one
  // need to be changed.
  setSortOrder(titleParameters, 'title', true);
  setSortOrder(ectsParameters, 'ects', true);
  setSortOrder(levelParameters, 'level', true);

  // Remove caret icons. The correct one will be added later.
  removeCaret(titleLinks);
  removeCaret(ectsLinks);
  removeCaret(levelLinks);

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
      case 'level':
        setSortOrder(levelParameters, 'level', !isAscending);
        addCaret(levelLinks, isAscending);
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
  applySortURL(levelLinks, levelParameters);
}

/**
 * Adds a class to list items that are next to an ellipsis while also being two
 * elements away from the active page number. The class hides elements on
 * narrow screens, reducing overflow.
 * 
 * E.g., If the pagination holds 1, …, 3, 4, 5, 6, 7, … and 13, then the class
 * is applied to 3 and 7.
 */
function makePaginationResponsive() {
  // Middle starting point.
  const activeListItem = document.querySelector('.page-item.active');

  // Search left.
  const leftCandidate = activeListItem?.previousElementSibling?.previousElementSibling;
  {
    const potentialEllipsis = leftCandidate?.previousElementSibling;
    const isEllipsis = potentialEllipsis?.firstElementChild?.innerText === '…';
    if (isEllipsis) {
      leftCandidate.classList.add('page-hidden-narrow');
    }
  }

  // Search right.
  const rightCandidate = activeListItem?.nextElementSibling?.nextElementSibling;
  {
    const potentialEllipsis = rightCandidate?.nextElementSibling;
    const isEllipsis = potentialEllipsis?.firstElementChild?.innerText === '…';
    if (isEllipsis) {
      rightCandidate.classList.add('page-hidden-narrow');
    }
  }
}

/**
 * Main function for this script.
 */
function main() {
  updateSortingLinks();
  makePaginationResponsive();
}

// Run main function when the script is loaded.
main();
