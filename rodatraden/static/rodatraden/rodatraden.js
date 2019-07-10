/* Bootstrap nice tooltips */
$(function () { $('[data-toggle="tooltip"]').tooltip() })
/* BOotstrap dropdown */
$(function(){ $('.dropdown-toggle').dropdown(); });

/* Hide alerts automatically */
$(".alert").fadeTo(2000, 500).slideUp(500, function(){
  $(".alert").slideUp(500);
});

$(function () {
   $(".select2-mult-choice").select2({ width: '100%' });
});
