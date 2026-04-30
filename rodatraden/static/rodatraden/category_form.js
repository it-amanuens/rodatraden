/* Helper code for forms with dynamic categories */

$(function() {
  $('.add-category').on('click', function() {
    const $template = $('.category-list-new');
    if (!$template.length) {
      return;
    }

    // Initialize data-next if not set
    // The template row is also submitted (as an empty row), so we must
    // start numbering new rows after the template's index to avoid name
    // collisions (which would cause the template's blank values to override
    // the first added row on the server side).
    if (typeof $template.data('next') === 'undefined') {
      const templateName = $template.find('select').attr('name') || '';
      const match = templateName.match(/^category_(\d+)_/);
      const next = match ? parseInt(match[1], 10) + 1 : 0;
      $template.data('next', next);
    }

    const n = $template.data('next');
    const $clone = $template.clone(true, true);

    // Update the clone with the current index
    $clone.find('select')
      .val('')
      .attr('name', `category_${n}_0`)
      .attr('id', `id_category_${n}_0`);

    $clone.find('input')
      .val('')
      .attr('name', `category_${n}_1`)
      .attr('id', `id_category_${n}_1`);

    // Increment the template's next index
    $template.data('next', n + 1);

    // Remove template classes and insert
    $clone.removeClass('d-none category-list-new');
    $clone.insertBefore($template);
  });

  // Use event delegation for remove handlers (works for dynamically added elements)
  $(document).on('click', '.remove-category', function() {
    const $row = $(this).closest('.form-group.row');

    if (!$row.hasClass('category-list-new')) {
      $row.remove();
    }
  });

  $('[data-bs-toggle="tooltip"]').tooltip();
});
