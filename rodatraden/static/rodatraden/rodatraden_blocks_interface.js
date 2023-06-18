// Global data whose lifetime persists. This is needed since these variables
// are used in callbacks.
const scriptDataset = document.currentScript.dataset;
let course = getAllCourses();
const coursesByYear = assignPositionsAndGroupByYear(course);

/**
 * Setups event listeners for the buttons to update and delete the block
 * schedule.
 */
function setupUpdateAndDeleteButtons() {
  $(".update-block").each(function () {
    $(this).modalForm({formURL: $(this).data('id')});
  });

  $(".delete-block").each(function () {
    $(this).modalForm({
      formURL: $(this).data('id'),
      isDeleteForm: true
    });
  });
}

/**
 * Setups the three different sections on the page (Block, chart and ISP) by
 * hiding all but one and seting up onclick event listeners for the related
 * buttons.
 */
function setupSections() {
  // Hide Chart and ISP sections.
  $("#chart").hide("fast");
  $("#ISP").hide("fast");
  
  // Setup onclick event listeners to show and hide the three different sections.
  $(".show-block").click(function() {
    $("#block-schedule").show("slow");
    $("#chart").hide("fast");
    $("#ISP").hide("fast");
  });
  $(".show-chart").click(function() {
    $("#block-schedule").hide("fast");
    $("#chart").show("slow");
    $("#ISP").hide("fast");
  });
  $(".show-ISP").click(function() {
    $("#block-schedule").hide("fast");
    $("#chart").hide("fast");
    $("#ISP").show("slow");
  });
}

/**
 * Setups the button that adds a year to the block schedule by adding an
 * onclick eventlistener. Clicking on it adds an additional year to the
 * schedule.
 * @param {{year: number, courses: any}[]} coursesByYear 
 */
function setupAddYearButton() {
  const button = document.getElementById('block-addyear');
  button.addEventListener('click', () => {
    addCourseYear(coursesByYear);
    renderBlockSchedule();
  });
}

/**
 * Creates a horizontal bar-chart that shows point sums for each category.
 * There are two bars for each category: one bar with the sum of all courses
 * in the schedule within that category, and one bar with the required points
 * within that category.
 */
function createCategorySumChart() {
  // Get data from data attributes.
  const categoriesTitle = JSON.parse(
    document.getElementById('categories-title-data').textContent
  );
  const categoriesEcts = JSON.parse(
    document.getElementById('categories-ects-data').textContent
  );
  const categoriesSum = JSON.parse(
    document.getElementById('categories-sum-data').textContent
  );

  // Set global chart options.
  Highcharts.setOptions({
    colors: ['var(--gray)', 'var(--main-color)']
  });  

  // Create the actual chart.
  Highcharts.chart('chart', {
    chart: {
      type: 'bar'
    },
    title: {
      text: ''
    },
    xAxis: {
      categories: categoriesTitle
    },
    yAxis: {
      min: 0,
      tickInterval: 7.5,
      title: {
        text: 'Poäng per kategori'
      }
    },
    tooltip: {
      headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
      pointFormat: '<tr><td style="font-size:12px;color:{series.color};padding:0">{series.name}:</td>'
        + '<td style="font-size:12px;padding:0"><b>{point.y:.1f} hp</b></td></tr>',
      footerFormat: '</table>',
      shared: true,
      useHTML: true
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0
      }
    },
    credits: {
      enabled: false
    },
    series: [
      {
        name: 'Krav',
        data: categoriesEcts
      },
      {
        name: 'Summa',
        data: categoriesSum
      }
    ]
  });
}

/**
 * Get all private and non-private courses in the block schedule from external
 * script tags and return them as a single collection.
 * 
 * @returns {Array} Private and non-private courses.
 */
function getAllCourses() {
  let courses = JSON.parse(
    document.getElementById('course-occasions-data').textContent
  );
  
  const privateCourses = JSON.parse(
    document.getElementById('private-courses-data').textContent
  );
  
  // Add speed to the non-private courses.
  for (let course of courses) {
    course.speed = parseInt(course.ects * 10 * 5 / course.weeks);
    // TODO: Replace all mentions of "length" with "weeks".
    course.length = course.weeks;
  }

  // Add speed to the private courses and add them to the other courses.
  for (let course of privateCourses) {
    // XXX: Course speed feels arbitrary. Why multiply by 50?
    course.speed = parseInt(course.ects * 10 * 5 / course.weeks);
    // TODO: Replace all mentions of "length" with "weeks".
    course.length = course.weeks;
    // XXX: Is this needed? Doesn't the course have an "is_priv" attribute?
    course.type = 'private';
    courses.push(course);
  }

  return courses;
}

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
 * @param {boolean} isLoggedIn - True if the user is logged in.
 * @param {number} xMax - Distance used to calculating size and position.
 * @param {number} scale - Scale used to calculating size and position.
 * @param {number} margin - Margin used to calculating size and position.
 */
function updateCourseBlocks(academicYear, isLoggedIn, xMax, scale, margin) {
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
 * @param {boolean} isLoggedIn - True if the user is logged in.
 */
function updateAcademicYearFooter(academicYear, isLoggedIn) {
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
  * Renders block schedule from the global course data. This function should be
  * called every time data is changed, for example when adding/removing an
  * academic year or course. The DOM elements are then
  * updated accordingly.
  */
function renderBlockSchedule() {
  const isLoggedIn = scriptDataset.isLoggedIn === 'True';

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
  updateCourseBlocks(academicYear, isLoggedIn, xMax, scale, margin);
  updateAcademicYearFooter(academicYear, isLoggedIn);
}

/**
 * Main function for this file.
 */
function block_interface_main() {
  setupUpdateAndDeleteButtons();
  setupSections();

  createCategorySumChart();

  renderBlockSchedule();
    
  setupAddYearButton();

  // Show the name of the file to be uploaded when a new file has been selected.
  document.querySelector('.custom-file-input').addEventListener(
    'change',
    function(e) {
      const fileName = document.getElementById("inputExcelFile").files[0].name;
      let label = e.target.nextElementSibling;
      label.innerText = fileName;
    }
  );
}

block_interface_main();