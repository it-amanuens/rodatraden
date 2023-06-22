// Variables from the data parameters in the script tag. Because of
// "document.currentScript" these need to be global. If used in a function that
// is called from another script then the dataset will refer to the callers
// script tag instead.
const isLoggedIn = document.currentScript.dataset.isLoggedIn === 'True';
const courseoccasionInfoUrl = document.currentScript.dataset.courseoccasionInfoUrl;
const blockRemoveCourseUrl = document.currentScript.dataset.blockRemoveCourseUrl;
const blockCourseListUrl = document.currentScript.dataset.blockCourseListUrl;

/**
 * Combines the term prefix and the last two digits of the term year to create
 * the title. The term year differs from the academic year during the spring.
 * @param {str} prefix - Either "VT" or "HT".
 * @param {number} academicYear
 * @returns Combination of prefix and year, e.g., "HT19", "VT20", etc.
 */
function getTermTitle(prefix, academicYear) {
  // The term year is one more than the academic year in the spring.
  const termYear = academicYear + (prefix === 'VT');
  return prefix + termYear.toString().slice(-2);
}

/**
 * Adds new and removes old academic years using D3. The new years won't
 * contain any DOM elements but all years will have up-to-date data bound to
 * them.
 * 
 * @param {*} academicYearContainer - D3 selection of a container for academic years.
 * @param {number} transitionDuration - Transition duration in milliseconds.
 * @returns D3 selection of all academic years.
 */
function updateAcademicYear(academicYearContainer, transitionDuration) {
  // Create a D3 update selection by binding each array in "coursesByYear" to
  // an academic year, previously existing or not. The parameter "year" is used
  // as the key so that existing years gets correctly put in the update
  // selection.
  let academicYearUpdateSelection = academicYearContainer.selectAll(".academic-year")
    .data(coursesByTerm, courseGroup => courseGroup.year);

  // Add, if needed, new academic years.
  let newAcademicYear = academicYearUpdateSelection.enter().append("div")
    .attr("id", courseGroup => courseGroup.year)
    .style("opacity", 1e-6);
  
  // Remove, if needed, old academic years.
  academicYearUpdateSelection.exit()
    .transition()
    .duration(transitionDuration / 4)
    .style("opacity", 1e-6)
    .remove();

  // Animate transition for new academic year.
  newAcademicYear
    .transition()
    .duration(transitionDuration)
    .style("opacity", 1);

  // Merge the newly created elements with the existing ones to get all.
  let academicYears = newAcademicYear.merge(academicYearUpdateSelection);
  academicYears
    .attr('class', () => {
      let classList = ['academic-year'];

      if (shouldStackTerms) {
        classList.push('one-column');
      } else {
        classList.push('two-columns');
      }

      return classList.join(' ');
    })
  
    return academicYears;
}

/**
 * Binds data to all terms for all academic years. Adds missing terms if
 * needed.
 * 
 * @param {*} academicYear - D3 selection of all academic years.
 * @returns D3 selection of all terms.
 */
function updateTerm(academicYear) {
  // Create a D3 update selection by binding data for two terms based on the
  // data previously bound to the academic year. We don't need to use a key
  // here since the terms will never be out of order. We therefore let the
  // index be the default key.
  let termUpdateSelection = academicYear.selectAll(".term")
    .data(courseGroup => [
      {
        prefix: 'HT',
        academicYear: courseGroup.year,
        courses: courseGroup.fall.courses,
        ectsSums: [
          courseGroup.fall.ectsSumPeriod1,
          courseGroup.fall.ectsSumPeriod2
        ],
        height: courseGroup.height
      },
      {
        prefix: 'VT',
        academicYear: courseGroup.year,
        courses: courseGroup.spring.courses,
        ectsSums: [
          courseGroup.spring.ectsSumPeriod3,
          courseGroup.spring.ectsSumPeriod4
        ],
        height: courseGroup.height
      }
    ]);

  // Add missing terms.
  let term = termUpdateSelection.enter().append("div")
    .attr("class", "term")
    .style('z-index', term => term.prefix === 'HT' ? '2' : '1')
  
  // Merge the newly created elements with the existing ones to return all.
  return term.merge(termUpdateSelection);
}

/**
 * Adds a header to new terms.
 * 
 * @param {*} term - D3 selection of all terms.
 */
function addTermHeader(term) {
  // Create a D3 update selection by binding the term title. We don't need to
  // use a key here since there's only one header per term.
  let termHeaderUpdateSelection = term.selectAll(".term-header")
    .data(term => [
      getTermTitle(term.prefix, term.academicYear)
    ]);

  // Add missing headers.
  termHeaderUpdateSelection.enter().append("div")
    .attr("class", "term-header")
    // Combine the term prefix with the two last digits of the year.
    .text(title => title);
}

/**
 * Adds headers for each period to new terms.
 * 
 * @param {*} term - D3 selection of all terms.
 */
function addPeriodHeaders(term) {
  // Create a D3 update selection by binding relevant data for the two periods.
  // We don't need to use a key here since there's only one period container
  // per term.
  let periodHeaderContainerUpdateSelection = term.selectAll(".period-header-container")
    .data(term => [
      term.ectsSums
    ]);

  // Add missing containers.
  let newPeriodHeaderContainer = periodHeaderContainerUpdateSelection.enter().append("div")
    .attr("class", "period-header-container");

  // Create a D3 update selection by binding an array of ECTS sums. We don't
  // need to use a key here since the periods will never be out of order. We
  // therefore let the index be the default key.
  let periodHeaderUpdateSelection = newPeriodHeaderContainer.selectAll(".period-header-container")
    .data(ectsSums => ectsSums);

  // Add period headers to the new containers.
  periodHeaderUpdateSelection.enter().append("div")
    .attr("class", "period-header")
    .text(ectsSum => {
      const roundToOneDecimal = number => Math.round(number * 10) / 10;

      // Studying 15 ECTS during one period means studying at full pace (100%).
      // The ratio of studied ECTS to full pace ECTS gives the study pace for
      // that period.
      const ectsSumFullPace = 15;
      const studyPace = ectsSum / ectsSumFullPace;

      return Math.round(studyPace * 100) + " % / " + roundToOneDecimal(ectsSum) + " hp";
    });
}

/**
 * Adds containers for courses to new terms.
 * 
 * @param {*} term - D3 selection of all terms.
 * @returns D3 selection of all course containers.
 */
function updateCourseContainer(term) {
  // Create a D3 update selection by binding data needed for the courses to the
  // container. We don't need to use a key here since there's only one course
  // container per term.
  let courseContainerUpdateSelection = term.selectAll(".course-container")
    .data(term => [
      {
        courses: term.courses,
        height: term.height
      }
    ]);

  // Add missing course block containers.
  let newCourseContainer = courseContainerUpdateSelection.enter().append("div")
    .attr("class", "course-container")
    .style("height", courseContainer => {
      // XXX: The height of this term might not match the height of the other
      //      term.
      // TODO: Pre-calculate the heights, at least in terms of number of rows
      //       (including space between courses).
      const height = courseContainer.height;
      return height + "px";
    });
  
  // Merge the newly created elements with the existing ones to return all.
  return newCourseContainer.merge(courseContainerUpdateSelection);
}

/**
 * Adds and removes courses to containers. The courses include a title and a
 * button to remove the course.
 * 
 * @param {*} courseContainer - D3 selection of all course containers.
 * @param {number} xMax - Distance used to calculating size and position.
 * @param {number} scale - Scale used to calculating size and position.
 * @param {number} margin - Margin used to calculating size and position.
 */
function updateCourseBlocks(courseContainer, xMax, scale, margin) {
  // Create a D3 update selection by binding all of the courses. We combine the
  // courses' year, starting week and slug to create a unique identifier for
  // each course. This is used as the key when binding the data.
  let courseUpdateSelection = courseContainer.selectAll(".course")
    .data(
      term => term.courses,
      course => `${course.year} ${course.start} ${course.slug}`
    );

  // Remove old courses from the container.
  courseUpdateSelection.exit()
    .remove()

  // Add missing courses to the container.
  let newCourse = courseUpdateSelection.enter().append("div")
  
  // Add a title to new the courses.
  let courseTitle = newCourse.append("p")
    .attr("class", "course-title");

  // The title includes a link that leads to information about the course.
  courseTitle.append("a")
    .text(course => {
      return course.title;
    })
    .attr('class', 'courseoccasion-info')
    .attr('data-id', course => {
      const url = courseoccasionInfoUrl + "?year=" + course.year
        + "&slug=" + course.slug;
      return url;
    });

  // Only logged in users can remove courses.
  if (isLoggedIn) {
    // Add a button to remove the course.
    let removeButton = newCourse.append("p")
      .attr("class", "btn btn-link delete-course course-remove-button");
    
    // Add the icon and url to the button.
    // XXX: The page is refreshed each time a course is deleted. Could this be
    // solved by instead sending an AJAX request?
    removeButton.append("a")
      .attr("class", "fa fa-times")
      .attr('href', course => {
        const url = blockRemoveCourseUrl + "?slug=" + course.slug
          + "&private=" + course.is_priv;
        return url;
    });

    // Clicking the button removes the course.
    $(".courseoccasion-info").each(function () {
      $(this).modalForm({
        formURL: $(this).data('id')
      });
    });
  }

  // Merge the newly created elements with the existing ones to get all.
  let course = newCourse.merge(courseUpdateSelection);

  // Set/update the style of the course blocks.
  // XXX: Many magic numbers are used to style the course blocks.
  course
    .attr('class', course => {
      let classList = ['course'];

      // Mark a block if it is only a portion of a course, as well as which
      // term the block belongs to.
      if (course.length !== course.weeks) {
        const springWeekStart = 20;

        classList.push('course-split');

        if (course.start >= springWeekStart) {
          classList.push('course-split__spring');
        } else {
          classList.push('course-split__fall');
        }
      }

      return classList.join(' ');
    })
    .style("height", course => {
      const height = course.speed * scale - margin * 5;
      return height + "px";
    })
    .style("width", course => {
      const width = course.length / xMax * 100 - 0.5;
      return width + "%";
    })
    .style("margin-left", course => {
      const left = course.termStart / xMax * 100 + 0.25;
      return left + "%";
    })
    .style("margin-top", course => {
      const top = course.firstRowIndex * scale + margin * 3;
      return top + "px";
    });
}

/**
 * Adds a footer to new terms. The footer contains buttons to add courses to
 * any of the two periods in that term, but only if the user is logged in and
 * owns that schedule.
 * 
 * @param {*} term - D3 selection of all terms.
 */
function addFooter(term) {
  // Create a D3 update selection by binding relevant data for the footer. We
  // don't need to use a key here since there's only one footer per term.
  let footerUpdateSelection = term.selectAll(".term-footer")
    .data(term => [
      {
        academicYear: term.academicYear,
        periodNumbers: term.prefix === 'HT' ? [1, 2] : [3, 4],
      }
    ]);

  // Add missing footers.
  let footer = footerUpdateSelection.enter().append("div")
    .attr("class", "term-footer");

  // Only logged in user can add courses.
  if (isLoggedIn) {
    // Create a D3 update selection by binding data for two periods based on the
    // data bound to the footer. We don't need to use a key here since the
    // buttons will never be out of order. We therefore let the index be the
    // default key.
    let buttonUpdateSelection = footer.selectAll(".term-footer-button")
      .data(term => [
        { periodNumber: term.periodNumbers[0], academicYear: term.academicYear },
        { periodNumber: term.periodNumbers[1], academicYear: term.academicYear }
      ]);
    
    // Add missing buttons.
    let newButton = buttonUpdateSelection.enter().append("div")
      .attr("class", "term-footer-button btn add-course")
      .text("Lägg till kurs");
    
    // Setup data for the pop-up modal.
    // XXX: The page is refreshed each time a course is added. Could this be
    // solved by instead sending an AJAX request?
    newButton
      .attr("data-toggle", "tooltip")
      .attr("data-placement", "left")
      .attr('data-id', button => {
        // XXX: Why use the start weeks 0, 10, 20 and 30 when the period number
        // would do? The code would be clearer if the server did the week
        // converersion instead.
        const periodWeekLength = 10;
        const start = (button.periodNumber - 1) * periodWeekLength;
        const url = blockCourseListUrl + "?year=" + button.academicYear
          + "&start=" + start;
        return url;
    });

    // Show a pop-up modal with a list of courses to add when the user clicks
    // on a button.
    $(".add-course").each(function () {
      $(this).modalForm({
        formURL: $(this).data('id')
      });
    });

  // Otherwise just add a filler spanning the full width.
  } else {
    footer
      .append("div")
      .attr("class", "term-footer-filler");
  }
}

/**
 * Updates block-schedule DOM elements based on the global course data. This
 * function should be called every time data is changed, for example when
 * adding/removing an academic year or course. The DOM elements are then
 * updated accordingly.
 */
function updateBlockSchedule() {
  const transitionDuration = 500;

  const xMax = 20;
  const margin = 1;
  const scale = 3;

  // Make sure the groups of courses are sorted by year in ascending order.
  coursesByTerm.sort((a, b) => a.year - b.year);

  // Container for all the academic years. Each year has headers, a set of
  // courses and a footer.
  const academicYearContainer = d3.select('#academic-year-container');

  // Start by removing old academic years, adding new and empty ones while
  // binding all with up-to-date data.
  let academicYearSelection = updateAcademicYear(academicYearContainer, transitionDuration);
  
  // Bind data to all terms and create new and empty terms if needed.
  let termSelection = updateTerm(academicYearSelection);
  
  // Add term and period headers to all new terms.
  addTermHeader(termSelection);
  addPeriodHeaders(termSelection);
  
  // Bind data to all course containers and create new and empty terms if
  // needed.
  let courseContainerSelection = updateCourseContainer(termSelection);

  // Bind data to all courses, update them if needed and create new ones that
  // are missing.
  updateCourseBlocks(courseContainerSelection, xMax, scale, margin);
  
  // Add a footer to all new terms.
  addFooter(termSelection);
}
