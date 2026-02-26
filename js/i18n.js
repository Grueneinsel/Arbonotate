// ---------- i18n ----------
const LANGS = {};
if(window.LANG_DE) LANGS['de'] = window.LANG_DE;
if(window.LANG_EN) LANGS['en'] = window.LANG_EN;

let _currentLang = localStorage.getItem('lang') || 'de';

// Translate key with optional {param} substitution
function t(key, params = {}){
  const dict = LANGS[_currentLang] || LANGS['de'] || {};
  const str  = dict[key] ?? LANGS['de']?.[key] ?? key;
  return str.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] !== undefined ? String(params[k]) : `{${k}}`
  );
}

// Plural suffix helper  →  tpSuffix(n, 'undo') → '' or 'e' / 's'
function tpSuffix(n, prefix){
  return n !== 1 ? t(prefix + '.steps') : t(prefix + '.step');
}

function getLang(){ return _currentLang; }

function setLang(code){
  if(!LANGS[code]) return;
  _currentLang = code;
  localStorage.setItem('lang', code);
  document.documentElement.lang = code;
  applyI18n();
  document.querySelectorAll('.langBtn').forEach(b =>
    b.classList.toggle('langBtnActive', b.dataset.lang === code)
  );
  // Reset popup so it is recreated with new language strings
  if(typeof _resetPopup === 'function') _resetPopup();
  // Rebuild label caches (e.g. "(empty)" label)
  if(typeof buildDeprelOptionsCache === 'function') buildDeprelOptionsCache();
  // Re-render dynamic UI
  if(typeof renderFiles      === 'function') renderFiles();
  if(typeof renderSentSelect === 'function') renderSentSelect();
  if(typeof renderSentence   === 'function') renderSentence();
  if(typeof _syncUndoBtns    === 'function') _syncUndoBtns();
  // If help modal is open, reload its content in new language
  if(typeof openHelp === 'function'){
    const modal = document.getElementById('helpModal');
    if(modal?.classList.contains('active')) openHelp();
  }
}

// Register additional language at runtime
function registerLang(code, dict){
  LANGS[code] = dict;
}

function applyI18n(){
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset['i18nTitle']);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.lang = _currentLang;
  applyI18n();
  document.querySelectorAll('.langBtn').forEach(b =>
    b.classList.toggle('langBtnActive', b.dataset.lang === _currentLang)
  );
});
