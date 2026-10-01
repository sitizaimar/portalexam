(function () {
  var b = document.getElementById('burger'), m = document.getElementById('menu');
  if (b && m) {
    b.addEventListener('click', function () {
      var open = m.classList.toggle('open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var q = document.getElementById('faq-q');
  if (q) {
    var items = [];
    function reload() { items = Array.prototype.slice.call(document.querySelectorAll('.faq details')); }
    reload();
    var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
    var none = document.getElementById('faq-none');
    var cat = 'semua';
    function apply() {
      var t = q.value.trim().toLowerCase(), shown = 0;
      items.forEach(function (d) {
        var ok = (cat === 'semua' || d.getAttribute('data-cat') === cat) &&
                 (!t || d.textContent.toLowerCase().indexOf(t) !== -1);
        d.hidden = !ok;
        if (ok) shown++;
      });
      none.hidden = shown !== 0;
    }
    document.addEventListener('faq-updated', function () { reload(); apply(); });
    q.addEventListener('input', apply);
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        cat = c.getAttribute('data-cat');
        chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
        apply();
      });
    });
  }
})();
