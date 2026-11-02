/* Disbursement form: owner alerts (1.26.0). Owners turn on "not confirmed" alerts on their phone
   (e.g. "⚠ Not confirmed: 🔒 Close all gates" at 10 PM if no staff tapped Done). */
(function () {
  var P = window.cbtgPush;
  var on = null, busy = false, note = null;
  function rerender() { if (state.data && state.view === 'form') { var y = window.scrollY; render(); window.scrollTo(0, y); } }
  if (P) { P.register(); P.isOn().then(function (v) { on = v; rerender(); }); }
  function noteHtml() { return note ? '<div class="' + (note.k === 'error' ? 'error' : 'notice') + '" style="margin-top:10px">' + esc(note.t) + '</div>' : ''; }
  function cardHtml() {
    if (!P || on === null) return '';
    if (!P.supported && !P.needsHomeScreen) return '';
    if (on) return '<div class="card" style="display:flex;align-items:center;gap:10px"><span style="font-size:1.3rem">🔔</span><div style="flex:1"><b>Owner alerts are on</b><br><span class="small muted">You get a notice if the staff don’t confirm the gates by 10 PM.</span></div>' +
      '<button class="link" id="oa-test"' + (busy ? ' disabled' : '') + '>Test</button></div>' + noteHtml();
    if (P.needsHomeScreen) return '<div class="card"><b>🔔 Owner alerts on this iPhone</b><p class="small muted" style="margin-top:4px">Tap Share → <b>Add to Home Screen</b>, open the new icon, log in, then turn on alerts here.</p></div>';
    return '<div class="card"><b>🔔 Owner alerts</b><p class="small muted" style="margin-top:4px">Get a notice on this phone if no staff confirms the 9 PM gate reminder by 10 PM.</p>' +
      '<button class="btn secondary" id="oa-on" style="margin-top:10px"' + (busy ? ' disabled' : '') + '>' + (busy ? 'Turning on…' : 'Turn on alerts') + '</button>' + noteHtml() + '</div>';
  }
  function wire() {
    var b = document.getElementById('oa-on');
    if (b) b.onclick = async function () {
      busy = true; note = null; rerender();
      try { await P.turnOn('owner_push_subscribe', state.pin); on = true; note = { k: 'ok', t: '✓ Alerts are on for this phone.' }; }
      catch (e) { note = { k: 'error', t: e.message || String(e) }; }
      busy = false; rerender();
    };
    var t = document.getElementById('oa-test');
    if (t) t.onclick = async function () {
      busy = true; note = null; rerender();
      try { await P.test(15); note = { k: 'ok', t: 'Test sent — lock your phone; it arrives in about 15 seconds.' }; }
      catch (e) { note = { k: 'error', t: e.message || String(e) }; }
      busy = false; rerender();
    };
  }
  window.cbtgOwner = { cardHtml: cardHtml, wire: wire };
})();
