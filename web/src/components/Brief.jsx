import StoryCard from './StoryCard.jsx';
import { markDone } from '../streak.js';
import { useEffect, useRef } from 'react';

export default function Brief({ stories, onDone }) {
  const end = useRef(null);

  // הרצף נספר כשמגיעים לסוף התקציר, לא כשפותחים את האפליקציה
  useEffect(() => {
    if (!end.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && onDone?.(markDone()),
      { threshold: 0.6 }
    );
    observer.observe(end.current);
    return () => observer.disconnect();
  }, [onDone, stories.length]);

  if (!stories.length) {
    return <p className="px-5 py-10 text-ink-3">אין ידיעות להצגה. נסה לרוקן מילות מפתח בהגדרות.</p>;
  }

  return (
    <div className="h-full overflow-y-auto no-bar pb-8">
      {stories.map((s, i) => <StoryCard key={s.id} story={s} index={i} />)}

      <div ref={end} className="px-5 pt-8 pb-4 text-center">
        <p className="font-display text-2xl">זהו להיום</p>
        <p className="text-sm text-ink-3 mt-1.5">
          קראת {stories.length} סיפורים. יש עוד בלשונית "הכול".
        </p>
      </div>
    </div>
  );
}
