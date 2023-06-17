// Global data whose lifetime persists. This is needed since these variables
// are used in callbacks.
const scriptDataset = document.currentScript.dataset;
let courses = getAllCourses();
const coursesByYear = assignPositionsAndGroupByYear(courses);

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
    $("#study-block").show("slow");
    $("#chart").hide("fast");
    $("#ISP").hide("fast");
  });
  $(".show-chart").click(function() {
    $("#study-block").hide("fast");
    $("#chart").show("slow");
    $("#ISP").hide("fast");
  });
  $(".show-ISP").click(function() {
    $("#study-block").hide("fast");
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
    renderBlock();
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
  * Renders study-block from the global course data.
  * If the data changes you can just call this function again
  * and the study-block will be updated accordingly with fancy
  * animation representing the action taken.
  */
function renderBlock() {
  const isLoggedIn = scriptDataset.isLoggedIn === 'True';

  const xMax = 40;
  const margin = 1;
  const scale = 3;
  const transitionDuration = 500;

  // Make sure to sort the course groups by year in ascending order.
  coursesByYear.sort((a, b) => a.year - b.year);

  // Contains the rows of academic years. Each year has titles, courses and
  // buttons.
  const blockYears = d3.select('#block-years');

  /* Start academic year */

  //Data join - update selection
  let academicYears = blockYears.selectAll(".academic-year")
    .data(coursesByYear, courseGroup => courseGroup.year);

  //ENTER
  //Only added object logic here

  // Add new academic year.
  let academicYear = academicYears.enter()
    .append("div")
    .attr("class", "academic-year text-center")
    .attr("id", courseGroup => courseGroup.year)
    .style("opacity", 1e-6);

  // Animate transition for new academic year.
  academicYear.transition()
    .duration(transitionDuration)
    .style("opacity", 1);

  /* End academic year */

  /* End term header */

  // Add a header to the academic year that shows the two terms.
  let termsHeader = academicYear
    .append("div")
    .attr("class", "academic-year-header academic-year-header__terms");

  termsHeader.selectAll(".academic-year-header__term")
    .data(courseGroup => [
      { termPrefix: "HT", year: courseGroup.year },
      { termPrefix: "VT", year: courseGroup.year + 1 }
    ])
    .enter()
    .append("div")
    .attr("class", "academic-year-header__term bg-dark")
    .text(term => term.termPrefix + term.year.toString().substr(-2));

  /* End term header */
  
  /* Start period header */

  // Add a header to the academic year that shows the four periods.
  let periodsHeader = academicYear
    .append("div")
    .attr("class", "academic-year-header academic-year-header__periods");

  periodsHeader.selectAll(".academic-year-header__period")
    .data(courseGroup => [
      { periodNumber: 1, year: courseGroup.year },
      { periodNumber: 2, year: courseGroup.year },
      { periodNumber: 3, year: courseGroup.year },
      { periodNumber: 4, year: courseGroup.year }
    ])
    .enter()
    .append("div")
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

    /* End period header */

  //Block which holds the courses
  var years = academicYear
    .append("div")
    .attr("class", "courses")
    .style("height", function(d){
      var height = courseBlockHeight(d.courses, scale, margin);
      return height + "px";
    });

  /* Footer that holds the smaller divs for adding new courses */
  var footer = academicYear.append("div").attr("class", "block-footer");

  /* Add divs for footer buttons "add course" */
  var footerLp = footer.selectAll(".block-footer-lp")
    .data(function(d){
      return [
        {lp:1, year:d.year},
        {lp:2, year:d.year},
        {lp:3, year:d.year},
        {lp:4, year:d.year}
      ];
    })
    .enter()
    .append("div")
    .attr("class", "block-footer-lp bg-dark btn add-course");

  /* Append courses to block */
  courses = years
    .selectAll(".course")
    .data(function(d){
      return d.courses;
    })
    .enter()
    .append("div")
    .attr('class', function(d){
      return "course";
      /* TODO: Implement this */
      //if (d.type) return "course course-" + d.type;
      //var sometimesItIsHardToThinkOfAFittingVariableName = doIHavePrerequisites(coursesData, d.course.prerequisites, d.year, d.start);
      //return "course prereq-" + sometimesItIsHardToThinkOfAFittingVariableName;
    });

  /* Position of course on the block */
  courses
    .style("height", function(d) {
      var barHeight = (d.speed * scale) - margin*5;
      return barHeight + "px";
    })
    .style("width", function(d) {
      var barWidth = d.length / xMax * 100 - 0.5 ;
      return barWidth + "%";
    })
    .style("margin-left", function(d) {
      var left = d.start / xMax * 100 + 0.25;
      return left + "%";
    })
    .style("margin-top", function(d) {
      var top = (d.firstRowIndex * scale) + margin*3;
      return top + "px";
    });

  /* Link to each course */
  var courseLinks = courses.append("p")
    .attr("class", "pr-4 pl-1 text-left")
    .style("font-weight", "bold").style("cursor", "pointer")
    .style("cursor", "hand").style("margin-top", "10px")
    .append("a").text(function(d) {
      return d.title;
    });

  courseLinks
    .attr('class', 'courseoccasion-info')
    .attr('data-id', function(d) {
      return scriptDataset.courseoccasionInfoUrl + "?year=" + d.year +
        "&slug=" + d.slug;
    });

  academicYears.exit()
    .transition()
    .duration(transitionDuration/4)
    .style("opacity", 1e-6)
    .remove();


  /* This stuff is not required if not logged in */
  if (isLoggedIn) {

    /* Buttons to add a course */
    footerLp
      .text("Lägg till kurs")
      .style("color", "white")
      .attr("data-toggle", "tooltip")
      .attr("data-placement", "left")
      .attr('data-id', function(d) {
        var start = (d.lp - 1)*10;
        return scriptDataset.blockCourseListUrl + "?year=" + d.year + "&start=" + start;
    });

    /* Buttons to remove a course */
    var removeButton = courses
      .append("p").attr("class", "btn btn-link delete-course block-remove-button")
      .append("a").attr("class", "fa fa-times")
      .attr('href', function(d) {
        return scriptDataset.blockRemoveCourseUrl + "?slug=" + d.slug + "&private=" + d.is_priv;
    });
  }

  /* Click functionality for adding courses */
  $(".add-course").each(function () {
    $(this).modalForm({formURL: $(this).data('id')});
  });

  $(".courseoccasion-info").each(function () {
    $(this).modalForm({formURL: $(this).data('id')});
  });
}

/**
 * Main function for this file.
 */
function block_interface_main() {
  setupUpdateAndDeleteButtons();
  setupSections();

  createCategorySumChart();

  renderBlock();
    
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