(function(){
  const sun='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>';
  const moon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2z"></path></svg>';
  const saved=localStorage.getItem('katos_theme')||'light';
  document.documentElement.setAttribute('data-theme',saved);
  function paint(){document.querySelectorAll('[data-theme-toggle]').forEach(btn=>{const dark=document.documentElement.getAttribute('data-theme')==='dark';btn.innerHTML=dark?sun:moon;btn.setAttribute('aria-label',dark?'Ativar tema claro':'Ativar tema escuro');btn.setAttribute('title',dark?'Tema claro':'Tema escuro');});}
  document.addEventListener('click',e=>{const btn=e.target.closest('[data-theme-toggle]');if(!btn)return;const current=document.documentElement.getAttribute('data-theme');const next=current==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',next);localStorage.setItem('katos_theme',next);paint();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',paint);else paint();
})();
