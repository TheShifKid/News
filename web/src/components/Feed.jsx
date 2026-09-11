import { useState } from 'react';
import { TOPIC_LABELS, TOPIC_COLORS, timeAgo, topicColor, uniqueOutlets } from '../lib.js';

export default function Feed({ stories }) {
  const [topic, setTopic] = useState('all');
  const topics = ['all', ...new Set(stories.flatMap(s => s.topics))];
  const shown = topic === 'all' ? stories : stories.filter(s => s.topics.includes(topic));

  return (
    <div className="h-full overflow-y-auto no-bar">
      <div className="sticky top-0 z-10 bg-paper border-b border-rule">
        <div className="flex gap-2 overflow-x-auto no-bar px-5 py-3">
          {topics.map(t => {
            const active = topic === t;
            const color = t === 'all' ? '#0b0b0c' : TOPIC_COLORS[t];
            return (
              <button key={t} onClick={() => setTopic(t)}
                      className="shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-[2px] border transition-colors"
                      style={active
                        ? { background: color, borderColor: color, color: '#fff' }
                        : { borderColor: '#e6e5e2', color: '#82858c' }}>
                {t === 'all' ? 'הכול' : TOPIC_LABELS[t] || t}
              </button>
            );
          })}
        </div>
      </div>

      <ul>
        {shown.map(s => (
          <li key={s.id} className="border-b border-rule">
            <a href={s.sources[0].link} target="_blank" rel="noreferrer"
               className="flex gap-3 px-5 py-4">
              <span className="w-1 shrink-0 rounded-full" style={{ background: topicColor(s.topics) }} />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold leading-snug text-[15px] text-balance">{s.title}</h3>
                {s.summary && <p className="mt-1 text-[13px] leading-relaxed text-ink-3 line-clamp-2">{s.summary}</p>}
                <p className="mt-1.5 text-[11px] text-ink-3">
                  {uniqueOutlets(s.sources)[0].name} · {timeAgo(s.publishedAt)}
                  {s.coverage > 1 && ` · ${s.coverage} מקורות`}
                </p>
              </div>
              {s.image && <img src={s.image} alt="" loading="lazy"
                               className="w-[76px] h-[76px] object-cover rounded-[2px] shrink-0" />}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
