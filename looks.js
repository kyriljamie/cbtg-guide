/* CBTG page themes (staff page + disbursement form).
   Four looks: dark (default), gold, forest, night. The choice is kept on this phone only.
   Loaded in <head> so the page never flashes the wrong colours. */
(function () {
  var KEY = 'cbtg-look';
  var LOOKS = ['dark', 'gold', 'forest', 'night'];
  var NAMES = { dark: 'Dark', gold: 'Gold', forest: 'Forest', night: 'Night' };
  var BAR = { dark: '#121412', gold: '#0B0B09', forest: '#1F3A2B', night: '#0E1630' };

  function current() {
    try { var v = localStorage.getItem(KEY); return LOOKS.indexOf(v) >= 0 ? v : 'dark'; } catch (e) { return 'dark'; }
  }
  function apply(v) {
    document.documentElement.setAttribute('data-look', v);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', BAR[v]);
  }
  apply(current());
  document.addEventListener('DOMContentLoaded', function () { apply(current()); });

  window.cbtgLook = {
    current: current,
    /** The row of four round swatches. Put it anywhere; taps are handled below. */
    picker: function () {
      var c = current();
      return '<div class="lookpick" role="radiogroup" aria-label="Theme"><p class="lookpick-t">Theme</p><div class="lookpick-row">' +
        LOOKS.map(function (v) {
          return '<button type="button" role="radio" aria-checked="' + (v === c) + '" class="lp lp-' + v + (v === c ? ' on' : '') +
            '" data-look-pick="' + v + '"><i aria-hidden="true"></i><span>' + NAMES[v] + '</span></button>';
        }).join('') + '</div></div>';
    }
  };

  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-look-pick]') : null;
    if (!b) return;
    e.preventDefault();
    var v = b.getAttribute('data-look-pick');
    try { localStorage.setItem(KEY, v); } catch (x) { /* private mode: still switch for now */ }
    apply(v);
    var all = document.querySelectorAll('[data-look-pick]');
    for (var i = 0; i < all.length; i++) {
      var on = all[i].getAttribute('data-look-pick') === v;
      all[i].classList.toggle('on', on);
      all[i].setAttribute('aria-checked', String(on));
    }
  });
})();
