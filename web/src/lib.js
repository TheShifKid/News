export const TOPIC_LABELS = {
  politics: 'פוליטיקה', security: 'ביטחון', economy: 'כלכלה', tech: 'טכנולוגיה',
  music: 'מוזיקה', culture: 'תרבות', world: 'עולם', sports: 'ספורט', general: 'כללי'
};

// צבע לכל נושא, כדי שאפשר יהיה לזהות את סוג הידיעה עוד לפני קריאת הכותרת
export const TOPIC_COLORS = {
  politics: '#1b57c4', security: '#d8392b', economy: '#0f7a52', tech: '#6b3fc4',
  music: '#c4257e', culture: '#b0591b', world: '#0b6d7d', sports: '#4a6218', general: '#5a5d66'
};

export const topicColor = topics => TOPIC_COLORS[topics?.[0]] || TOPIC_COLORS.general;

export function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'עכשיו';
  if (mins < 60) return `לפני ${mins} דק׳`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `לפני ${hours} ${hours === 1 ? 'שעה' : 'שעות'}`;
  const days = Math.round(hours / 24);
  return `לפני ${days} ${days === 1 ? 'יום' : 'ימים'}`;
}

export function hebrewDate(iso) {
  return new Date(iso).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** מספר סידורי דו-ספרתי — 01, 02 — לסימון מקומו של הסיפור בתקציר. */
export const ordinal = n => String(n).padStart(2, '0');

export function uniqueOutlets(sources) {
  return [...new Map(sources.map(s => [s.name.split(' ')[0], s])).values()];
}
