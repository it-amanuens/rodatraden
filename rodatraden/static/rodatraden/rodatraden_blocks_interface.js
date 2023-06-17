const scriptDataset = document.currentScript.dataset;
const isLoggedIn = scriptDataset.isLoggedIn === 'True';

/* Show and hide block and chart */
$("#chart").hide("fast");
$("#ISP").hide("fast");
$(".show-block").click(function() {
  $("#study-block").show("slow");
  $("#chart").hide("fast");
  $("#ISP").hide("fast");
});

$(".show-chart").click(function() {
  $("#chart").show("slow");
  $("#study-block").hide("fast");
  $("#ISP").hide("fast");
});

$(".show-ISP").click(function() {
  $("#ISP").show("slow");
  $("#study-block").hide("fast");
  $("#chart").hide("fast");
});

/* Category sum chart options */
Highcharts.setOptions({
    colors: ['var(--gray)', 'var(--main-color)']
});

const categoriesTitle = JSON.parse(
  document.getElementById('categories-title-data').textContent
);
const categoriesEcts = JSON.parse(
  document.getElementById('categories-ects-data').textContent
);
const categoriesSum = JSON.parse(
  document.getElementById('categories-sum-data').textContent
);

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
    series: [{
        name: 'Krav',
        data: categoriesEcts
    }, {
        name: 'Summa',
        data: categoriesSum
    }]
});

$(".update-block").each(function () {
  $(this).modalForm({formURL: $(this).data('id')});
});

$(".delete-block").each(function () {
  $(this).modalForm({
    formURL: $(this).data('id'),
    isDeleteForm: true
  });
});

let courses = JSON.parse(
  document.getElementById('course-occasions-data').textContent
);

const privateCourses = JSON.parse(
  document.getElementById('private-courses-data').textContent
);

for (let course of courses) {
  course.speed = parseInt(course.ects * 10 * 5 / course.weeks);
  // TODO: Replace all mentions of "length" with "weeks".
  course.length = course.weeks;
}

for (let course of privateCourses) {
  // XXX: Course speed feels arbitrary. Why multiply by 50?
  course.speed = parseInt(course.ects * 10 * 5 / course.weeks);
  // TODO: Replace all mentions of "length" with "weeks".
  course.length = course.weeks;
  // XXX: Is this needed? Doesn't the course have an "is_priv" attribute?
  course.type = 'private';
  courses.push(course);
}

/* Variables that hold the current blocks courses and data format */
const coursesData = assignPositionsAndGroupByYear(courses);

renderBlock(coursesData);

$(".block-addyear").click(function() {
  addCourseYear(coursesData);
  renderBlock(coursesData); //INCEPTION! :D
});

/* Filename in upload */
document.querySelector('.custom-file-input').addEventListener('change',
      function(e) {
  var fileName = document.getElementById("inputExcelFile").files[0].name;
  var nextSibling = e.target.nextElementSibling;
  nextSibling.innerText = fileName;
});


/*
  * Renders study-block from the array of objects courseData.
  * If courseData changes you can just call this function again
  * and the study-block will be updated accordingly with fancy
  * animation representing the action taken.
  *
  * In order for the rendering to function properly the coursesData
  * array must be sorted by years before beeing passed in
  */
function renderBlock(coursesData) {
  var xMax = 40;
  var margin = 1;
  var scale = 3;
  var animLength = 500;

  //Creating a scale that maps the order of coursesData
  //to topOffsets, I.e. the blockRow that corresponds to
  //coursesData[i] will have the top position of topOffset(i)
  var topOffset = getTopOffsets(coursesData, scale, margin);

  //Contains the blockrows absolute coordinates
  var studyBlock = d3.select("#study-block")
    .style("position", "relative")
    .style("height",
      (topOffset(coursesData.length) + yearButtonHeight()
        + blockRowMargin()*2) + "px");

  //Data join - update selection
  var blockRow = studyBlock.selectAll(".block-row")
    .data(coursesData, function(d) {return d.year;})

  //Update position
  blockRow.transition()
    .duration(animLength)
    .style("top", function(d, i) {return topOffset(i)+"px";});

  //ENTER
  //Only added object logic here

  //Adding block row "group div"
  var blockRowNew = blockRow.enter()
    .append("div")
    .attr("class", "block-row text-center")
    .style("left", 0 + "px")
    .style("right", 0 + "px")
    .style("position", "absolute") //Forcing the div to follow top style
    .attr("id", function(d) {return d.year;})
    .style("top", function(d, i) { return topOffset(i)+"px";})
    .style("opacity", 1e-6);

  //Animate transition for new blockRows
  blockRowNew.transition()
    .duration(animLength)
    .style("opacity", 1);

  /* Add title container */
  var header = blockRowNew
    .append("div")
    .attr("class", "block-header");

  var headerLp = header.selectAll(".block-header-lp")
    .data(function(d) {
      return [
        {year: parseInt(d.year), term: "HT"},
        {year: parseInt(d.year) + 1, term: "VT"}
      ];
    })
    .enter()
    .append("div")
    .attr("class", "block-header-lp bg-dark");

  headerLp
    .text(function(d) {
      return d.term + d.year.toString().substr(-2);
    });


  /* Add subtitle container */
  var subheader = blockRowNew
    .append("div")
    .attr("class", "block-header");

  var subheaderLp = subheader.selectAll(".block-subheader-lp")
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
    .attr("class", "block-subheader-lp bg-dark");

  subheaderLp
    .append("p")
    .text(function(d){
      var hp = Math.round(hpSumInPeriod(coursesData, d.year, d.lp)*10)/10;
      var pace = hp/10, percent = 0;

      if (pace >= 0.375) {
        for (pace; pace >= 0.375; pace -= 0.375) {
          percent += 25;
        }
      }

      return percent + " % / " + hp + " hp";
    });

  //Block which holds the courses
  var years = blockRowNew
    .append("div")
    .attr("class", "block")
    .style("height", function(d){
      var height = courseBlockHeight(d.courses, scale, margin);
      return height + "px";
    });

  /* Footer that holds the smaller divs for adding new courses */
  var footer = blockRowNew.append("div").attr("class", "block-footer");

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
    .selectAll(".block-item")
    .data(function(d){
      return d.courses;
    })
    .enter()
    .append("div")
    .attr('class', function(d){
      return "block-item";
      /* TODO: Implement this */
      //if (d.type) return "block-item course-" + d.type;
      //var sometimesItIsHardToThinkOfAFittingVariableName = doIHavePrerequisites(coursesData, d.course.prerequisites, d.year, d.start);
      //return "block-item prereq-" + sometimesItIsHardToThinkOfAFittingVariableName;
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

  blockRow.exit()
    .transition()
    .duration(animLength/4)
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

    /* Add year button at end */
    var addYearButton = studyBlock.selectAll(".block-addyear")
      .data(['foo']);

    /* Update position if required */
    addYearButton.transition()
      .duration(animLength)
      .style("top", topOffset(coursesData.length)+"px");

    /* Create the button */
    addYearButton.enter()
      .append("div")
      .style("opacity", 1e-6)
      .style("left", 0)
      .style("right", 0)
      .attr("class", "block-row block-header bg-dark block-addyear text-center")
      .style("top", (topOffset(coursesData.length)) + "px")
      .text("Add Year")
      .transition()
      .duration(animLength)
      .style("opacity", 1)

  }

  /* Click functionality for adding courses */
  $(".add-course").each(function () {
    $(this).modalForm({formURL: $(this).data('id')});
  });

  $(".courseoccasion-info").each(function () {
    $(this).modalForm({formURL: $(this).data('id')});
  });
}
