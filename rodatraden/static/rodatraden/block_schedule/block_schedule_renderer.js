import AcademicYear from "./academic_year.js";
import CourseOccasion from "./course_occasion.js";

/**
 * Calculates the height needed for 100% pace to be used as a min height. This
 * is used to visualize that 100% pace is the expected pace when the schedule
 * isn't yet filled with courses.
 * 
 * @param {number} scale - Scale used to calculating size and position.
 * @param {number} margin - Margin used to calculating size and position.
 * @returns Height needed contain courses with a combined pace of 100%.
 */
function getCourseContainerMinHeight(scale, margin) {
  // A 10 week long course worth 15 ects is an example of studies at 100% pace.
  const ects = 15;
  const weeks = 10;
  // Course occasion instantiated simply for its height. The other parameters
  // are null to cause trouble if this instance is used for other purposes.
  const fullPaceCourseOccasion = new CourseOccasion(
    null, null, ects, null, null, weeks, null
  );
  const containerHeight = fullPaceCourseOccasion.speed;

  return containerHeight * scale + 2 * margin;
}

/**
 * Calculates the height needed to contain alla courses in the term.
 * 
 * @param {number} scale - Scale used to calculating size and position.
 * @param {number} margin - Margin used to calculating size and position.
 * @returns Height needed contain all given courses.
 */
function getCourseContainerHeight(coursesSameAcademicYear, margin, scale) {
  const containerHeight = coursesSameAcademicYear.reduce(
    (containerHeight, course) => {
      // Calculate the distance from the top of the term to the bottom of the
      // course. This is the minimum height needed to contain the course.
      const distanceToBottomOFCourse = course.firstRowIndex + course.speed;
      return Math.max(containerHeight, distanceToBottomOFCourse);
    },
    0
  );

  return containerHeight * scale + 2 * margin;
}

/**
 * Adds new and removes old academic years using D3. The new years won't
 * contain any DOM elements but all years will have up-to-date data bound to
 * them.
 * 
 * @param {HTMLElement} academicYearContainer - D3 selection of a container for academic years.
 * @param {AcademicYear[]} academicYearsData
 * @param {boolean} shouldStackTerms - True if terms should be stacked vertically.
 * @param {number} transitionDuration - Transition duration in milliseconds.
 * @returns D3 selection of all academic years.
 */
export function updateAcademicYear(academicYearContainer, academicYearsData, shouldStackTerms, transitionDuration) {
  // Convert the container to a D3 selection.
  academicYearContainer = d3.select(academicYearContainer);

  // Create a D3 update selection by binding each array in the containers bound
  // data to an academic year, previously existing or not. The parameter "year"
  // is used as the key so that existing years gets correctly put in the update
  // selection.
  let academicYearUpdateSelection = academicYearContainer.selectAll(".academic-year")
    .data(academicYearsData, academicYear => academicYear.year);

  // Add, if needed, new academic years.
  let newAcademicYear = academicYearUpdateSelection.enter().append("div")
    .attr("id", academicYear => academicYear.year)
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
        classList.push('academic-year--one-column');
      } else {
        classList.push('academic-year--two-columns');
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
 * @param {boolean} shouldStackTerms - True if terms should be stacked vertically.
 * @param {number} scale - Scale used to calculating size and position.
 * @param {number} margin - Margin used to calculating size and position.
 * @returns D3 selection of all terms.
 */
export function updateTerm(academicYear, shouldStackTerms, margin, scale) {
  // Create a D3 update selection by binding data for two terms based on the
  // data previously bound to the academic year. We don't need to use a key
  // here since the terms will never be out of order. We therefore let the
  // index be the default key.
  let termUpdateSelection = academicYear.selectAll(".term")
    .data(academicYear => {
      const fallHeight = getCourseContainerHeight(academicYear.fall.courses, margin, scale);
      const springHeight = getCourseContainerHeight(academicYear.spring.courses, margin, scale);

      let fallTerms = academicYear.fall;
      let springTerms = academicYear.spring;

      // Add an attribute to the terms that will be used to set the height of
      // the course containers.
      if (shouldStackTerms) {
        fallTerms.containerHeight = fallHeight;
        springTerms.containerHeight = springHeight;
      } else {
        fallTerms.containerHeight = Math.max(fallHeight, springHeight);
        springTerms.containerHeight = Math.max(fallHeight, springHeight);
      }

      return [fallTerms, springTerms];
    });

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
export function addTermHeader(term) {
  // Create a D3 update selection by binding the term title. We don't need to
  // use a key here since there's only one header per term.
  let termHeaderUpdateSelection = term.selectAll(".term-header")
    .data(term => [term.title]);

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
export function addPeriodHeaders(term) {
  // Create a D3 update selection by binding relevant data for the two periods.
  // We don't need to use a key here since there's only one period container
  // per term.
  let periodHeaderContainerUpdateSelection = term.selectAll(".period-header-container")
    .data(term => [term.ectsSumPerPeriod]);

  // Add missing containers.
  let newPeriodHeaderContainer = periodHeaderContainerUpdateSelection.enter().append("div")
    .attr("class", "period-header-container");

  // Create a D3 update selection by binding an array of ECTS sums. We don't
  // need to use a key here since the periods will never be out of order. We
  // therefore let the index be the default key.
  let periodHeaderUpdateSelection = newPeriodHeaderContainer.selectAll(".period-header-container")
    .data(ectsSumPerPeriod => ectsSumPerPeriod);

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
 * @param {number} scale - Scale used to calculating size and position.
 * @param {number} margin - Margin used to calculating size and position.
 * @returns D3 selection of all course containers.
 */
export function updateCourseContainer(term, scale, margin) {
  // Create a D3 update selection by binding term data that includes courses to
  // the container. We don't need to use a key here since there's only one
  // course container per term.
  let courseContainerUpdateSelection = term.selectAll(".course-container")
    .data(term => [term]);

  // Add missing course block containers.
  let newCourseContainer = courseContainerUpdateSelection.enter().append("div")
    .attr("class", "course-container");
  
  // Merge the newly created elements with the existing ones to get all.
  let courseContainer = newCourseContainer.merge(courseContainerUpdateSelection);

  courseContainer
    .style("height", term => {
      const height = term.containerHeight;
      return height + "px";
    })
    .style("min-height", getCourseContainerMinHeight(scale, margin) + "px");

  return courseContainer;
}

/**
 * Adds and removes courses to containers. The courses include a title and a
 * button to remove the course.
 * 
 * @param {*} courseContainer - D3 selection of all course containers.
 * @param {number} scale - Scale used to calculating size and position.
 * @param {number} margin - Margin used to calculating size and position.
 * @param {boolean} isLoggedIn - True if the user is a logged in owner of the schedule.
 * @param {string} courseoccasionInfoUrl - URL for the course occasion info view.
 * @param {string} blockRemoveCourseUrl - URL to remove a course occasion.
 */
export function updateCourseBlocks(courseContainer, scale, margin, isLoggedIn,
                            courseoccasionInfoUrl, blockRemoveCourseUrl) {
  // Number of weeks in a term.
  const termWeekCount = 20;

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
      // Arrays are send by repeating the parameter name in the URL.
      const unmetURL = course.unmetPrerequisiteIDs.map(id => "&unmet[]=" + id).join('');
      
      const url = courseoccasionInfoUrl
                + "?year=" + course.academicYear
                + "&slug=" + course.slug
                + unmetURL;
      return url;
    });

  // Clicking the title opens a modal with info about the course occasion.
  $(".courseoccasion-info").each(function () {
    $(this).modalForm({
      formURL: $(this).data('id')
    });
  });

  // Only logged in users can remove courses.
  if (isLoggedIn) {
    // Add a button to remove the course.
    // XXX: The page is refreshed each time a course is deleted. Could this be
    // solved by instead sending an AJAX request?
    let removeButton = newCourse.append("a")
      .attr("class", "btn course-remove-button")
      .attr('href', course => {
        // Make sure to convert booleans to integers before creating the URL.
        const url = blockRemoveCourseUrl + "?slug=" + course.slug
          + "&private=" + (course.isPrivate ? 1 : 0);
        return url;
      });
    
    // Add the icon to the button.
    removeButton.append("i")
      .attr("class", "fa fa-times");
  }

  // Merge the newly created elements with the existing ones to get all.
  let course = newCourse.merge(courseUpdateSelection);

  // Set/update the style of the course blocks.
  // XXX: Many magic numbers are used to style the course blocks.
  course
    .attr('class', course => {
      let classList = ['course'];

      // Mark a block if it is private.
      if (course.isPrivate) {
        classList.push('course--private');
      }

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

      // Mark a block if it has unmet prerequisites and add a class that will be
      // toggled by the prerequisite checkbox.
      if (course.unmetPrerequisiteIDs.length > 0) {
        classList.push('course--unmet-prerequisites');
        classList.push('course--warning');
      }

      return classList.join(' ');
    })
    .style("height", course => {
      const height = course.speed * scale - margin * 5;
      return height + "px";
    })
    .style("width", course => {
      const width = course.length / termWeekCount * 100 - 0.5;
      return width + "%";
    })
    .style("margin-left", course => {
      const left = course.termStart / termWeekCount * 100 + 0.25;
      return left + "%";
    })
    .style("margin-top", course => {
      const top = course.firstRowIndex * scale + margin * 3;
      return top + "px";
    });

  // Add a warning icon to the course blocks that have unmet prerequisites.
  const warningIconSelection = course.selectAll(".course-warning-icon")
    .data(course => {
      if (course.unmetPrerequisiteIDs.length > 0) {
        // The content of the data array is irrelevant since we only want to add
        // an icon, but we need some data to be present to trigger the enter and
        // exit selections.
        return [course];
      } else {
        return [];
      }
    });
  
  // Remove old warning icons.
  warningIconSelection.exit()
    .remove();
  
  // Add missing warning icons.
  warningIconSelection.enter().append("i")
    .attr("class", "course-warning-icon fa fa-exclamation-triangle")
    .attr("aria-hidden", "true")


  // Add a tooltip to the course blocks with unmet prerequisites and initialize
  // the tooltips.
  // XXX: Right now the data-toggle and data-placement attributes are added to
  // all course blocks, but this shouldn't matter since the tooltip is only
  // shown for the blocks with the title attribute.
  course
    .attr("data-toggle", "tooltip")
    .attr("data-placement", "left")
    .attr("title", course => {
      if (course.unmetPrerequisiteIDs.length > 0) {
        return "Förkunskapskrav ej uppfyllda\nKlicka för mer information";
      }
    });
  $('[data-toggle="tooltip"]').tooltip();
}

/**
 * Adds a footer to new terms. The footer contains buttons to add courses to
 * any of the two periods in that term, but only if the user is logged in and
 * owns that schedule.
 * 
 * @param {*} term - D3 selection of all terms.
 * @param {boolean} isLoggedIn - True if the user is a logged in owner of the schedule.
 * @param {string} blockCourseListUrl - URL to get a list of courses to add.
 */
export function addFooter(term, isLoggedIn, blockCourseListUrl) {
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
