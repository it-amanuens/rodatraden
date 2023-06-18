// Global data whose lifetime persists. They need to be global since these they
// are used in callbacks.
const scriptDataset = document.currentScript.dataset;
const isLoggedIn = scriptDataset.isLoggedIn === 'True';

/**
 * Adds, if needed, academic years divs using D3. These years holds headers,
 * courses and buttons. Returns any newly created academic years.
 * 
 * @param {*} blockYears - D3 object of any newly created academic years.
 * @param {number} transitionDuration - Transition duration in milliseconds.
 * @returns D3 object containing any newly created academic years.
 */
function updateAcademicYear(blockYears, transitionDuration) {
  // Create a selection of academic years, including those that need to be
  // created, based on the data attached.
  let academicYearSelection = blockYears.selectAll(".academic-year")
    .data(coursesByYear, courseGroup => courseGroup.year);

  // Add, if needed, new academic years.
  let academicYear = academicYearSelection.enter().append("div")
    .attr("class", "academic-year text-center")
    .attr("id", courseGroup => courseGroup.year)
    .style("opacity", 1e-6);
  
  // Remove, if needed, old academic years.
  academicYearSelection.exit()
    .transition()
    .duration(transitionDuration/4)
    .style("opacity", 1e-6)
    .remove();

  // Animate transition for new academic year.
  academicYear
    .transition()
    .duration(transitionDuration)
    .style("opacity", 1);

  return academicYear;
}

/**
 * Adds, if needed, headers for each term of the academic years.
 * 
 * @param {*} academicYear - D3 data structure.
 */
function updateTermsHeader(academicYear) {
  // Add a container for the term headers to any newly created academic years.
  let termHeaderContainer = academicYear.append("div")
    .attr("class", "academic-year-header academic-year-header__terms");
  
  // Create a selection of term headers, including those that need to be
  // created, based on the data attached.
  let termHeaderSelection = termHeaderContainer.selectAll(".academic-year-header__term")
    .data(courseGroup => [
      { termPrefix: "HT", year: courseGroup.year },
      { termPrefix: "VT", year: courseGroup.year + 1 }
    ]);
    
  // Add, if needed, headers to the academic years that shows the two terms.
  termHeaderSelection.enter().append("div")
    .attr("class", "academic-year-header__term bg-dark")
    .text(term => term.termPrefix + term.year.toString().substr(-2));
}

/**
 * Adds, if needed, headers for each period of the academic years.
 * 
 * @param {*} academicYear - D3 data structure.
 */
function updatePeriodsHeader(academicYear) {
  // Add a header that shows the four periods to any newly created academic
  // years.
  let periodHeaderContainer = academicYear.append("div")
    .attr("class", "academic-year-header academic-year-header__periods");

  // Create a selection of period headers, including those that need to be
  // created, based on the data attached.
  let periodHeaderSelection = periodHeaderContainer.selectAll(".academic-year-header__period")
    .data(courseGroup => [
      { periodNumber: 1, year: courseGroup.year },
      { periodNumber: 2, year: courseGroup.year },
      { periodNumber: 3, year: courseGroup.year },
      { periodNumber: 4, year: courseGroup.year }
    ]);
  
  // Add, if needed, headers to the academic years that shows the four periods.
  periodHeaderSelection.enter().append("div")
    .attr("class", "academic-year-header__period bg-dark")
    .text(period => {
      const roundToOneDecimal = number => Math.round(number * 10) / 10;

      // Studying 15 ECTS during one period means studying at full pace (100%).
      // The ratio of studied ECTS to full pace ECTS give the study pace for
      // that period.
      const ectsFullPace = 15;
      const ects = hpSumInPeriod(coursesByYear, period.year, period.periodNumber);
      const studyPace = ects / ectsFullPace;

      return Math.round(studyPace * 100) + " % / " + roundToOneDecimal(ects) + " hp";
    });
}

/**
 * Adds, if needed, a container for all course blocks to the academic years.
 * Returns any newly created course containers.
 * 
 * @param {*} academicYear - D3 data structure.
 * @param {number} scale - Scale used when calculating the container height.
 * @param {number} margin - Margin used when calculating the container height.
 * @returns D3 object containing any newly created course containers.
 */
function updateCourseContainer(academicYear, scale, margin) {
  // Add a container for all course blocks to any newly created academic years.
  let courseContainer = academicYear.append("div")
    .attr("class", "course-container")
    .style("height", courseGroup => {
      const height = courseBlockHeight(courseGroup.courses, scale, margin);
      return height + "px";
    });
  
  return courseContainer;
}

/**
 * Adds any new courses to the academic year. The courses include a title and a
 * button to remove the course.
 * 
 * @param {*} academicYear - D3 data structure.
 * @param {number} xMax - Distance used to calculating size and position.
 * @param {number} scale - Scale used to calculating size and position.
 * @param {number} margin - Margin used to calculating size and position.
 */
function updateCourseBlocks(academicYear, xMax, scale, margin) {
  // Add a container for all course blocks to any newly created academic years.
  let courseContainer = academicYear.append("div")
    .attr("class", "course-container")
    .style("height", courseGroup => {
      const height = courseBlockHeight(courseGroup.courses, scale, margin);
      return height + "px";
    });

  // Create a selection of courses, including those that need to be created,
  // based on the data attached.
  let courseSelection = courseContainer.selectAll(".course")
    .data(courseGroup => courseGroup.courses);

  // Add, if needed, courses to the container.
  // XXX: Many magic numbers are used to style the block.
  let course = courseSelection.enter().append("div")
    .attr('class', "course")
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
      const url = scriptDataset.courseoccasionInfoUrl + "?year=" + course.year
        + "&slug=" + course.slug;
      return url;
    });

  // Only logged in users can remove courses.
  if (isLoggedIn) {
    // Add, if needed, a button to remove the course.
    let removeButton = course.append("p")
      .attr("class", "btn btn-link delete-course block-remove-button");
    
    // Setup data for the button.
    // XXX: The page is refreshed each time a course is deleted. Could this be
    // solved by instead sending a POST request?
    removeButton.append("a")
      .attr("class", "fa fa-times")
      .attr('href', course => {
        const url = scriptDataset.blockRemoveCourseUrl + "?slug=" + course.slug
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
 * Adds a footer to any newly created academic years. The footer contains
 * buttons to add courses to any of the four periods, but only if the user is
 * logged in.
 * 
 * @param {*} academicYear - D3 data structure.
 */
function updateFooter(academicYear) {
  // Add a footer to any newly created academic years.
  let footer = academicYear
    .append("div")
    .attr("class", "academic-year-footer");

  /* Add divs for footer buttons "add course" */
  // Create a selection of buttons for each period, including those that need
  // to be created, based on the data attached.
  let footerPeriodSelection = footer.selectAll(".academic-year-footer-period")
    .data(courseGroup => [
      { periodNumber: 1, year: courseGroup.year },
      { periodNumber: 2, year: courseGroup.year },
      { periodNumber: 3, year: courseGroup.year },
      { periodNumber: 4, year: courseGroup.year }
    ]);

  // Only logged in user can add courses.
  if (isLoggedIn) {
    // Add, if needed, headers to the academic years that shows the four periods.
    let footerPeriod = footerPeriodSelection
      .enter()
      .append("div")
      .attr("class", "academic-year-footer-period bg-dark btn add-course")
      .text("Lägg till kurs")
      .style("color", "white");
    
    // Setup data for the pop-up modal.
    // XXX: The page is refreshed each time a course is added. Could this be
    // solved by instead sending a POST request?
    footerPeriod
      .attr("data-toggle", "tooltip")
      .attr("data-placement", "left")
      .attr('data-id', period => {
        // XXX: Why use the start weeks 0, 10, 20 and 30 when the period number
        // would do? The code would be clearer if the server did the week
        // converersion instead.
        const start = (period.periodNumber - 1) * 10;
        const url = scriptDataset.blockCourseListUrl + "?year=" + period.year
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
  let academicYear = updateAcademicYear(academicYearContainer, transitionDuration);
  updateTermsHeader(academicYear);
  updatePeriodsHeader(academicYear);
  updateCourseBlocks(academicYear, xMax, scale, margin);
  updateFooter(academicYear);
}
