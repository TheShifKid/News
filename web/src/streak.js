const KEY = 'news5.streak';
const today = () => new Date().toISOString().slice(0, 10);

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || { days: 0, last: null }; }
  catch { return { days: 0, last: null }; }
}

export function getStreak() { return read(); }

/** מסמן שהמשתמש השלים את התקציר היום ומעדכן את הרצף. */
export function markDone() {
  const state = read();
  const day = today();
  if (state.last === day) return state;

  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const next = { days: state.last === yesterday ? state.days + 1 : 1, last: day };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  return next;
}
