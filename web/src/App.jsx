import { useEffect, useMemo, useState } from 'react';
import Brief from './components/Brief.jsx';
import Ongoing from './components/Ongoing.jsx';
import Feed from './components/Feed.jsx';
import Quiz from './components/Quiz.jsx';
import Settings from './components/Settings.jsx';
import { loadSettings, saveSettings } from './settings.js';
import { rank } from './shared/rank.js';
import { applyBlocklist } from './shared/filter.js';
import { getStreak } from './streak.js';
import { schedule } from './notify.js';
import { hebrewDate } from './lib.js';

const TABS = [
  { id: 'brief', label: 'תקציר' },
  { id: 'feed', label: 'הכול' },
  { id: 'quiz', label: 'חידון' },
  { id: 'settings', label: 'הגדרות' }
];

export default function App() {
  const [tab, setTab] = useState('brief');
  const [feed, setFeed] = useState(null);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(loadSettings);
  const [streak, setStreak] = useState(getStreak);

  useEffect(() => {
    // הפיד הוא קובץ סטטי שנבנה בענן, ולכן אין כאן המתנה לשרת
    fetch('feed.json', { cache: 'no-cache' })
      .then(res => (res.ok ? res.json() : Promise.reject(new Error('לא נמצא קובץ החדשות'))))
      .then(setFeed)
      .catch(err => setError(err.message));

    schedule();
    navigator.serviceWorker?.register('sw.js').catch(() => {});
  }, []);

  const { brief, ongoing, rest } = useMemo(() => {
    if (!feed) return { brief: [], ongoing: [], rest: [] };
    const { kept } = applyBlocklist(feed.stories, settings.blocklist);
    const ranked = rank(kept, settings);
    // סיפור מתגלגל אינו "מה חדש היום", ולכן הוא עובר לסעיף שלו ולא נכנס לתקציר.
    // בכיוון ההפוך הסעיף נעלם בדיוק כשהסיפור המתגלגל חשוב מספיק כדי להידרג גבוה.
    const ongoing = ranked
      .filter(s => s.rolling)
      .sort((a, b) => b.rolling.articleCount - a.rolling.articleCount)
      .slice(0, 4);
    const brief = ranked.filter(s => !s.rolling).slice(0, settings.briefSize);
    const shown = new Set([...brief, ...ongoing].map(s => s.id));

    return { brief, ongoing, rest: ranked.filter(s => !shown.has(s.id)) };
  }, [feed, settings]);

  function updateSettings(next) {
    setSettings(saveSettings(next));
  }

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto bg-paper">
      <header className="px-5 pt-5 pb-3 flex items-baseline gap-2.5">
        <h1 className="font-display text-[26px] leading-none">חמש דקות</h1>
        {streak.days > 1 && (
          <span className="text-[11px] font-bold text-ink-3">{streak.days} ימים ברצף</span>
        )}
        <span className="text-[11px] text-ink-3 mr-auto">
          {feed ? hebrewDate(feed.updatedAt) : ''}
        </span>
      </header>

      <main className="flex-1 min-h-0">
        {error && (
          <div className="px-5 py-10">
            <p className="font-bold">{error}</p>
            <p className="text-sm text-ink-3 mt-2">
              אם זו הרצה מקומית, הרץ <code className="bg-paper-2 border border-rule px-1">npm run feed</code> כדי לייצר את קובץ החדשות.
            </p>
          </div>
        )}
        {!error && !feed && <p className="px-5 py-10 text-ink-3">טוען…</p>}

        {feed && tab === 'brief' && (
          <Brief stories={brief} onDone={setStreak}>
            <Ongoing stories={ongoing} />
          </Brief>
        )}
        {feed && tab === 'feed' && <Feed stories={rest} />}
        {feed && tab === 'quiz' && (
          feed.quiz
            ? <Quiz key={feed.updatedAt} questions={feed.quiz} onFinish={setStreak} />
            : <p className="px-5 py-10 text-sm text-ink-3 leading-relaxed">
                החידון דורש מפתח Gemini חינמי. ה-README מסביר איך להוסיף אותו — דקה של עבודה.
              </p>
        )}
        {tab === 'settings' && <Settings settings={settings} onChange={updateSettings} />}
      </main>

      <nav className="flex border-t border-rule bg-paper-2 pb-[env(safe-area-inset-bottom)]">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 py-3 text-[13px] border-t-2 -mt-px transition-colors ${
                    tab === t.id ? 'border-ink font-extrabold text-ink' : 'border-transparent text-ink-3'}`}>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
