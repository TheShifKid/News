// העשרה אופציונלית: "למה זה חשוב", "רקע" וחידון יומי.
// עובד רק אם הוגדר GEMINI_API_KEY. בלעדיו האפליקציה פשוט מדלגת על השלב.
const MODEL = 'gemini-2.0-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export const enrichmentEnabled = () => Boolean(process.env.GEMINI_API_KEY);

async function ask(prompt) {
  const res = await fetch(`${ENDPOINT}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, responseMimeType: 'application/json' }
    })
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('תשובה ריקה מ-Gemini');
  return JSON.parse(text);
}

const TONE = `הטון: ענייני וישיר, עם קורטוב אירוניה כשמתאים. בלי פאתוס, בלי סיסמאות.
בנושאי ביטחון, מלחמה ואסונות — ענייני בלבד, בלי הומור.`;

export async function enrichStories(stories) {
  if (!enrichmentEnabled() || !stories.length) return stories;

  const list = stories.map((s, i) => `${i + 1}. ${s.title}\n${s.summary}`).join('\n\n');
  const prompt = `אתה עורך חדשות ישראלי. לכל ידיעה כתוב בעברית:
"why" — משפט אחד: למה זה חשוב לקורא.
"background" — משפט אחד או שניים: רקע למי שלא עקב אחרי הסיפור.
${TONE}
אל תמציא עובדות שאינן בטקסט. אם חסר מידע, כתוב רקע כללי וזהיר.

החזר JSON: {"items":[{"i":1,"why":"...","background":"..."}]}

הידיעות:
${list}`;

  try {
    const out = await ask(prompt);
    const byIndex = new Map((out.items || []).map(x => [x.i, x]));
    return stories.map((s, i) => ({ ...s, ...pick(byIndex.get(i + 1)) }));
  } catch (err) {
    console.warn('[enrich] דילוג על העשרה:', err.message);
    return stories;
  }
}

function pick(x) {
  return x ? { why: x.why, background: x.background } : {};
}

export async function buildQuiz(stories) {
  if (!enrichmentEnabled() || stories.length < 3) return null;

  const list = stories.map((s, i) => `${i + 1}. ${s.title} — ${s.summary}`).join('\n');
  const prompt = `בנה חידון קצר של 3 שאלות על החדשות הבאות, בעברית.
כל שאלה עם 3 תשובות אפשריות ותשובה נכונה אחת שנובעת ישירות מהטקסט.
${TONE}

החזר JSON: {"questions":[{"q":"...","options":["...","...","..."],"answer":0}]}

החדשות:
${list}`;

  try {
    const out = await ask(prompt);
    return Array.isArray(out.questions) && out.questions.length ? out.questions : null;
  } catch (err) {
    console.warn('[quiz] דילוג על חידון:', err.message);
    return null;
  }
}
