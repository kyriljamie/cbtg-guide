/* CBTG reminders: shared phone sign-up for push notifications (staff page + disbursement form).
   Each page has its own sw.js next to it. Nothing secret here: the publishable key is public. */
(function () {
  var BASE = 'https://fnebydfckdqgigtfhjfk.supabase.co';
  var KEY = 'sb_publishable_PLLPO77LyLTlHHQr1yF23Q_Y27vUAO1';
  var H = { apikey: KEY, 'Content-Type': 'application/json' };
  var ua = navigator.userAgent;
  var isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  var supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  function b64ToBytes(b64) {
    var p = '='.repeat((4 - (b64.length % 4)) % 4);
    var raw = atob((b64 + p).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, function (c) { return c.charCodeAt(0); });
  }
  function post(url, body) {
    return fetch(url, { method: 'POST', headers: H, body: JSON.stringify(body) }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok && !j.error) j.error = 'No connection (' + r.status + '). Check data / Wi-Fi.';
        return j;
      });
    });
  }
  function reg() { return navigator.serviceWorker.register('sw.js', { scope: './' }); }

  async function current() {
    if (!supported) return null;
    var r = await navigator.serviceWorker.getRegistration('./');
    return r ? r.pushManager.getSubscription() : null;
  }

  window.cbtgPush = {
    supported: supported,
    isIOS: isIOS,
    standalone: standalone,
    /** iPhone in Safari (not opened from the Home Screen): must add to Home Screen first. */
    needsHomeScreen: isIOS && !standalone,
    perm: function () { return supported ? Notification.permission : 'unsupported'; },
    /** true when this phone is signed up and allowed. */
    isOn: async function () {
      if (!supported || Notification.permission !== 'granted') return false;
      try { return !!(await current()); } catch (e) { return false; }
    },
    /** Ask permission, sign up with the push service and save it under this PIN (rpcName decides staff/owner). */
    turnOn: async function (rpcName, pin) {
      if (!supported) throw new Error('This browser cannot get reminders. Android: use Chrome. iPhone: Safari → Add to Home Screen.');
      var perm = await Notification.requestPermission();
      if (perm !== 'granted') throw new Error('Notifications were not allowed. Turn them on in the phone Settings for this page, then try again.');
      var r = await reg();
      await navigator.serviceWorker.ready;
      var k = await post(BASE + '/functions/v1/cbtg-push', { action: 'key' });
      if (k.error || !k.key) throw new Error(k.error || 'Could not reach the reminder server.');
      var sub = await r.pushManager.getSubscription();
      if (!sub) sub = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(k.key) });
      var s = await post(BASE + '/rest/v1/rpc/' + rpcName, { p_pin: pin, p_sub: sub.toJSON(), p_ua: ua.slice(0, 200) });
      if (s.error) throw new Error(s.error);
      return s;
    },
    turnOff: async function () {
      var sub = await current();
      if (!sub) return;
      await post(BASE + '/rest/v1/rpc/push_unsubscribe', { p_endpoint: sub.endpoint }).catch(function () {});
      await sub.unsubscribe().catch(function () {});
    },
    /** Ask the server to send this phone a test (after `delay` seconds). */
    test: async function (delay) {
      var sub = await current();
      if (!sub) throw new Error('Reminders are not on for this phone yet.');
      var j = await post(BASE + '/functions/v1/cbtg-push', { action: 'test', sub: sub.toJSON(), delay: delay || 0 });
      if (j.error) throw new Error(j.error);
      return j;
    },
    register: function () { if (supported) reg().catch(function () {}); }
  };
})();
