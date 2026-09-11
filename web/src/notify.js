// תזכורות יומיות. אין שרת push, ולכן ההתראה נקבעת כשהאפליקציה פתוחה או
// כשה-Service Worker מתעורר. זה אמין ברוב המקרים אבל לא מובטח כמו push אמיתי.
const KEY = 'news5.notify';
const DEFAULT_SLOTS = ['11:00', '16:30'];

export function getSlots() {
  try { return JSON.parse(localStorage.getItem(KEY)) || DEFAULT_SLOTS; }
  catch { return DEFAULT_SLOTS; }
}

export function setSlots(slots) {
  try { localStorage.setItem(KEY, JSON.stringify(slots)); } catch {}
  schedule();
}

export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported';
  const result = await Notification.requestPermission();
  if (result === 'granted') schedule();
  return result;
}

let timer = null;

function nextSlotAt(slots) {
  const now = new Date();
  const times = slots.map(s => {
    const [h, m] = s.split(':').map(Number);
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    if (d <= now) d.setDate(d.getDate() + 1);
    return d;
  });
  return times.sort((a, b) => a - b)[0];
}

export function schedule() {
  clearTimeout(timer);
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const slots = getSlots();
  if (!slots.length) return;

  const at = nextSlotAt(slots);
  // setTimeout מוגבל ל-~24.8 ימים, וכאן תמיד פחות מ-24 שעות
  timer = setTimeout(async () => {
    const reg = await navigator.serviceWorker?.ready.catch(() => null);
    const body = 'התקציר מוכן. חמש דקות וסיימת.';
    if (reg) reg.showNotification('חמש דקות', { body, icon: 'icon-192.png', tag: 'news5-brief' });
    else new Notification('חמש דקות', { body });
    schedule();
  }, at - Date.now());
}
