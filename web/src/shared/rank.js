// ציון חשיבות: כמה מקורות סיקרו, כמה טרי, וכמה הנושא מעניין את המשתמש.
export function score(story, prefs) {
  const { topicWeights, leanBoost } = prefs;

  // סיקור רוחבי הוא האות החזק ביותר לחשיבות. לוגריתמי כדי ש-5 מקורות לא יכריעו הכל.
  const coverage = Math.log2(1 + story.coverage) / Math.log2(6);

  const ageHours = (Date.now() - new Date(story.publishedAt)) / 3600000;
  const freshness = Math.exp(-ageHours / 10);

  const topic = Math.max(...story.topics.map(t => topicWeights[t] ?? 0.5));

  const lean = Math.max(...story.sources.map(s => leanBoost[s.lean] ?? 0));

  // דעה יורדת בדירוג התקציר היומי — התקציר נועד לעובדות, לא לפרשנות
  const opinionPenalty = story.isOpinion ? 0.75 : 1;

  const total = (coverage * 0.4 + freshness * 0.3 + topic * 0.3 + lean) * opinionPenalty;
  return { ...story, score: Number(total.toFixed(4)) };
}

export function rank(stories, prefs) {
  return stories.map(s => score(s, prefs)).sort((a, b) => b.score - a.score);
}
