(() => {
  'use strict';
  const message = 'Buongiorno FLORA, sono interessato/a all’offerta di Natale per il gazebo fotovoltaico da circa 20 m², con 4,2 kW di pannelli, inverter ibrido Huawei, montaggio e pratiche comprese, a partire da 4.900,00 € + IVA. Vorrei essere ricontattato/a per saperne di più e valutare come procedere.\n\nNome e cognome: \nComune di installazione: \nNumero per essere richiamato/a: \nFascia oraria preferita: ';
  document.querySelectorAll('[data-natale-whatsapp]').forEach(link => {
    link.href = `https://wa.me/3907611762375?text=${encodeURIComponent(message)}`;
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('[data-natale-whatsapp]');
    if (!link || !window.gtag || window['ga-disable-G-DRMG920SRK'] !== false) return;
    window.gtag('event', 'christmas_whatsapp_click', {offer_name: 'gazebo_natale_2026', transport_type: 'beacon'});
  });
  if (!document.querySelector('.xmas-banner') || typeof HTMLDialogElement === 'undefined') return;
  const key = 'flora_natale_2026_closed';
  let dismissed = false;
  try { dismissed = sessionStorage.getItem(key) === '1'; } catch (_) {}
  if (dismissed) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'xmas-modal';
  dialog.setAttribute('aria-labelledby', 'xmas-modal-title');
  dialog.innerHTML = `<button type="button" class="xmas-close" aria-label="Chiudi offerta di Natale" autofocus>×</button>
    <div class="xmas-modal-layout"><div class="xmas-modal-photo"><img src="gazebo-natale.webp" alt="Illustrazione del gazebo in legno con copertura fotovoltaica"><span>Immagine illustrativa</span></div>
    <div class="xmas-modal-copy"><span class="xmas-kicker">✦ UN NATALE PIENO DI ENERGIA</span><h2 id="xmas-modal-title">È arrivata<br>l’offerta <em>di Natale.</em></h2>
    <p class="xmas-modal-intro">Un regalo per la tua casa.<br>Energia per il tuo futuro.</p><h3>Gazebo fotovoltaico · circa 20 m²</h3>
    <ul class="xmas-checks"><li>4,2 kW di pannelli fotovoltaici</li><li>Inverter ibrido Huawei</li><li>Montaggio e pratiche comprese</li></ul>
    <div class="xmas-price"><span>A partire da soli</span><strong>4.900,00 € <small>+ IVA</small></strong></div>
    <a class="xmas-button" href="offerta-natale.html">Clicca e scopri di più <span aria-hidden="true">→</span></a></div></div>`;
  document.body.appendChild(dialog);
  const lights = document.createElement('div');
  lights.className = 'xmas-lights';
  lights.setAttribute('aria-hidden', 'true');
  for (const side of ['top', 'bottom', 'left', 'right']) {
    const count = (side === 'top' || side === 'bottom') ? 19 : 13;
    for (let i = 0; i < count; i++) {
      const bulb = document.createElement('i');
      bulb.className = `xmas-bulb xmas-bulb-${side}`;
      bulb.style.setProperty('--position', `${5 + i * 90 / (count - 1)}%`);
      bulb.style.setProperty('--bulb-color', ['#ffe7a2', '#ffbca2', '#d7eeb2'][i % 3]);
      bulb.style.setProperty('--bulb-delay', `${(i % 5) * -.7}s`);
      lights.appendChild(bulb);
    }
  }
  dialog.appendChild(lights);
  let previousFocus, timer;
  let previousOverflow = '';
  const privacyBusy = () => document.querySelector('#cookieBanner.visible, #cookieModal.open');
  const close = (remember = true) => {
    if (remember) {
      dismissed = true;
      try { sessionStorage.setItem(key, '1'); } catch (_) {}
    }
    if (!dialog.open) return;
    dialog.close();
    document.body.style.overflow = previousOverflow;
    if (previousFocus && previousFocus.isConnected) previousFocus.focus({preventScroll:true});
  };
  const maybeShow = () => {
    clearTimeout(timer);
    if (privacyBusy()) { if (dialog.open) close(false); return; }
    if (dismissed || dialog.open) return;
    timer = setTimeout(() => {
      if (dismissed || dialog.open || privacyBusy()) return;
      previousFocus = document.activeElement;
      previousOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    }, 700);
  };
  dialog.querySelector('.xmas-close').addEventListener('click', () => close());
  dialog.querySelector('a').addEventListener('click', () => close());
  dialog.addEventListener('cancel', event => {event.preventDefault(); close();});
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
  });
  const observer = new MutationObserver(maybeShow);
  document.querySelectorAll('#cookieBanner, #cookieModal').forEach(el => observer.observe(el, {attributes:true, attributeFilter:['class']}));
  maybeShow();
})();
