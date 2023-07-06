/**
 * Parses the URL to find the sort order. The sort order is expressed as a
 * sorting category and whether or not to sort in ascending order.
 * 
 * @param {string} queryString - String on the format "?k1=v1&k2=v2" etc.
 * @returns Sort order if found, otherwise null.
 */
function getSortOrder(queryString) {
  // Remove the first '?' character and split the string.
  const queries = queryString.slice(1).split('&');

  for (const query of queries) {
    const [parameter, value] = query.split('=');
    
    if (parameter == 'sort_order') {
      const isDecending = value[0] === '-';
      // Remove leading minus sign if present.
      const category = isDecending ? value.slice(1) : value;

      return {
        category: category,
        isAscending: !isDecending
      };
    }
  }

  return null;
}

/**
 * Creates a sorting URL and applies it to the href attributes of a collection
 * of links.
 * 
 * @param {HTMLCollection} links - Links whose href attributes will be updated.
 * @param {string} category - Sorting category, e.g., "title".
 * @param {boolean} isAscending - True if clicking the link should sort in ascending order.
 */
function setSortOrder(links, category, isAscending) {
  const pathname = window.location.pathname;
  const sortOrder = (isAscending ? '' : '-') + category;

  for (let link of links) {
    link.href = pathname + '?sort_order=' + sortOrder;
  }
}

/**
 * Changes the direction of a caret, or adds it if missing, to each link.
 * 
 * @param {HTMLCollection} links - Links whose carets will be changed.
 * @param {boolean} isAscending - True if clicking the link should sort in ascending order.
 */
function setCaret(links, isAscending) {
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

  const sortOrder = getSortOrder(queryString);
  // No need to update the links if the sort order isn't specified.
  if (!sortOrder) return;
  
  // Reset all links to ascending.
  setSortOrder(titleLinks, 'title', true);
  setSortOrder(ectsLinks, 'ects', true);
  setSortOrder(levelLinks, 'level', true);

  // Reset caret icons.
  removeCaret(titleLinks);
  removeCaret(ectsLinks);
  removeCaret(levelLinks);

  const { category, isAscending } = sortOrder;
  
  // Clicking on the header of the currently sorted-by category should reverse
  // the sort order. The caret should highlight the current sort order.
  switch (category) {
    case 'title':
      setSortOrder(titleLinks, 'title', !isAscending);
      setCaret(titleLinks, isAscending);
      break;
    case 'ects':
      setSortOrder(ectsLinks, 'ects', !isAscending);
      setCaret(ectsLinks, isAscending);
      break;
    case 'level':
      setSortOrder(levelLinks, 'level', !isAscending);
      setCaret(levelLinks, isAscending);
      break;
  }
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
