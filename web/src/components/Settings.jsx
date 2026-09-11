import { useState } from 'react';
import { TOPIC_LABELS, TOPIC_COLORS } from '../lib.js';
import { getSlots, setSlots, requestPermission } from '../notify.js';

function ListEditor({ label, hint, items, onChange }) {
  const [draft, setDraft] = useState('');

  function add() {
    const value = draft.trim();
    if (value && !items.includes(value)) onChange([...items, value]);
    setDraft('');
  }

  return (
    <div className="mb-7">
      <h3 className="font-bold text-[15px]">{label}</h3>
      <p className="text-xs text-ink-3 mt-0.5 mb-2.5">{hint}</p>
      <div className="flex gap-2">
        <input value={draft} onChange={e => setDraft(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && add()}
               placeholder="הקלד והקש Enter"
               className="flex-1 bg-paper-2 border border-rule rounded-[3px] px-3 py-2 text-sm outline-none focus:border-ink-3" />
        <button onClick={add} className="px-4 rounded-[3px] bg-ink text-paper text-sm font-bold">הוסף</button>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {items.length === 0 && <span className="text-xs text-ink-3">ריק</span>}
        {items.map(item => (
          <button key={item} onClick={() => onChange(items.filter(i => i !== item))}
                  className="text-xs px-3 py-1.5 rounded-[3px] bg-paper-2 border border-rule">
            {item} <span className="text-ink-3">✕</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Reminders() {
  const [slots, setLocalSlots] = useState(getSlots);
  const [permission, setPermission] = useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );

  function update(next) {
    setLocalSlots(next);
    setSlots(next);
  }

  return (
    <section className="mb-8">
      <h3 className="font-bold text-[15px]">תזכורות יומיות</h3>
      <p className="text-xs text-ink-3 mt-0.5 mb-3">
        {permission === 'unsupported' ? 'הדפדפן הזה לא תומך בהתראות.'
          : permission === 'granted' ? 'ההתראה נשלחת כשהאפליקציה מותקנת ופתוחה ברקע.'
          : 'צריך לאשר התראות פעם אחת.'}
      </p>

      {permission === 'default' && (
        <button onClick={() => requestPermission().then(setPermission)}
                className="mb-3 px-4 py-2 rounded-[3px] bg-ink text-paper text-sm font-bold">
          אפשר התראות
        </button>
      )}

      <div className="flex flex-wrap gap-2">
        {slots.map((slot, i) => (
          <div key={i} className="flex items-center gap-1 bg-paper-2 border border-rule rounded-[3px] px-2">
            <input type="time" value={slot}
                   onChange={e => update(slots.map((s, j) => (j === i ? e.target.value : s)))}
                   className="bg-transparent py-2 text-sm outline-none tabular-nums" />
            <button onClick={() => update(slots.filter((_, j) => j !== i))}
                    aria-label="הסר שעה" className="text-ink-3 text-xs px-1">✕</button>
          </div>
        ))}
        <button onClick={() => update([...slots, '09:00'])}
                className="px-4 rounded-[3px] border border-rule text-sm">+ שעה</button>
      </div>
    </section>
  );
}

export default function Settings({ settings, onChange }) {
  const bl = settings.blocklist;
  const set = patch => onChange({ ...settings, ...patch });

  return (
    <div className="h-full overflow-y-auto no-bar px-5 py-6 pb-10">
      <h2 className="font-display text-3xl mb-7">הגדרות</h2>

      <section className="mb-8">
        <h3 className="font-bold text-[15px]">כמה סיפורים בתקציר</h3>
        <div className="flex items-center gap-3 mt-2">
          <input type="range" min="3" max="12" value={settings.briefSize}
                 onChange={e => set({ briefSize: Number(e.target.value) })}
                 className="flex-1 accent-ink" />
          <span className="font-display text-lg w-7 text-center tabular-nums">{settings.briefSize}</span>
        </div>
      </section>

      <Reminders />

      <section className="mb-8">
        <h3 className="font-bold text-[15px]">מה מעניין אותך</h3>
        <p className="text-xs text-ink-3 mt-0.5 mb-3">משנה את הדירוג בתקציר. לא מסתיר כלום.</p>
        {Object.entries(settings.topicWeights).map(([topic, weight]) => (
          <div key={topic} className="flex items-center gap-3 mb-2">
            <span className="w-20 text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TOPIC_COLORS[topic] }} />
              {TOPIC_LABELS[topic] || topic}
            </span>
            <input type="range" min="0" max="1" step="0.05" value={weight}
                   onChange={e => set({ topicWeights: { ...settings.topicWeights, [topic]: Number(e.target.value) } })}
                   className="flex-1" style={{ accentColor: TOPIC_COLORS[topic] }} />
            <span className="w-8 text-xs text-ink-3 text-left tabular-nums">{Math.round(weight * 100)}</span>
          </div>
        ))}
      </section>

      <section className="border-t border-rule pt-6">
        <h3 className="font-display text-xl mb-1.5">רשימת חסימה</h3>
        <p className="text-xs text-ink-3 leading-relaxed mb-5">
          שם חוסם רק תוכן שהאדם מפרסם בעצמו — טור דעה, ראיון או ציטוט שלו בכותרת.
          דיווח עיתונאי על מה שהוא עושה ימשיך להופיע. מילת מפתח חוסמת תמיד.
        </p>
        <ListEditor label="שמות" hint="למשל פרשן שלא מעניין אותך"
                    items={bl.names} onChange={names => set({ blocklist: { ...bl, names } })} />
        <ListEditor label="מילות מפתח" hint="חוסם כל ידיעה שמכילה את המילה"
                    items={bl.keywords} onChange={keywords => set({ blocklist: { ...bl, keywords } })} />
      </section>
    </div>
  );
}
