/**
 * Parses out the parameters of the GET-request into a Map structure.
 * 
 * @param {string} queryString - String on the format "?k1=v1&k2=v2" etc.
 * @returns Map of GET-request parameters and their values.
 */
export function parseQueryString(queryString) {
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
export function createQueryString(parameters) {
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
export function getSortOrder(parameters) {
  if (!parameters.has('sort_order')) return null;

  const value = parameters.get('sort_order');

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
export function setSortOrder(parameters, category, isAscending) {
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
export function applySortURL(links, parameters) {
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
export function addCaret(links, isAscending) {
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
export function removeCaret(links) {
  for (let link of links) {
    const icon = link.querySelector('.fa');
    icon.classList.remove('fa-caret-up');
    icon.classList.remove('fa-caret-down');
  }
}
