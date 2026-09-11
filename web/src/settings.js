import defaults from './shared/defaults.json';

const KEY = 'news5.settings';

export function loadSettings() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch {}
  return {
    ...defaults,
    ...saved,
    blocklist: { ...defaults.blocklist, ...saved.blocklist },
    topicWeights: { ...defaults.topicWeights, ...saved.topicWeights }
  };
}

export function saveSettings(settings) {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch {}
  return settings;
}
