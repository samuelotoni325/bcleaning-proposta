(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const main = $('#main');
  const EN = main.dataset.lang === 'en';
  const T = (a, b) => (EN ? a : b);
  const PHONE = main.dataset.phone;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.__nav = window.__nav || (u => { location.href = u; });

  // Cabeçalho, etiqueta e menu
  const hd = $('#hd'), tag = $('.preview-tag');
  const onScroll = () => { hd.classList.toggle('solid', scrollY > 30); tag.classList.toggle('away', scrollY > innerHeight * .9); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = $('.burger'), mnav = $('#mnav');
  const setMenu = open => { burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? T('Close menu', 'Fechar menu') : T('Open menu', 'Abrir menu')); mnav.hidden = !open; document.body.classList.toggle('menu', open); document.body.style.overflow = open ? 'hidden' : ''; };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', mnav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !mnav.hidden) setMenu(false); });

  // Plaquinhas: três toques e o SMS pronto
  const forms = [['[data-quote]', 'svc'], ['[data-host]', 'freq']];
  forms.forEach(([sel, first]) => {
    const f = $(sel); if (!f) return;
    const hint = $('[data-hint]', f), baseHint = hint.textContent, townIn = $('.town-in', f);
    const picked = n => f.querySelector(`input[name="${n}"]:checked`);
    const swing = () => { if (reduce) return; f.classList.remove('swing'); void f.offsetWidth; f.classList.add('swing'); };
    const update = () => {
      const a = picked(first), s = picked('size'), t = picked('town');
      townIn.hidden = !(t && t.dataset.id === 'other');
      $$('.step', f).forEach((st, i) => st.classList.toggle('done', !![a, s, t][i]));
      const left = [a, s, t].filter(x => !x).length;
      f.classList.toggle('ready', !left);
      const fa = $('.f-a', f); if (fa) fa.textContent = left ? T(`${left} tap${left > 1 ? 's' : ''} to go`, `Falta${left > 1 ? 'm' : ''} ${left} toque${left > 1 ? 's' : ''}`) : '';
      hint.classList.remove('err');
      hint.textContent = left ? baseHint : T('Ready. Your messages app opens with the text written.', 'Pronto. O app de mensagens abre com o texto escrito.');
    };
    f.addEventListener('change', e => { if (e.target.type === 'radio') swing(); if (e.target.name === 'town' && e.target.dataset.id === 'other') setTimeout(() => townIn.focus(), 0); update(); });
    f.addEventListener('submit', e => {
      e.preventDefault();
      const a = picked(first), s = picked('size'), t = picked('town');
      const miss = !a ? 1 : !s ? 2 : !t ? 3 : 0;
      if (miss) { hint.textContent = T(`Pick step ${miss} first.`, `Escolha o passo ${miss} primeiro.`); hint.classList.add('err'); $$('.step', f)[miss - 1].querySelector('input').focus(); return; }
      const town = t.dataset.id === 'other' && townIn.value.trim() ? townIn.value.trim() : t.value;
      const times = (f.elements.times?.value || '').trim();
      const lines = first === 'svc' ? [
        T('Hi Bruna! I’d like a cleaning quote.', 'Oi, Bruna! Gostaria de um orçamento de limpeza.'),
        '',
        `${T('Cleaning', 'Limpeza')}: ${a.value}`,
        `${T('Home', 'Imóvel')}: ${s.value}`,
        `${T('Town', 'Cidade')}: ${town}`,
      ] : [
        T('Hi Bruna! I host a short-term rental and I’d like a turnover quote.', 'Oi, Bruna! Tenho um imóvel de aluguel por temporada e gostaria de um orçamento de limpeza entre hóspedes.'),
        '',
        `${T('How often', 'Frequência')}: ${a.value}`,
        `${T('Size', 'Tamanho')}: ${s.value}`,
        `${T('Town', 'Cidade')}: ${town}`,
        times ? `${T('Checkout / check-in', 'Saída / entrada')}: ${times}` : null,
      ];
      lines.push('', T('Sent from the BCleaning Services website', 'Enviado pelo site da BCleaning Services'));
      window.__nav(`sms:+${PHONE}?&body=${encodeURIComponent(lines.filter(x => x !== null).join('\n'))}`);
    });
    update();
  });

  // Linha do ritmo
  const chart = $('.rh-chart');
  if (chart) {
    const line = $('[data-line]', chart), area = $('[data-area]', chart), dots = $('[data-dots]', chart), note = $('[data-rh-note]');
    const X = d => 40 + d * 10, Y = L => 260 - Math.min(L, 16) * (230 / 16);
    const notes = {
      7: T('Weekly: it never gets far. A visit every seven days keeps the house close to fresh.', 'Semanal: nunca acumula muito. Uma visita a cada sete dias mantém a casa quase sempre limpa.'),
      14: T('Every two weeks: a bit more builds up between visits, with half as many visits.', 'A cada duas semanas: acumula um pouco mais entre as visitas, com metade das visitas.'),
      0: T('One deep clean: a big reset. Then life starts piling up again, so it pairs well with a regular rhythm.', 'Uma limpeza pesada: tudo zera de uma vez. Depois a vida volta a acumular, por isso combina com um ritmo fixo.'),
    };
    const draw = every => {
      const visits = every ? Array.from({ length: 8 }, (_, i) => 3 + i * every).filter(d => d <= 56) : [24];
      let L = 6, d = 0, p = `M${X(0)} ${Y(L)}`;
      for (d = 1; d <= 56; d++) { L++; p += ` L${X(d)} ${Y(L)}`; if (visits.includes(d)) { L = 0; p += ` L${X(d)} ${Y(0)}`; } }
      line.setAttribute('d', p);
      area.setAttribute('d', `${p} L${X(56)} 260 L${X(0)} 260 Z`);
      dots.innerHTML = visits.map(v => `<g class="rh-dot"><circle cx="${X(v)}" cy="260" r="11"/><text x="${X(v)}" y="264" text-anchor="middle">B</text></g>`).join('');
      note.textContent = notes[every];
      if (!reduce) { const len = line.getTotalLength(); line.style.transition = 'none'; line.style.strokeDasharray = len; line.style.strokeDashoffset = len; void line.getBoundingClientRect(); line.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)'; line.style.strokeDashoffset = 0; }
    };
    $$('[data-rh]').forEach(b => b.addEventListener('click', () => { $$('[data-rh]').forEach(x => x.setAttribute('aria-selected', x === b)); draw(+b.dataset.rh); }));
    draw(7);
  }

  // Livro de visitas: um carimbo por avaliação
  const book = $('.book');
  if (book) {
    $$('.stamp', book).forEach((s, i) => s.style.setProperty('--k', i));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { book.classList.add('in'); io.disconnect(); } }), { threshold: .3 });
    io.observe(book);
  }

  if (reduce || !window.gsap) {
    $$('.lr [data-out]').forEach(el => { el.style.opacity = 0; });
    $$('.tsteps li').forEach(l => l.classList.add('on'));
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  const lenis = new Lenis({ lerp: .12 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const el = $(a.getAttribute('href')); if (!el) return;
    e.preventDefault(); lenis.scrollTo(el, { offset: -76 });
  }));

  if ($('.hero')) {
    gsap.from('.hero .h1, .eyebrow, .hero-sub, .proof', { y: 30, opacity: 0, duration: 1, stagger: .08, ease: 'expo.out' });
    gsap.from('.hanger-wrap .hanger', { rotate: 9, y: -30, opacity: 0, duration: 1.6, delay: .2, ease: 'elastic.out(1, .45)', transformOrigin: '50% 0' });
  }

  // O visor: foco, arrumação e o clique
  const photo = $('.photo');
  if (photo) {
    const vf = $('.vf');
    const moved = $$('.lr .cl:not([data-out])');
    moved.forEach(el => { const [x, y, r] = el.dataset.m.split(',').map(Number); gsap.set(el, { x, y, rotation: r, transformOrigin: '50% 50%' }); });
    gsap.set(vf, { '--blur': '7px', '--sat': .7, '--fs': 1.35, '--fp': '0%' });
    const tl = gsap.timeline({ scrollTrigger: { trigger: photo, start: 'top top', end: 'bottom bottom', scrub: .5 } });
    tl.to(vf, { '--blur': '0px', '--sat': 1, '--fs': 1, '--fp': '100%', duration: 3, ease: 'none' }, 0)
      .to('.lr [data-out]', { opacity: 0, y: -14, duration: .5, stagger: .3 }, .3)
      .to(moved, { x: 0, y: 0, rotation: 0, duration: .8, stagger: .35, ease: 'power2.inOut' }, .4)
      .to('.lr .smudge', { opacity: 0, duration: .6 }, 1.6)
      .to('.vf-focus', { '--fc': '#7be0a0', duration: .1 }, 3)
      .to('.flash', { opacity: .95, duration: .08 }, 3.05)
      .to('.flash', { opacity: 0, duration: .5 }, 3.13)
      .to('.vf-shot', { opacity: 1, y: 0, duration: .3 }, 3.15)
      .to('.focus-hint', { opacity: 0, duration: .2 }, .1)
      .to({}, { duration: .5 });
  }

  // A cama sendo feita
  const bedTl = (root, trig) => {
    const q = s => $$(s, root);
    gsap.set(q('.pw.a'), { rotation: -14, x: -10, y: 14, transformOrigin: '50% 50%' });
    gsap.set(q('.pw.b'), { rotation: 12, x: 26, y: 30, transformOrigin: '50% 50%' });
    gsap.set(q('.towel'), { y: -90, opacity: 0 });
    const tl = gsap.timeline(trig);
    tl.to(q('.hand.m'), { rotation: 330, svgOrigin: '528 110', duration: 3, ease: 'none' }, 0)
      .to(q('.hand.h'), { rotation: 30, svgOrigin: '528 110', duration: 3, ease: 'none' }, 0)
      .to(q('.duvet-mess, .duvet-mess-l'), { opacity: 0, duration: .5 }, .7)
      .to(q('.pull'), { attr: { width: 340 }, duration: 1, ease: 'power2.inOut' }, .5)
      .to(q('.pw'), { rotation: 0, x: 0, y: 0, duration: .6, stagger: .15, ease: 'back.out(2)' }, 1.4)
      .to(q('.towel'), { y: 0, opacity: 1, duration: .45, stagger: .25, ease: 'bounce.out' }, 1.9);
    return tl;
  };
  const turn = $('.turn');
  if (turn) bedTl(turn, { scrollTrigger: { trigger: turn, start: 'top 75%', end: 'center 45%', scrub: .6 } });
  const tp = $('.turnpin');
  if (tp) {
    const steps = $$('.tsteps li');
    const tl = bedTl(tp, { scrollTrigger: { trigger: tp, start: 'top top', end: 'bottom bottom', scrub: .6 }, onUpdate: () => { const p = tl.progress(); steps.forEach((s, i) => s.classList.toggle('on', p >= [0.02, .3, .6, .92][i])); } });
  }

  $$('.sec-head, .rh-chart, .tell-list li, .book-page, .bruna-in > *').forEach(el => gsap.from(el, { y: 34, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));
  addEventListener('load', () => ScrollTrigger.refresh());
})();
