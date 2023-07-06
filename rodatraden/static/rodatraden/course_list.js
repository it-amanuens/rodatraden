const titleLinks = document.getElementsByClassName('title-link');
const ectsLinks = document.getElementsByClassName('ects-link');
const levelLinks = document.getElementsByClassName('level-link');

const pathname = window.location.pathname;
const queryString = window.location.search;

/**
 * Parses the URL to find the sort order. The sort order is expressed as a
 * sorting category and whether or not to sort in ascending order.
 * @returns Sort order if found, otherwise null.
 */
function getSortOrder() {
  // Remove the first '?' character and split the string.
  const queries = queryString.slice(1).split('&');

  for (const query of queries) {
    const [parameter, value] = query.split('=');
    
    if (parameter == 'sort_order') {
      const isDecending = parameter[0] === '-';
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
 * 
 * @param {HTMLCollection} links 
 * @param {string} category 
 * @param {boolean} isAscending 
 */
function setSortOrder(links, category, isAscending) {
  const sortOrder = (isAscending ? '' : '-') + category;
  for (let link of links) {
    link.href = pathname + '?sort_order=' + sortOrder;
  }
}

/**
 * Updates the header links used to sort the courses. Clicking on a link should
 * either switch sorting category or reverse the order of the currently
 * sorted-by category.
 */
function updateLinks() {
  // No need to update the links if there are no GET-parameters.
  if (!queryString) return;

  const sortOrder = getSortOrder();
  // No need to update the links if the sort order isn't specified.
  if (!sortOrder) return;
  
  // Reset all links to ascending.
  setSortOrder(titleLinks, 'title', true);
  setSortOrder(ectsLinks, 'ects', true);
  setSortOrder(levelLinks, 'level', true);

  const { category, isAscending } = sortOrder;
  
  // Clicking on the header of the currently sorted-by category should reverse
  // the sort order.
  switch (category) {
    case 'title':
      setSortOrder(titleLinks, 'title', !isAscending);
      break;
    case 'ects':
      setSortOrder(ectsLinks, 'ects', !isAscending);
      break;
    case 'level':
      setSortOrder(levelLinks, 'level', !isAscending);
      break;
  }
}

/**
 * Main function for this script.
 */
function main() {
  updateLinks();
}

// Run main function when the script is loaded.
main();