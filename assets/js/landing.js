(function(){
  const items=[...document.querySelectorAll('.fade-up')];
  if(!('IntersectionObserver' in window)){items.forEach(el=>el.classList.add('visible'));return;}
  const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');io.unobserve(entry.target);}}),{threshold:.12});
  items.forEach((el,i)=>{el.style.transitionDelay=`${Math.min(i%4,3)*70}ms`;io.observe(el);});
})();
