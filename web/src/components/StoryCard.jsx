import { TOPIC_LABELS, timeAgo, topicColor, ordinal, uniqueOutlets } from '../lib.js';

export default function StoryCard({ story, index }) {
  const color = topicColor(story.topics);
  const outlets = uniqueOutlets(story.sources);
  const lead = story.sources[0];

  return (
    <article>
      <div className="px-5 pt-6">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-extrabold tracking-[0.08em] text-white px-2.5 py-1 rounded-[2px]"
                style={{ background: color }}>
            {TOPIC_LABELS[story.topics[0]] || 'חדשות'}
          </span>
          <span className="numeral">{ordinal(index + 1)}</span>
          <span className="text-xs text-ink-3 mr-auto">{timeAgo(story.publishedAt)}</span>
        </div>

        <h2 className="font-display text-[27px] leading-[1.24] mt-3 text-balance">
          <a href={lead.link} target="_blank" rel="noreferrer">{story.title}</a>
        </h2>

        <div className="flex gap-3 items-start mt-3.5">
          {story.image && (
            <img src={story.image} alt="" loading="lazy"
                 className="w-[118px] aspect-square object-cover rounded-[2px] shrink-0" />
          )}
          {story.summary && (
            // נגזר לגובה התמונה: הכרטיס נשאר קומפקטי והכותרת נשארת העוגן
            <p className="text-[14px] leading-[1.62] text-ink-2 line-clamp-5">{story.summary}</p>
          )}
        </div>

        {story.why && (
          <p className="mt-3.5 text-[14px] leading-[1.6] pr-3 border-r-[3px]" style={{ borderColor: color }}>
            <span className="font-extrabold">למה זה חשוב · </span>
            <span className="text-ink-2">{story.why}</span>
          </p>
        )}

        {story.rolling && (
          // סיפור מתגלגל שנכנס לתקציר אינו חוזר בסעיף התחתון, ולכן הסימון חייב להיות כאן
          <details className="mt-3">
            <summary className="text-xs cursor-pointer list-none font-bold" style={{ color }}>
              נמשך {Math.round(story.rolling.ageDays)} ימים · איך הגענו לכאן ▾
            </summary>
            <ol className="mt-2 pr-3 border-r border-rule flex flex-col gap-1.5">
              {story.rolling.timeline.map(entry => (
                <li key={entry.link} className="text-[13px] leading-snug">
                  <span className="text-ink-3 tabular-nums">
                    {new Date(entry.at).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                  </span>{' '}
                  <a href={entry.link} target="_blank" rel="noreferrer" className="text-ink-2">{entry.title}</a>
                </li>
              ))}
            </ol>
          </details>
        )}

        {story.background && (
          <details className="mt-3">
            <summary className="text-xs text-ink-3 cursor-pointer list-none">רקע למי שלא עקב ▾</summary>
            <p className="mt-1.5 text-[14px] leading-[1.6] text-ink-2">{story.background}</p>
          </details>
        )}

        <p className="mt-4 text-xs text-ink-3">
          {story.coverage > 1 ? 'דיווחו: ' : 'מקור: '}
          {outlets.map((s, i) => (
            <span key={s.name}>
              {i > 0 && ' · '}
              <a href={s.link} target="_blank" rel="noreferrer" className="font-bold text-ink">{s.name}</a>
            </span>
          ))}
        </p>
      </div>

      <div className="h-[3px] mx-5 mt-6" style={{ background: color }} />
    </article>
  );
}
