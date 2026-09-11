import { useState } from 'react';
import { TOPIC_LABELS, topicColor, uniqueOutlets } from '../lib.js';

// עברית אינה מסתדרת עם "1 שבועות", ולכן היחידות כתובות במפורש
function daysLabel(days) {
  const whole = Math.round(days);
  if (whole >= 21) return `${Math.round(whole / 7)} שבועות`;
  if (whole >= 14) return 'שבועיים';
  if (whole >= 7) return 'שבוע';
  if (whole <= 1) return 'יום';
  return `${whole} ימים`;
}

function Thread({ story }) {
  const [open, setOpen] = useState(false);
  const color = topicColor(story.topics);
  const { ageDays, activeDays, timeline, article } = story.rolling;

  // כשכל מה שיש לנו הוא מבזק, מוצגת במקומו הכתבה המלאה האחרונה על הסיפור
  const headline = article?.title || story.title;
  const link = article?.link || story.sources[0].link;
  const outletName = article?.outlet || uniqueOutlets(story.sources)[0].name;

  return (
    <article className="border border-rule rounded-[3px] bg-paper-2 overflow-hidden">
      <div className="h-[3px]" style={{ background: color }} />

      <div className="p-4">
        <div className="flex items-center gap-2 text-[11px] mb-2">
          <span className="font-extrabold tracking-[0.06em]" style={{ color }}>
            {TOPIC_LABELS[story.topics[0]] || 'חדשות'}
          </span>
          <span className="text-ink-3">
            נמשך {daysLabel(ageDays)} · סיקור ב־{activeDays} ימים
          </span>
        </div>

        <h3 className="font-display text-[19px] leading-[1.3] text-balance">
          <a href={link} target="_blank" rel="noreferrer">{headline}</a>
        </h3>

        {!article && story.summary && (
          <p className="mt-2 text-[13px] leading-[1.6] text-ink-2 line-clamp-3">{story.summary}</p>
        )}

        <div className="flex items-center gap-3 mt-3">
          <button onClick={() => setOpen(o => !o)}
                  className="text-[12px] font-bold" style={{ color }}>
            {open ? 'סגור את ציר הזמן' : `איך הגענו לכאן · ${timeline.length} תחנות`}
          </button>
          <span className="text-[11px] text-ink-3 mr-auto">{outletName}</span>
        </div>

        {open && (
          <ol className="mt-3 border-r border-rule pr-3 flex flex-col gap-2.5">
            {timeline.map(entry => (
              <li key={entry.link} className="relative">
                <span className="absolute -right-[17px] top-[5px] w-2 h-2 rounded-full border-2 border-paper-2"
                      style={{ background: color }} />
                <div className="text-[11px] text-ink-3 tabular-nums">
                  {new Date(entry.at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}
                  {entry.outlet && ` · ${entry.outlet}`}
                </div>
                <a href={entry.link} target="_blank" rel="noreferrer"
                   className="text-[13px] leading-snug">{entry.title}</a>
              </li>
            ))}
          </ol>
        )}
      </div>
    </article>
  );
}

export default function Ongoing({ stories }) {
  if (!stories.length) return null;

  return (
    <section className="px-5 pt-8">
      <div className="flex items-baseline gap-2 mb-1">
        <h2 className="font-display text-[22px]">עדיין מתגלגל</h2>
      </div>
      <p className="text-[13px] text-ink-3 mb-4 leading-relaxed">
        לא קרה היום, אבל עדיין מדברים על זה.
      </p>

      <div className="flex flex-col gap-3">
        {stories.map(story => <Thread key={story.id} story={story} />)}
      </div>
    </section>
  );
}
