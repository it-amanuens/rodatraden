/* Helper code for forms with dynamic categories */

$(function() {
  $('.add-category').on('click', function() {
    let $this = $('.category-list-new')
    /* Get the div and clone */
    let $clone = $this.clone(true, true)
    /* get name from hidden div */
    let name = $clone.find('select').attr('name')
    /* Get num */
    n = parseInt(name.split('_')[1]) + 1

    /* Update select name and id */
    name = 'category_' + n + '_0'
    $clone.find('select').val('')
    $clone.find('select').attr('name', name)
    name = 'category_' + (n+1) + '_0'
    $this.find('select').attr('name', name)
    id = 'id_category_' + n + '_0'
    $clone.find('select').attr('id', id)
    id = 'id_category_' + (n+1) + '_0'
    $this.find('select').attr('id', id)

    /* Update input name and id */
    name = 'category_' + n + '_1'
    $clone.find('input').val("0.0")
    $clone.find('input').attr('name', name)
    name = 'category_' + (n + 1) + '_1'
    $this.find('input').attr('name', name)
    id = 'id_category_' + n + '_1'
    $clone.find('input').attr('id', id)
    id = 'id_category_' + (n+1) + '_1'
    $this.find('input').attr('id', id)

    /* Remove classes from new div and insert */
    $clone.removeClass('d-none')
    $clone.removeClass('category-list-new')
    $clone.insertBefore($this)
  });

  $(".remove-category").on('click', function(event) {
    let $this = $(this)

    if ($this.parent().hasClass("category-list-new"))
    {
      $this.parent().prev().addClass("category-list-new")
    }

    $(this).parent().remove();
  });

  $('[data-bs-toggle="tooltip"]').tooltip()
});
