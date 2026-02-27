// ---------- Theme (Light / Dark) ----------
// IIFE runs immediately (before DOMContentLoaded) to prevent flash of wrong theme
(function(){
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.dataset.theme = saved;
})();

function getTheme(){ return document.documentElement.dataset.theme || 'dark'; }

function setTheme(theme){
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);
  _syncThemeBtn();
}

function toggleTheme(){ setTheme(getTheme() === 'light' ? 'dark' : 'light'); }

function _syncThemeBtn(){
  const btn = document.getElementById('themeToggleBtn');
  if(btn) btn.textContent = getTheme() === 'light' ? '🌙' : '☀️';
}

document.addEventListener('DOMContentLoaded', _syncThemeBtn);
