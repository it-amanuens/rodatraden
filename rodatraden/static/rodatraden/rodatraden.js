/* Provide jQuery compatibility wrappers for Bootstrap 5 APIs. */
(function (window) {
  if (!window.jQuery || !window.bootstrap) {
    return;
  }

  const $ = window.jQuery;

  if (!$.fn.tooltip && window.bootstrap.Tooltip) {
    $.fn.tooltip = function (action) {
      return this.each(function () {
        const instance = window.bootstrap.Tooltip.getOrCreateInstance(this);
        if (action === 'dispose') instance.dispose();
        else if (action === 'enable') instance.enable();
        else if (action === 'disable') instance.disable();
        else if (action === 'hide') instance.hide();
        else if (action === 'show') instance.show();
      });
    };
  }

  if (!$.fn.dropdown && window.bootstrap.Dropdown) {
    $.fn.dropdown = function (action) {
      return this.each(function () {
        const instance = window.bootstrap.Dropdown.getOrCreateInstance(this);
        if (action === 'show') instance.show();
        else if (action === 'hide') instance.hide();
        else instance.toggle();
      });
    };
  }
})(window);

/* Bootstrap tooltips */
$(function () { $('[data-bs-toggle="tooltip"]').tooltip() });
/* Bootstrap dropdown */
$(function () { $('.dropdown-toggle').dropdown(); });

/* Hide alerts automatically */
$(".alert").fadeTo(2000, 500).slideUp(500, function(){
  $(".alert").slideUp(500);
});

$(function () {
   $(".select2-mult-choice").select2({ width: '100%' });
});
