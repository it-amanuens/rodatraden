/**
 * JavaScript for handling dynamic category fields in forms.
 * Used by private course and exam forms to add/remove category inputs.
 */

$(function() {
  // Add a new category field by cloning the hidden template
  $('.add-category').click(function() {
    // Find the hidden template row (last category field with d-none class)
    const template = $('.category-list-new');
    
    if (template.length) {
      // Clone the template
      const newField = template.clone();
      
      // Remove the template classes so it's visible
      newField.removeClass('category-list-new d-none');
      
      // Update the field name/id to be unique
      const fieldCount = $('.form-group.row.px-3:not(.d-none)').length;
      const input = newField.find('input, select');
      
      input.each(function() {
        const name = $(this).attr('name');
        const id = $(this).attr('id');
        
        if (name) {
          // Update name with new index
          $(this).attr('name', name.replace(/_\d+$/, '_' + fieldCount));
        }
        if (id) {
          // Update id with new index
          $(this).attr('id', id.replace(/_\d+$/, '_' + fieldCount));
        }
        
        // Clear the value
        $(this).val('');
      });
      
      // Insert before the template
      newField.insertBefore(template);
    }
  });
  
  // Remove a category field
  $(document).on('click', '.remove-category', function() {
    const row = $(this).closest('.form-group.row');
    
    // Don't remove if it's the template row
    if (!row.hasClass('category-list-new')) {
      row.remove();
    }
  });
});
