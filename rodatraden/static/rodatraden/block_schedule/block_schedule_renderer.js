import AcademicYear from "./academic_year.js";
import BlockSchedule from "./block_schedule.js";
import CourseOccasion from "./course_occasion.js";
import Term from "./term.js";
/**
 * Initializes the search functionality for the course list modal.
 * Filters course rows based on the search input.
 * 
 * @param {HTMLDialogElement} modal - The modal element containing the course list.
 */
function initCourseListSearch(modal) {
  const searchInputs = modal.querySelectorAll('.rt-modal-table__search-input');
  
  searchInputs.forEach(searchInput => {
    const table = searchInput.closest('.rt-modal-table');
    const rows = table.querySelectorAll('.rt-modal-table__row');
    const noResults = table.querySelector('.rt-modal-table__no-results');
    
    searchInput.addEventListener('input', () => {
      const searchTerm = searchInput.value.toLowerCase().trim();
      let visibleCount = 0;
      
      rows.forEach(row => {
        const courseTitle = row.textContent.toLowerCase();
        const isMatch = courseTitle.includes(searchTerm);
        
        row.style.display = isMatch ? '' : 'none';
        if (isMatch) visibleCount++;
      });
      
      // Show "no results" message if nothing matches
      if (noResults) {
        noResults.style.display = visibleCount === 0 && searchTerm !== '' ? 'block' : 'none';
      }
    });
  });
  
  // Focus the first search input when modal opens
  if (searchInputs.length > 0) {
    searchInputs[0].focus();
  }
}

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
 * @param {CourseOccasion[]} coursesSameAcademicYear
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
    .attr('class', academicYear => {
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
  // Create a D3 update selection by binding data for terms based on the
  // data previously bound to the academic year. Use the prefix as key so
  // that the summer term can be added and removed dynamically.
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

      let terms = [fallTerms, springTerms];

      // Include the summer term if the year has summer enabled.
      if (academicYear.hasSummer) {
        let summerTerms = academicYear.summer;
        const summerHeight = getCourseContainerHeight(summerTerms.courses, margin, scale);

        if (shouldStackTerms) {
          summerTerms.containerHeight = summerHeight;
        } else {
          // Summer stands on its own height-wise since it's narrower.
          summerTerms.containerHeight = Math.max(summerHeight, fallTerms.containerHeight);
          // Also update fall/spring to match.
          fallTerms.containerHeight = summerTerms.containerHeight;
          springTerms.containerHeight = summerTerms.containerHeight;
        }

        terms.push(summerTerms);
      }

      return terms;
    }, term => term.prefix);

  // Remove old terms (e.g. when summer is toggled off).
  termUpdateSelection.exit().remove();

  // Add missing terms.
  let term = termUpdateSelection.enter().append("div")
    .attr("class", term => {
      let classes = "term";
      if (term.prefix === 'Sommar') {
        classes += " term--summer";
      }
      return classes;
    })
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
 * Helper function to format study pace text from ECTS sum.
 * 
 * @param {number} ectsSum - The sum of ECTS for the period.
 * @returns {string} Formatted string like "100 % / 15 hp".
 */
function formatStudyPaceText(ectsSum) {
  const roundToOneDecimal = number => Math.round(number * 10) / 10;

  // Studying 15 ECTS during one period means studying at full pace (100%).
  // The ratio of studied ECTS to full pace ECTS gives the study pace for
  // that period.
  const ectsSumFullPace = 15;
  const studyPace = ectsSum / ectsSumFullPace;

  return Math.round(studyPace * 100) + " % / " + roundToOneDecimal(ectsSum) + " hp";
}

/**
 * Adds headers for each period to new terms and updates existing ones.
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

  // Merge new and existing containers for updating.
  let allPeriodHeaderContainers = newPeriodHeaderContainer.merge(periodHeaderContainerUpdateSelection);

  // Create a D3 update selection by binding an array of ECTS sums. We don't
  // need to use a key here since the periods will never be out of order. We
  // therefore let the index be the default key.
  let periodHeaderUpdateSelection = allPeriodHeaderContainers.selectAll(".period-header")
    .data(ectsSumPerPeriod => ectsSumPerPeriod);

  // Add period headers to new containers.
  let newPeriodHeaders = periodHeaderUpdateSelection.enter().append("div")
    .attr("class", "period-header");

  // Merge new and existing period headers and update the text for all.
  newPeriodHeaders.merge(periodHeaderUpdateSelection)
    .text(ectsSum => formatStudyPaceText(ectsSum));
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
 * @param {string} blockToggleCoursePrereqUrl - URL to toggle per-course prerequisite checking.
 * @param {string} blockToggleCourseCompleteUrl - URL to toggle per-course completed (avklarad) state.
 * @param {BlockSchedule} blockSchedule - Block schedule object.
 */
export function updateCourseBlocks(courseContainer,
                                   scale,
                                   margin,
                                   isLoggedIn,
                                   courseoccasionInfoUrl,
                                   blockRemoveCourseUrl,
                                   blockToggleCoursePrereqUrl,
                                   blockToggleCourseCompleteUrl,
                                   blockSchedule) {
  // Number of weeks in a regular term (fall/spring). Summer uses 10 weeks.
  const regularTermWeekCount = 20;
  const summerTermWeekCount = Term.summerWeekLength;

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
  
  // Add a title to new the courses. The title includes a link that leads to
  // information about the course. The link will be created later.
  newCourse.append("p")
    .attr("class", "course-title");

  // Only logged in users can remove courses.
  if (isLoggedIn) {
    // Add a button to remove the course.
    let removeButton = newCourse.append("button")
      .attr("class", "btn course-remove-button");
    
    // Remove the course using AJAX when the button is clicked.
    removeButton
      .on("click", course => {
        // XXX: Often the tooltip stays on the screen permanently after the
        // course is deleted. We therefore delete it explicitly.
        const tooltip = document.querySelector('.tooltip');
        if (tooltip) {
          tooltip.remove();
        }

        const url = blockRemoveCourseUrl
                  + "?slug=" + course.slug
                  + "&private=" + (course.isPrivate ? 1 : 0);

        fetch(url, {
          method: 'GET'
        })
        .then(response => response.json())
        .then(courseOccasionsJSON => {
          const courseOccasions = courseOccasionsJSON.map(occasion => {
            return CourseOccasion.fromJSON(occasion);
          });

          blockSchedule.updateCourses(courseOccasions);
        })
        .catch(error => console.error(error));
      });
    
    // Add the icon to the button.
    removeButton.append("i")
      .attr("class", "fa fa-times");

  }

  // Make a unique identifier of the course occasion available in the DOM.
  newCourse.attr('data-slug', course => course.slug);

  // Make the course blocks draggable only if they aren't private.
  // TODO: Allow dragging for private course occasions when become movable.
  newCourse.attr("draggable", course => !course.isPrivate);

  // Make ghost status available in DOM. This way it is independent of class
  // name used for styling.
  newCourse.attr('data-ghost', course => course.isGhost);

  // Merge the newly created elements with the existing ones to get all.
  let course = newCourse.merge(courseUpdateSelection);

  // XXX: Can't seem to change the URL of the modalForm. Therefore I will just
  // recreate it on a new element.
  let courseTitle = course.select('.course-title');
  courseTitle.select('a').remove();
  
  
  let courseInfoLinks = courseTitle.append("a")
    .text(course => {
      return course.title;
    })
    // Private courses don't have a courseoccasion-info view, so we don't
    // set up the modal for them. This prevents showing stale/broken modal
    // content when clicking on a private course in the block schedule.
    .attr('class', course => course.isPrivate ? 'privatecourse-title' : 'courseoccasion-info')
    .attr('data-id', course => {
      if (course.isPrivate) {
        return null;
      }
      // Arrays are send by repeating the parameter name in the URL.
      const unmetURL = course.unmetPrerequisiteIDs.map(id => "&unmet[]=" + id).join('');
      
      const url = courseoccasionInfoUrl
                + "?year=" + course.academicYear
                + "&slug=" + course.slug
                + unmetURL;
      return url;
    });

  // Clicking the title opens the native modal with info about the course
  // occasion. Uses fetch + native <dialog> for consistency with the course
  // list modal and to avoid the sync-XHR deprecation warning that BSModalForms
  // triggers. Private courses are excluded since they have no info view.
  const nativeModal = document.getElementById('native-modal');
  courseInfoLinks
    .filter(course => !course.isPrivate)
    .on('click', function(course) {
      d3.event.preventDefault();
      const url = this.getAttribute('data-id');
      if (!url) return;

      fetch(url, { method: 'GET' })
        .then(response => response.text())
        .then(html => {
          const modalContent = nativeModal.querySelector('.modal-content');
          const parser = new DOMParser();
          const modalDocument = parser.parseFromString(html, 'text/html');
          modalContent.innerHTML = modalDocument.body.innerHTML;

          const updateCoursesFromUrl = toggleUrl => {
            fetch(toggleUrl, { method: 'GET' })
              .then(r => r.json())
              .then(courseOccasionsJSON => {
                const courseOccasions = courseOccasionsJSON.map(o => CourseOccasion.fromJSON(o));
                blockSchedule.updateCourses(courseOccasions);
                nativeModal.close();
              })
              .catch(error => console.error(error));
          };

          const prependFooterButton = (footer, className, html, onClick, isActive = false) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = className;
            button.innerHTML = html;
            if (isActive) {
              button.classList.add('modal-complete-button--active');
            }
            button.addEventListener('click', onClick);
            footer.prepend(button);
          };

          // Add per-course toggle buttons in the modal footer when the user is
          // logged in and the toggle URLs are available.
          if (isLoggedIn && blockToggleCourseCompleteUrl) {
            const footer = modalContent.querySelector('.modal-footer');
            if (footer) {
              if (blockToggleCoursePrereqUrl) {
                const prereqLabel = course.skipPrerequisiteCheck
                  ? '<i class="fa fa-graduation-cap"></i> Verifiera förkunskapskrav: Av'
                  : '<i class="fa fa-graduation-cap"></i> Verifiera förkunskapskrav: På';
                prependFooterButton(
                  footer,
                  'btn btn-rt modal-prereq-button',
                  prereqLabel,
                  () => updateCoursesFromUrl(blockToggleCoursePrereqUrl + '?slug=' + course.slug)
                );
              }

              const completeLabel = course.isCompleted
                ? '<i class="fa fa-check"></i> Avklarad'
                : '<i class="fa fa-check"></i> Markera som avklarad';
              prependFooterButton(
                footer,
                'btn btn-rt modal-complete-button',
                completeLabel,
                () => updateCoursesFromUrl(
                  blockToggleCourseCompleteUrl + '?slug=' + course.slug + '&private=0'
                ),
                course.isCompleted
              );
            }
          }

          nativeModal.showModal();
        })
        .catch(error => console.error(error));
    });

  // Set/update the style of the course blocks.
  // XXX: Many magic numbers are used to style the course blocks.
  course
    .attr('class', course => {
      let classList = ['course'];

      // Mark a block if it is private.
      if (course.isPrivate) {
        classList.push('course--private');
      }

      // Mark temporary targets spawned during a drag-and-drop action.
      if (course.isGhost) {
        classList.push('course--ghost');
      }

      // Mark a block if it is only a portion of a course, as well as which
      // term the block belongs to.
      if (course.visibleWeeks !== course.weeks) {
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
      }

      // Mark a block if prerequisite checking is skipped for this course.
      if (course.skipPrerequisiteCheck) {
        classList.push('course--skip-prereq');
      }

      // Mark a block if it's a retake of a course that appears earlier.
      if (course.isRetake) {
        classList.push('course--retake');
      }

      // Mark a block if it has been completed (avklarad).
      if (course.isCompleted) {
        classList.push('course--completed');
      }

      return classList.join(' ');
    })
    .style("height", course => {
      const height = course.speed * scale - margin * 5;
      return height + "px";
    })
    .style("width", course => {
      const isSummer = course.start >= Term.summerWeekStart;
      const weekCount = isSummer ? summerTermWeekCount : regularTermWeekCount;
      const width = course.visibleWeeks / weekCount * 100 - 0.5;
      return width + "%";
    })
    .style("margin-left", course => {
      const isSummer = course.start >= Term.summerWeekStart;
      const weekCount = isSummer ? summerTermWeekCount : regularTermWeekCount;
      const left = course.termStart / weekCount * 100 + 0.25;
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
  
  // Add missing warning icons and hide it initially.
  warningIconSelection.enter().append("i")
    .attr("class", "course-warning-icon fa fa-exclamation-triangle d-none")
    .attr("aria-hidden", "true")

  // Add a retake icon to course blocks that are retakes.
  const retakeIconSelection = course.selectAll(".course-retake-icon")
    .data(course => {
      if (course.isRetake) {
        return [course];
      } else {
        return [];
      }
    });
  
  // Remove old retake icons.
  retakeIconSelection.exit()
    .remove();
  
  // Add missing retake icons.
  retakeIconSelection.enter().append("i")
    .attr("class", "course-retake-icon fa fa-redo")
    .attr("aria-hidden", "true")


  // Add a tooltip to the course blocks with unmet prerequisites and initialize
  // the tooltips.
  // The attributes are added to all course blocks, but this doesn't matter
  // since the tooltip is only shown for the blocks if the title attribute
  // contains something.
  // NOTE: The "data-toggle" attribute is missing on purpose for unmet
  // prerequisites. This is so that the tooltip isn't enabled when
  // "$('[data-toggle="tooltip"]').tooltip()" is called somewhere else.
  // For retakes, we always show the tooltip.
  course
    .attr("data-placement", "left")
    .attr("data-toggle", course => {
      // Only enable tooltip automatically for retakes (not for unmet prerequisites)
      if (course.isRetake && course.unmetPrerequisiteIDs.length === 0) {
        return "tooltip";
      }
      return null;
    })
    .attr("title", course => {
      if (course.unmetPrerequisiteIDs.length > 0) {
        return "Förkunskapskrav ej uppfyllda\nKlicka för mer information";
      }
      if (course.isRetake) {
        return "Omregistrering";
      }
    });
  
  // Initialize tooltips for retake courses
  course.filter(course => course.isRetake && course.unmetPrerequisiteIDs.length === 0)
    .each(function() {
      $(this).tooltip();
    });
}

/**
 * Adds a footer to new terms. The footer contains buttons to add courses to
 * any of the two periods in that term, but only if the user is logged in and
 * owns that schedule.
 * 
 * @param {*} term - D3 selection of all terms.
 * @param {boolean} isLoggedIn - True if the user is a logged in owner of the schedule.
 * @param {string} blockCourseListUrl - URL to get a list of courses to add.
 * @param {BlockSchedule} blockSchedule - Block schedule object.
 */
export function addFooter(term, isLoggedIn, blockCourseListUrl, blockSchedule) {
  // Create a D3 update selection by binding relevant data for the footer. We
  // don't need to use a key here since there's only one footer per term.
  let footerUpdateSelection = term.selectAll(".term-footer")
    .data(term => {
      let periodNumbers;
      if (term.prefix === 'HT') {
        periodNumbers = [1, 2];
      } else if (term.prefix === 'Sommar') {
        periodNumbers = [5];
      } else {
        periodNumbers = [3, 4];
      }
      return [{
        academicYear: term.academicYear,
        periodNumbers: periodNumbers,
      }];
    });

  // Add missing footers.
  let footer = footerUpdateSelection.enter().append("div")
    .attr("class", "term-footer");

  // Only logged in user can add courses.
  if (isLoggedIn) {
    // Create a D3 update selection by binding data for periods based on the
    // data bound to the footer. Summer has one period, fall/spring have two.
    let buttonUpdateSelection = footer.selectAll(".term-footer-button")
      .data(term => {
        return term.periodNumbers.map(periodNumber => ({
          periodNumber: periodNumber,
          academicYear: term.academicYear
        }));
      });
    
    // Add missing buttons.
    let newButton = buttonUpdateSelection.enter().append("div")
      .attr("class", "term-footer-button btn add-course")
      .text("Lägg till kurs");
    
    // Setup data for the pop-up modal.
    newButton
      .attr("data-toggle", "tooltip")
      .attr("data-placement", "left")
      .attr('data-url', button => {
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
    newButton.on("click", function() {
      const url = this.getAttribute('data-url');

      fetch(url, {
        method: 'GET'
      })
      .then(response => response.text())
      .then(html => {
        /** @type { HTMLDialogElement } */
        const modal = document.getElementById('native-modal');
        const modalContent = modal.querySelector('.modal-content');

        // Parse the HTML string to a DOM element and replace the modal content.
        const parser = new DOMParser();
        const modalDocument = parser.parseFromString(html, 'text/html');
        modalContent.innerHTML = modalDocument.body.innerHTML;

        // Override the "add course" links with AJAX calls so there is no page
        // reload.
        for (const link of document.getElementsByClassName('add-course-link')) {
          link.addEventListener('click', event => {
            event.preventDefault();
            
            const addCourseOccasionUrl = link.getAttribute('href');
        
            fetch(addCourseOccasionUrl, {
              method: 'GET'
            })
            .then(response => response.json())
            .then(courseOccasionsJSON => {
              const courseOccasions = courseOccasionsJSON.map(occasion => {
                return CourseOccasion.fromJSON(occasion);
              });

              blockSchedule.updateCourses(courseOccasions);

              // Fade the modal before closing it.
              modal.classList.add('closing');
              modal.addEventListener(
                'animationend',
                () => {
                  modal.classList.remove('closing');
                  modal.close();
                },
                { once: true }
              );
            })
            .catch(error => console.error(error));
          });
        }

        modal.showModal();
        // Initialize search functionality for the course list modal
        initCourseListSearch(modal);
      })
      .catch(error => console.error(error));
    });

  // Otherwise just add a filler spanning the full width.
  } else {
    footer
      .append("div")
      .attr("class", "term-footer-filler");
  }
}

/**
 * Shows or hides warning icons and tooltips depending on the state of the
 * prerequisite checkbox.
 */
export function updatePrerequisiteWarnings() {
  const checkbox = document.getElementById('prerequisite-checkbox');

  // Do nothing if the checkbox doesn't exist.
  if (!checkbox) {
    return;
  }

  const courses = document.getElementsByClassName(
    'course--unmet-prerequisites'
  );
  const icons = document.getElementsByClassName('course-warning-icon');

  if (checkbox.checked) {
    for (const course of courses) {
      course.setAttribute('data-toggle', 'tooltip');
      $(course).tooltip('enable');
      course.classList.add('course--warning');
    }

    for (const icon of icons) {
      icon.classList.remove('d-none');
    }
  } else {
    for (const course of courses) {
      course.removeAttribute('data-toggle');
      $(course).tooltip('disable');
      course.classList.remove('course--warning');
    }

    for (const icon of icons) {
      icon.classList.add('d-none');
    }
  }
}

/**
 * Adds or updates summer toggle buttons after each academic year.
 * Shows "Lägg till sommar" when summer is not active, and "Ta bort sommar"
 * when it is.
 * 
 * @param {*} academicYears - D3 selection of all academic years.
 * @param {boolean} isLoggedIn - True if the user is a logged in owner of the schedule.
 * @param {BlockSchedule} blockSchedule - Block schedule object.
 */
export function addSummerToggle(academicYears, isLoggedIn, blockSchedule) {
  if (!isLoggedIn) {
    return;
  }

  // Bind summer toggle data to each academic year.
  let toggleUpdateSelection = academicYears.selectAll(".summer-toggle")
    .data(academicYear => {
      // Only show the button when summer is not active.
      if (academicYear.hasSummer) {
        return [];
      }
      return [{ year: academicYear.year }];
    });

  // Remove toggle when summer is active.
  toggleUpdateSelection.exit().remove();

  // Add missing toggles.
  let newToggle = toggleUpdateSelection.enter().append("div");

  // Merge new and existing toggles.
  let allToggles = newToggle.merge(toggleUpdateSelection);

  // Update toggle text and class.
  allToggles
    .attr("class", "summer-toggle btn text-center")
    .text("Lägg till sommar")
    .on("click", null) // Remove old handlers.
    .on("click", function(d) {
      blockSchedule.addSummer(d.year);
    });
}