// Progressive enhancement: show only the filter that matches the chosen type.
// Without JavaScript both fields stay visible and the form still works.
(function () {
  var form = document.querySelector('[data-search-form]');
  if (!form) return;

  function update() {
    var checked = form.querySelector('input[name="type"]:checked');
    var type = checked ? checked.value : 'spell';
    form.querySelectorAll('[data-for]').forEach(function (field) {
      field.hidden = field.getAttribute('data-for') !== type;
    });
  }

  form.addEventListener('change', update);
  update();
})();
