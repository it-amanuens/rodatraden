/* Helper code for forms with dynamic categories */

$(function() {
  $('.add-category').on('click', function() {
    const $template = $('.category-list-new');
    if (!$template.length) {
      return;
    }

    // Initialize data-next if not set
    if (!$template.data('next')) {
      $template.data('next', 0);
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

  $('[data-toggle="tooltip"]').tooltip();
});
