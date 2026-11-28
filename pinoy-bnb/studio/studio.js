/* Pinoy BnB Studio: shared settings and helpers (order form, status page, admin page). */
const SUPABASE_URL = 'https://fnebydfckdqgigtfhjfk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_PLLPO77LyLTlHHQr1yF23Q_Y27vUAO1';
const BUCKET = 'pinoy-studio';
const MAX_MB = 50;
const DOWN_PCT = 25;
const CONTACT = { phone: '0927 446 6154', messenger: 'https://m.me/61566419019212' };
const PAY = { label: 'BDO / InstaPay', name: 'Emely General', acct: 'BDO account ending in 4791', img: '../../img/pay-bdo.jpg' };

// Shown on the page; the real total is computed by the server (studio_price in studio.sql).
const PACKAGES = {
  quick: { name: 'Quick Reel', price: 999, desc: '15-sec reel, music, text and logo. Ready in 2 days.' },
  full: { name: 'Full Ad', price: 1999, desc: '15 or 30-sec reel + voiceover + caption, hashtags and FAQ replies. 1 free revision.' },
  monthly: { name: 'Monthly Pack', price: 4999, desc: '3 Full Ads a month (₱1,666 each) for promos, events and holidays. Priority turnaround.', per: '/mo' },
};
const ADDONS = {
  rush: { name: 'Rush, ready in 24 hours', price: 500 },
  square: { name: 'Extra square 1:1 version for the FB feed', price: 300 },
  event: { name: 'Birthday / event version', price: 500 },
};
// Type of business → its categories, goals and customers (index.html step 1–2).
const NATURES = {
  stay: ['Accommodation', 'Resort, staycation, condo, Airbnb, hotel'],
  retail: ['Retail', 'Shop, store, online seller, food products'],
  service: ['Service', 'Restaurant, salon, clinic, events, repairs…'],
};
const CATEGORIES = {
  stay: ['Private resort', 'Staycation / Airbnb', 'Condo rental', 'Hotel / inn', 'Glamping / campsite', 'Events place', 'Other'],
  retail: ['Clothing & fashion', 'Food & drinks', 'Bakery & desserts', 'Beauty & skincare', 'Gadgets & electronics', 'Home & furniture', 'Grocery / sari-sari', 'Online seller', 'Other'],
  service: ['Restaurant / café', 'Salon & barbershop', 'Spa & wellness', 'Clinic & dental', 'Gym & fitness', 'Events & catering', 'Photo & video', 'Repair & auto', 'Tutoring & school', 'Travel & tours', 'Other'],
};
const GOALS_BIZ = {
  launch: ['New product / service', 'Introduce something new'],
  sale: ['Promo / sale', 'Limited-time price, countdown feel'],
  open: ['Grand opening', 'New store, branch or business'],
  more: ['Get more customers', 'More orders, bookings and inquiries'],
  brand: ['Show off the business', 'Brand awareness, more followers'],
  season: ['Holiday / season', 'Christmas, payday, back-to-school, summer'],
};
const AUDIENCE = {
  stay: ['Barkada', 'Families', 'Couples', 'Company outings'],
  retail: ['Students', 'Young professionals', 'Moms & families', 'Teens', 'Seniors', 'Businesses'],
  service: ['Students', 'Young professionals', 'Moms & families', 'Teens', 'Seniors', 'Businesses'],
};
const goalsFor = (nature) => (nature === 'stay' ? GOALS : GOALS_BIZ);
const GOALS = {
  empty: ['Fill empty dates', 'Weekdays and slow dates this month'],
  promo: ['Promo / discount', 'Limited-time price, countdown feel'],
  opening: ['Grand opening', 'New resort or new cabin, first guests'],
  events: ['Events & parties', 'Birthdays, reunions, team building'],
  brand: ['Show off the place', 'Brand awareness, more followers'],
  holiday: ['Holiday season', 'Christmas, New Year, summer, Holy Week'],
};
const GUESTS = AUDIENCE.stay;
const goalLabel = (k) => (GOALS[k] || GOALS_BIZ[k] || [k, ''])[0];
const FORMATS = { reels: 'FB / IG Reels 9:16', tiktok: 'TikTok', feed: 'FB feed 1:1', shorts: 'YouTube Shorts' };
const FEELS = { hype: ['Hype & fun', 'Fast cuts, party music'], chill: ['Chill & relaxing', 'Slow, soft music'], luxury: ['Luxury', 'Elegant, cinematic'], family: ['Family-friendly', 'Warm and happy'] };
const VOICES = { taglish: 'Taglish', english: 'English', tagalog: 'Tagalog', none: 'No voice, music only' };
const CTAS_FOR = {
  stay: ['Message us to book', 'Book on our website', 'Call or text us'],
  retail: ['Message us to order', 'Visit our store', 'Shop on our page', 'Call or text us'],
  service: ['Message us to book', 'Book an appointment', 'Visit us today', 'Call or text us'],
};
const CTAS = CTAS_FOR.stay;

const peso = (n) => '₱' + Math.round(Number(n) || 0).toLocaleString('en-PH');
const downOf = (total) => Math.ceil(total * DOWN_PCT / 100);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const publicUrl = (path) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${String(path).split('/').map(encodeURIComponent).join('/')}`;

function headers(json = true) {
  const h = { apikey: SUPABASE_KEY };
  if (!SUPABASE_KEY.startsWith('sb_')) h.Authorization = 'Bearer ' + SUPABASE_KEY;
  if (json) h['Content-Type'] = 'application/json';
  return h;
}
async function rpc(fn, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  const t = await r.text();
  if (!r.ok) throw new Error('Server: ' + (t.slice(0, 160) || r.statusText));
  return JSON.parse(t);
}

const EXT_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif', mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', mp3: 'audio/mpeg', pdf: 'application/pdf' };
function fileType(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  return file.type || EXT_TYPES[ext] || 'application/octet-stream';
}
function safeName(name) {
  const ext = (name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin';
  const base = name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'file';
  return `${base}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}
/** Uploads one file to the public bucket; onProgress(0..1). Resolves with the storage path. */
function uploadFile(path, file, onProgress) {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('POST', `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`);
    const h = headers(false);
    Object.keys(h).forEach((k) => x.setRequestHeader(k, h[k]));
    x.setRequestHeader('Content-Type', fileType(file));
    x.setRequestHeader('x-upsert', 'false');
    x.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
    x.onload = () => (x.status >= 200 && x.status < 300 ? resolve(path) : reject(new Error(`Upload failed (${x.status}) for ${file.name}: ${x.responseText.slice(0, 120)}`)));
    x.onerror = () => reject(new Error(`Upload failed for ${file.name}. Check your signal and try again.`));
    x.send(file);
  });
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {
    const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
    t.remove(); return ok;
  }
}
const LOGO_SVG = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0F5C5A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="14" height="12" rx="2"></rect><path d="m16 10 6-3v10l-6-3z"></path></svg>';
