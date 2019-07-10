$(document).ready(function() {
  $('.add-category').on('click', function() {
    let $this = $('.category-list-new')
    /* Get the div and clone */
    let $clone = $this.clone(true, true)

    /* get name from select and update */
    let name = $clone.find('select').attr('name')
    let n = parseInt(name.split('_')[1]) + 1
    name = 'category_' + n + '_0'
    $clone.find('select').val('')
    $clone.find('select').attr('name', name)
    /* add new name to ects */
    name = 'category_' + n + '_1'
    $clone.find('input').attr('name', name)
    $clone.find('button').removeClass('invisible')
    /* append and move class to the new div */
    $clone.insertAfter($this)
    $this.removeClass('category-list-new')
  });

  $(".remove-category").on('click', function(event) {
    let $this = $(this)

    if ($this.parent().hasClass("category-list-new"))
    {
      $this.parent().prev().addClass("category-list-new")
    }

    $(this).parent().remove();
  });
});
