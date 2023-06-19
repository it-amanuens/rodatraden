// Variables from the data parameters in the script tag. Because of
// "document.currentScript" these need to be global. If used in a function that
// is called from another script then the dataset will refer to the callers
// script tag instead.
const isLoggedIn = document.currentScript.dataset.isLoggedIn === 'True';
const courseoccasionInfoUrl = document.currentScript.dataset.courseoccasionInfoUrl;
const blockRemoveCourseUrl = document.currentScript.dataset.blockRemoveCourseUrl;
const blockCourseListUrl = document.currentScript.dataset.blockCourseListUrl;

/**
 * Adds new and removes old academic years using D3. These years holds headers,
 * courses and buttons. Returns a D3 selection of new academic years.
 * 
 * @param {*} academicYearContainer - D3 selection of a container for academic years.
 * @param {number} transitionDuration - Transition duration in milliseconds.
 * @returns D3 selection of new academic years.
 */
function updateAcademicYear(academicYearContainer, transitionDuration) {
  // Create a D3 update selection by binding each array in "coursesByYear" to
  // an academic year, previously existing or not. The parameter "year" is used
  // as the key so that existing years gets put in the "update" selection.
  let academicYearUpdateSelection = academicYearContainer.selectAll(".academic-year")
    .data(coursesByYear, courseGroup => courseGroup.year);

  // Add, if needed, new academic years.
  let newAcademicYear = academicYearUpdateSelection.enter().append("div")
    .attr("class", "academic-year text-center")
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

  return newAcademicYear;
}

/**
 * Adds headers for each term to new academic years.
 * 
 * @param {*} newAcademicYear - D3 selection of new academic years.
 */
function addTermsHeader(newAcademicYear) {
  // Add a container for the term headers to the academic years.
  let termHeaderContainer = newAcademicYear.append("div")
    .attr("class", "academic-year-header academic-year-header__terms");

  // Create a D3 update selection by binding data for two terms based on the
  // data previously bound to the academic year. We don't need to use a key
  // here since the newly created empty container has no previously bound data.
  let termHeaderUpdateSelection = termHeaderContainer.selectAll(".academic-year-header__term")
    .data(courseGroup => [
      { termPrefix: "HT", year: courseGroup.year },
      { termPrefix: "VT", year: courseGroup.year + 1 }
    ]);

  // Add term headers to the container.
  termHeaderUpdateSelection.enter().append("div")
    .attr("class", "academic-year-header__term bg-dark")
    // Combine the term prefix with the two last digits of the year.
    .text(term => term.termPrefix + term.year.toString().substr(-2));
}

/**
 * Adds headers for each period to new academic years.
 * 
 * @param {*} newAcademicYear - D3 selection of new academic years.
 */
function addPeriodsHeader(newAcademicYear) {
  // Add a container for the period headers to the academic years.
  let periodHeaderContainer = newAcademicYear.append("div")
    .attr("class", "academic-year-header academic-year-header__periods");

  // Create a D3 update selection by binding data for four periods based on the
  // data previously bound to the academic year. We don't need to use a key
  // here since the newly created empty container has no previously bound data.
  let periodHeaderUpdateSelection = periodHeaderContainer.selectAll(".academic-year-header__period")
    .data(courseGroup => [
      { periodNumber: 1, year: courseGroup.year },
      { periodNumber: 2, year: courseGroup.year },
      { periodNumber: 3, year: courseGroup.year },
      { periodNumber: 4, year: courseGroup.year }
    ]);
  
  // Add period headers to the container.
  periodHeaderUpdateSelection.enter().append("div")
    .attr("class", "academic-year-header__period bg-dark")
    .text(period => {
      const roundToOneDecimal = number => Math.round(number * 10) / 10;

      // Studying 15 ECTS during one period means studying at full pace (100%).
      // The ratio of studied ECTS to full pace ECTS gives the study pace for
      // that period.
      const ectsFullPace = 15;
      const ects = hpSumInPeriod(coursesByYear, period.year, period.periodNumber);
      const studyPace = ects / ectsFullPace;

      return Math.round(studyPace * 100) + " % / " + roundToOneDecimal(ects) + " hp";
    });
}

/**
 * Adds courses to new academic years. The courses include a title and a button
 * to remove the course.
 * 
 * @param {*} newAcademicYear - D3 selection of new academic years.
 * @param {number} xMax - Distance used to calculating size and position.
 * @param {number} scale - Scale used to calculating size and position.
 * @param {number} margin - Margin used to calculating size and position.
 */
function addCourseBlocks(newAcademicYear, xMax, scale, margin) {
  // Add a container for all course blocks to the academic years.
  let courseContainer = newAcademicYear.append("div")
    .attr("class", "course-container")
    .style("height", courseGroup => {
      const height = courseBlockHeight(courseGroup.courses, scale, margin);
      return height + "px";
    });

  // Create a D3 update selection by binding the courses from the data
  // previously bound to the academic year. We don't need to use a key here
  // since the newly created empty container has no previously bound data.
  let courseUpdateSelection = courseContainer.selectAll(".course")
    .data(courseGroup => courseGroup.courses);

  // Add courses to the container.
  // XXX: Many magic numbers are used to style the course blocks.
  let course = courseUpdateSelection.enter().append("div")
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
      const left = course.start / xMax * 100 + 0.25;
      return left + "%";
    })
    .style("margin-top", course => {
      const top = course.firstRowIndex * scale + margin * 3;
      return top + "px";
    });

  // Add a title to the course.
  // XXX: Why is the cursor set twice? Is it for backwards compatibility?
  let courseTitle = course.append("p")
    .attr("class", "pr-4 pl-1 text-left")
    .style("margin-top", "10px")
    .style("font-weight", "bold")
    .style("cursor", "pointer")
    .style("cursor", "hand");

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
    let removeButton = course.append("p")
      .attr("class", "btn btn-link delete-course block-remove-button");
    
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
}

/**
 * Adds a footer to new academic years. The footer contains buttons to add
 * courses to any of the four periods, but only if the user is logged in.
 * 
 * @param {*} newAcademicYear - D3 selection of new academic years.
 */
function addFooter(newAcademicYear) {
  // Add a footer to the academic years.
  let footer = newAcademicYear
    .append("div")
    .attr("class", "academic-year-footer");

  // Create a D3 update selection by binding data for four periods based on the
  // data previously bound to the academic year. We don't need to use a key
  // here since the newly created empty container has no previously bound data.
  let footerPeriodUpdateSelection = footer.selectAll(".academic-year-footer-period")
    .data(courseGroup => [
      { periodNumber: 1, year: courseGroup.year },
      { periodNumber: 2, year: courseGroup.year },
      { periodNumber: 3, year: courseGroup.year },
      { periodNumber: 4, year: courseGroup.year }
    ]);

  // Only logged in user can add courses.
  if (isLoggedIn) {
    // Add buttons to footer.
    let footerPeriod = footerPeriodUpdateSelection
      .enter()
      .append("div")
      .attr("class", "academic-year-footer-period bg-dark btn add-course")
      .text("Lägg till kurs")
      .style("color", "white");
    
    // Setup data for the pop-up modal.
    // XXX: The page is refreshed each time a course is added. Could this be
    // solved by instead sending an AJAX request?
    footerPeriod
      .attr("data-toggle", "tooltip")
      .attr("data-placement", "left")
      .attr('data-id', period => {
        // XXX: Why use the start weeks 0, 10, 20 and 30 when the period number
        // would do? The code would be clearer if the server did the week
        // converersion instead.
        const start = (period.periodNumber - 1) * 10;
        const url = blockCourseListUrl + "?year=" + period.year
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
      .attr("class", "academic-year-footer-year bg-dark");
  }
}

/**
 * Update block schedule DOM elements based on the global course data. This
 * function should be called every time data is changed, for example when
 * adding/removing an academic year or course. The DOM elements are then
 * updated accordingly.
 */
function updateBlockSchedule() {
  const transitionDuration = 500;

  const xMax = 40;
  const margin = 1;
  const scale = 3;

  // Make sure the groups of courses are sorted by year in ascending order.
  coursesByYear.sort((a, b) => a.year - b.year);

  // Container for all the academic years. Each year has headers, a set of
  // courses and a footer.
  const academicYearContainer = d3.select('#academic-year-container');

  // Update all DOM elements. Changes can be because an academic year or course
  // has been added or removed.
  let newAcademicYear = updateAcademicYear(academicYearContainer, transitionDuration);
  addTermsHeader(newAcademicYear);
  addPeriodsHeader(newAcademicYear);
  addCourseBlocks(newAcademicYear, xMax, scale, margin);
  addFooter(newAcademicYear);
}
