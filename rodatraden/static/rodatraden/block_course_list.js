// Simply use a for loop directly so as not to pollute the global namespace.
// Override the "add course" links with AJAX calls so there is no page reload.
for (const link of document.getElementsByClassName('add-course-link')) {
  link.addEventListener('click', event => {
    event.preventDefault();
    
    const addCourseOccasionUrl = link.getAttribute('href');

    fetch(addCourseOccasionUrl, {
      method: 'GET'
    })
    .then(() => {
      // Close the modal by simulating clicking outisde of it. This way makes
      // sure the modal closes itself properly.
      document.getElementById('modal').click();
    })
    .catch(error => console.error(error));
  });
}
