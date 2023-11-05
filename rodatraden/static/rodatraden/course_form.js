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
 * Determines if it it suitable to add a new prerequisite. This is the case if
 * the last prerequisite has been filled in. Otherwise, the user should complete
 * the last prerequisite before adding a new one.
 * 
 * @returns True if a new prerequisite should be added.
 */
function shouldAddPrerequisite() {
  // Get the last prerequisite.
  const lastPrerequisite = document.querySelector('.form-prerequisite:last-of-type')

  // Get the value of the first select.
  const select = lastPrerequisite.querySelector('select');
  const value = select.value;
  
  // If the value is empty, the prerequisite is incomplete. The last
  // prerequisite should be completed before a new one is added.
  const isIncomplete = value === '';
  return !isIncomplete;
}

/**
 * Add a new prerequisite row.
 */
function addPrerequisite() {
  if (!shouldAddPrerequisite()) return;

  // Get the current number of prerequisites as well as the first row.
  const prerequisites = document.querySelectorAll('.form-prerequisite')
  const prerequisiteCount = prerequisites.length;
  const firstPrerequisite = prerequisites[0];
  
  // Create a new prerequisite row as an empty div with the same classes.
  const newPrerequisite = document.createElement('div');
  newPrerequisite.className = firstPrerequisite.className;

  // Find the first select element and duplicate it.
  const firstSelect = firstPrerequisite.querySelector('select');
  const newSelect = firstSelect.cloneNode(true);
  // Clear the value of the new select.
  newSelect.value = '';

  // Change the name and id of the new select to be unique.
  const newSelectName = newSelect.getAttribute('name');
  const newSelectId = newSelect.getAttribute('id');
  newSelect.setAttribute('name', newSelectName.replace('0', prerequisiteCount));
  newSelect.setAttribute('id', newSelectId.replace('0', prerequisiteCount));

  // Add the new select to the new prerequisite row.
  newPrerequisite.appendChild(newSelect);

  // Clone the add and remove buttons from the first prerequisite and append them.
  const firstAddButton = firstPrerequisite.querySelector('.add-equivalent-course');
  const firstRemoveButton = firstPrerequisite.querySelector('.remove-prerequisite');
  const newAddButton = firstAddButton.cloneNode(true);
  const newRemoveButton = firstRemoveButton.cloneNode(true);
  newPrerequisite.appendChild(newAddButton);
  newPrerequisite.appendChild(newRemoveButton);

  // Add the a separator and the new prerequisite row to the end of the list.
  const prerequisiteContainer = document.getElementById('prerequisites');
  const template = document.getElementById('prerequisite-and-template');
  const separator = template.content.cloneNode(true);
  prerequisiteContainer.appendChild(separator);
  prerequisiteContainer.appendChild(newPrerequisite);
}

function main() {
  adjustPrerequisiteGrid();
  addSeperatorWithinPrerequisites();
  addSeperatorBetweenPrerequisites();

  const addPrerequisiteButton = document.getElementById('add-prerequisite');
  addPrerequisiteButton.addEventListener('click', addPrerequisite);
}

main();