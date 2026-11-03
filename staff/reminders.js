/* Staff page: reminders (1.26.0). Uses the page's own helpers (state, rpc, esc, hero, icon, app, wireBack, render).
   - Home card: turn on reminders for this phone (name comes from the PIN).
   - ?remind=<id> (opened from a notification): the "Done" screen. The first tap of the night counts. */
(function () {
  var P = window.cbtgPush;
  var pending = new URLSearchParams(location.search).get('remind');
  var on = null, busy = false, note = null, info = null, infoFor = null;

  function refreshOn() {
    if (!P) return;
    P.isOn().then(function (v) {
      var changed = v !== on; on = v;
      if (changed && state.me && !state.view && !state.done) { var y = window.scrollY; render(); window.scrollTo(0, y); }
    });
  }
  if (P) { P.register(); refreshOn(); }

  function noteHtml() { return note ? '<p class="' + (note.k === 'error' ? 'error' : 'notice') + '" role="status" style="margin-top:12px">' + esc(note.t) + '</p>' : ''; }

  function cardHtml() {
    if (!P || on === null) return '';
    if (!P.supported && !P.needsHomeScreen) return '';
    if (on) {
      return '<section class="card rmd on" aria-label="Reminders"><div class="rmd-row"><span class="rmd-ic">🔔</span><div class="grow"><b>Reminders are on</b><span class="muted small"> · this phone gets the 9 PM gate reminder</span></div></div>' + noteHtml() + '</section>';
    }
    if (P.needsHomeScreen) {
      return '<section class="card rmd" aria-label="Reminders"><p class="eyebrow">Reminders</p><h2 style="font-size:1.5rem;margin:4px 0 6px">🔔 Get reminders on this iPhone</h2>' +
        '<ol class="small" style="margin:0;padding-left:20px"><li>Tap <b>Share</b> (□↑) at the bottom of Safari.</li><li>Tap <b>Add to Home Screen</b> → <b>Add</b>.</li><li>Open the new <b>CBTG</b> icon, log in, and tap <b>Turn on reminders</b>.</li></ol></section>';
    }
    var blocked = P.perm() === 'denied';
    return '<section class="card rmd" aria-label="Reminders"><p class="eyebrow">Reminders</p><h2 style="font-size:1.5rem;margin:4px 0 6px">🔔 Turn on reminders</h2>' +
      '<p class="muted small">Get the 9 PM “close all gates” reminder on this phone, even when this page is closed.</p>' +
      (blocked ? '<p class="error small" style="margin-top:10px">Notifications are blocked for this page. Tap the lock icon next to the address → Notifications → Allow, then try again.</p>' : '') +
      '<button class="btn primary" id="rmd-on" style="margin-top:12px"' + (busy ? ' disabled' : '') + '>' + (busy ? 'Turning on…' : '🔔 Turn on reminders') + '</button>' +
      '<p class="muted small" style="margin-top:10px">Android tip: Settings → Apps → Chrome → Battery → <b>Unrestricted</b>, so reminders are not delayed.</p>' + noteHtml() + '</section>';
  }

  function wire() {
    var b = document.getElementById('rmd-on');
    if (b) b.onclick = async function () {
      busy = true; note = null; render();
      try { await P.turnOn('staff_push_subscribe', state.pin); on = true; note = { k: 'ok', t: '✓ Reminders are on. Tap “Test” to try one now.' }; }
      catch (e) { note = { k: 'error', t: e.message || String(e) }; }
      busy = false; render();
    };
    var t = document.getElementById('rmd-test');
    if (t) t.onclick = async function () {
      busy = true; note = null; render();
      try { await P.test(15); note = { k: 'ok', t: 'Test sent — lock your phone; it arrives in about 15 seconds.' }; }
      catch (e) { note = { k: 'error', t: e.message || String(e) }; }
      busy = false; render();
    };
  }

  /** Called by render(): opens the Done screen once after a notification brought us here. */
  function take() {
    if (!pending || !state.me) return false;
    state.view = 'remind'; state.remindId = pending; pending = null; info = null; note = null;
    try { history.replaceState(history.state, '', location.pathname); } catch (e) {}
    return true;
  }

  async function load(id) {
    infoFor = id; info = null;
    try { info = await rpc('staff_reminder_info', { p_pin: state.pin, p_reminder: id }); }
    catch (e) { info = { error: e.message || String(e) }; }
    if (state.view === 'remind') renderScreen();
  }

  function timeText(iso) { return new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }); }

  function renderScreen() {
    var id = state.remindId;
    if (infoFor !== id) { load(id); }
    var i = info;
    var title = i && !i.error ? i.title : 'Reminder';
    var body;
    if (!i) body = '<section class="card"><p class="muted">Loading…</p></section>';
    else if (i.error) body = '<p class="error">' + esc(i.error) + '</p>';
    else if (i.confirmed) body = '<section class="card" style="text-align:center"><div style="font-size:3rem">✅</div><h2 style="font-size:1.6rem">Done for tonight</h2>' +
      '<p class="muted">' + esc(i.confirmed.name) + ' confirmed at ' + esc(timeText(i.confirmed.at)) + '. Salamat!</p></section>';
    else body = '<section class="card" style="text-align:center"><div style="font-size:3rem">🔔</div>' +
      (i.body ? '<p style="font-size:1.1rem">' + esc(i.body) + '</p>' : '') +
      (i.confirm ? '<button class="btn primary" id="rmd-done" style="margin-top:16px"' + (busy ? ' disabled' : '') + '>' + esc(busy ? 'Saving…' : i.done_label) + '</button>' +
        '<p class="muted small" style="margin-top:10px">Only one person needs to tap this. The owner sees who did.</p>' : '') + '</section>';
    app.innerHTML = hero('Reminder', esc(title)) + '<div class="body">' + body + noteHtml() +
      '<button class="btn outline" id="rmd-home">Back to Home</button></div>';
    wireBack();
    document.getElementById('rmd-home').onclick = goBack;
    var d = document.getElementById('rmd-done');
    if (d) d.onclick = async function () {
      busy = true; note = null; renderScreen();
      try {
        var r = await rpc('staff_confirm', { p_pin: state.pin, p_reminder: id });
        if (r.error) throw new Error(r.error);
        info = Object.assign({}, info, { confirmed: { name: r.name, at: r.at } });
        note = r.mine ? { k: 'ok', t: '✓ Recorded. Salamat!' } : { k: 'ok', t: r.name + ' already confirmed tonight.' };
      } catch (e) { note = { k: 'error', t: e.message || String(e) }; }
      busy = false; renderScreen();
    };
  }

  var css = document.createElement('style');
  css.textContent = '.rmd.on{padding:14px 18px}.rmd-row{display:flex;align-items:center;gap:12px}.rmd-ic{font-size:1.4rem}.rmd-link{background:var(--sage);color:var(--forest);border:0;border-radius:999px;padding:8px 16px;font-weight:600;cursor:pointer;min-height:40px}';
  document.head.appendChild(css);

  window.cbtgRemind = { cardHtml: cardHtml, wire: wire, take: take, render: renderScreen, refresh: refreshOn };
})();
