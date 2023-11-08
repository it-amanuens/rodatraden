/**
 * Adjust the CSS grid for each row of prerequisites by changing a CSS custom
 * property.
 */
function adjustPrerequisiteGrid() {
  const prerequisiteFormGroups = document.getElementsByClassName(
    'form-prerequisite'
  );

  for (const formGroup of prerequisiteFormGroups) {
    const courseCount = formGroup.getElementsByTagName('select').length;
    formGroup.style.setProperty('--course-count', courseCount);
  }
}

/**
 * Add separator word between alternative courses. Make sure not to add before
 * first element.
 */
function addSeperatorWithinPrerequisites() {
  // Select all but the first so that the insertion happens between fields.
  const prerequisiteSelects = document.querySelectorAll(
    '.form-prerequisite__select:not(:first-child)'
  );

  for (const select of prerequisiteSelects) {
    // Create separator from template tag.
    const template = document.getElementById('prerequisite-or-template');
    const separator = template.content.cloneNode(true);

    select.parentNode.insertBefore(separator, select);
  }
}

function addSeperatorBetweenPrerequisites() {
  const prerequisiteGroups = document.querySelectorAll(
    '.form-prerequisite:not(:first-child)'
  );

  for (const prerequisiteGroup of prerequisiteGroups) {
    // Create separator from template tag.
    const template = document.getElementById('prerequisite-and-template');
    const separator = template.content.cloneNode(true);

    prerequisiteGroup.parentNode.insertBefore(separator, prerequisiteGroup);
  }
}

/**
 * Determines if it is suitable to add an equivalent course. This is the case if
 * the last equivalent course has been selected. Otherwise, the user should
 * select a course before adding a new one.
 * 
 * @param {HTMLElement} prerequisite The prerequisite of interest.
 * @returns True if a new equivalent course should be added.
 */
function shouldAddEquivelentCourse(prerequisite) {
  const lastSelect = prerequisite.querySelector('select:last-of-type');
  const value = lastSelect.value;
  return value !== '';
}

/**
 * Determines if it it suitable to add a new prerequisite. This is the case if
 * the last prerequisite has at least one course selected. Otherwise, the user
 * should complete the last prerequisite before adding a new one.
 * 
 * @returns True if a new prerequisite should be added.
 */
function shouldAddPrerequisite() {
  const lastPrerequisite = document.querySelector(
    '.form-prerequisite:last-of-type'
  )

  // If there are no prerequisites, it is suitable to add a new one.
  if (!lastPrerequisite) return true;

  // Get the value of the first select, since it is guaranteed to exist.
  const select = lastPrerequisite.querySelector('select');
  const value = select.value;
  
  // If the value is empty, the prerequisite is incomplete. The last
  // prerequisite should be completed before a new one is added.
  return value !== '';
}

function addEquivalentCourse() {
  // Since the button is a child of the prerequisite, the parent is the
  // prerequisite.
  const prerequisite = this.parentNode;

  if (!shouldAddEquivelentCourse(prerequisite)) return;

  // Get the current number of equivalent courses as well as the first course.
  const courses = prerequisite.querySelectorAll('select');
  const courseCount = courses.length;
  const firstCourse = courses[0];

  // Duplicate the first select and clear the value.
  const newCourse = firstCourse.cloneNode(true);
  newCourse.value = '';

  // The name is on the form 'prerequisite_{prerequisite index}_{course index}'.
  // Therefore we replace the course index with the new course count to make it
  // unique.
  const firstCourseName = newCourse.getAttribute('name');
  nameComponents = firstCourseName.split('_');
  nameComponents[2] = courseCount;
  const newCourseName = nameComponents.join('_');
  
  // Change the name and id of the new select to be unique.
  newCourse.setAttribute('name', newCourseName);
  newCourse.setAttribute('id', `id_${newCourseName}`);

  // Add a separator and the new course before the buttons.
  const template = document.getElementById('prerequisite-or-template');
  const separator = template.content.cloneNode(true);
  const firstButton = prerequisite.querySelector('button');
  prerequisite.insertBefore(separator, firstButton);
  prerequisite.insertBefore(newCourse, firstButton);

  // Adjust the CSS grid.
  prerequisite.style.setProperty('--course-count', courseCount + 1);
}

/**
 * Add a new prerequisite row.
 */
function addPrerequisite() {
  if (!shouldAddPrerequisite()) return;

  const prerequisiteContainer = document.getElementById('prerequisites');

  // Get the current number of prerequisites.
  const prerequisites = document.querySelectorAll('.form-prerequisite')
  const prerequisiteCount = prerequisites.length;

  // Add a separator if there already exists prerequisites.
  if (prerequisiteCount > 0) {
    const separatorTemplate = document.getElementById('prerequisite-and-template');
    const separator = separatorTemplate.content.cloneNode(true);
    prerequisiteContainer.appendChild(separator);
  }

  // Create a new prerequisite from the template tag.
  const prerequisiteTemplate = document.getElementById('prerequisite-template');
  const newPrerequisite = prerequisiteTemplate.content.cloneNode(true);
  const newSelect = newPrerequisite.querySelector('select');

  // Change the name and id of the new select to be unique and make it required.
  const defaultName = newSelect.getAttribute('name');
  const newName = defaultName.replace('0', prerequisiteCount);
  newSelect.setAttribute('name', newName);
  newSelect.setAttribute('id', `id_${newName}`);
  newSelect.required = true;

  // Add eventlisteners to the add and remove buttons.
  const addButton = newPrerequisite.querySelector('.add-equivalent-course');
  const removeButton = newPrerequisite.querySelector('.remove-prerequisite');
  addButton.addEventListener('click', addEquivalentCourse);
  removeButton.addEventListener('click', removePrerequisite);

  // Add jQuery tooltip.
  $(addButton).tooltip();
  $(removeButton).tooltip();

  // Add the new prerequisite.
  prerequisiteContainer.appendChild(newPrerequisite);
}

function removeLeftoverSeparators() {
  const separatorClassName = 'form-prerequisite__and-separator';

  // Remove separators at the beginning and end of the list.
  const prerequisiteContainer = document.getElementById('prerequisites');
  const firstSeparator = prerequisiteContainer.querySelector(
    `.${separatorClassName}:first-child`
  );
  const lastSeparator = prerequisiteContainer.querySelector(
    `.${separatorClassName}:last-child`
  );
  console.log('firstSeparator', firstSeparator)
  console.log('lastSeparator', lastSeparator)
  if (firstSeparator) firstSeparator.remove();
  if (lastSeparator) lastSeparator.remove();

  // Remove adjacent separators.
  const separators = prerequisiteContainer.querySelectorAll(
    `.${separatorClassName} + .${separatorClassName}`
  );
  console.log('separators', separators)
  for (const separator of separators) {
    separator.remove();
  }
}

function removePrerequisite() {
  // Since the button is a child of the prerequisite, the parent is the
  // prerequisite.
  const prerequisite = this.parentNode;

  // Remove the prerequisite and any leftover invalid separator.
  prerequisite.remove();
  removeLeftoverSeparators();
}

function main() {
  adjustPrerequisiteGrid();
  addSeperatorWithinPrerequisites();
  addSeperatorBetweenPrerequisites();

  const addEquivalentCourseButtons = document.querySelectorAll(
    '.add-equivalent-course'
  );
  for (const button of addEquivalentCourseButtons) {
    button.addEventListener('click', addEquivalentCourse);
  }

  const removePrerequisiteButtons = document.querySelectorAll(
    '.remove-prerequisite'
  );
  for (const button of removePrerequisiteButtons) {
    button.addEventListener('click', removePrerequisite);
  }

  const addPrerequisiteButton = document.getElementById('add-prerequisite');
  addPrerequisiteButton.addEventListener('click', addPrerequisite);
}

main();