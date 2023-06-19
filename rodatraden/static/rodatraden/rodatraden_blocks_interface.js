// Variables from the data parameters in the script tag. Because of
// "document.currentScript" these need to be global. If used in a function that
// is called from another script then the dataset will refer to the callers
// script tag instead.
const startYear = parseInt(document.currentScript.dataset.startYear);

// Data that needs to be global so that their lifetime persist.
let coursesByYear = assignPositionsAndGroupByYear(getAllCourses(), startYear);

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
    addAcademicYear(coursesByYear, startYear);
    updateBlockSchedule();
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
 * Main function for this file.
 */
function block_interface_main() {
  setupUpdateAndDeleteButtons();
  setupSections();

  createCategorySumChart();

  updateBlockSchedule();
    
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