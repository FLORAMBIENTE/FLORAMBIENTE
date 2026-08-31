(function () {
  const STORAGE_KEY = "flora_cookie_consent";
  const CONSENT_DURATION = 180 * 24 * 60 * 60 * 1000;

  const bannerMarkup = `
    <section class="cookie-banner" id="cookieBanner" aria-label="Preferenze cookie">
      <div class="cookie-banner-inner">
        <div>
          <h2>La tua privacy è importante</h2>
          <p>
            Utilizziamo cookie tecnici necessari al funzionamento del sito e, solo con il tuo consenso,
            eventuali cookie analitici o di marketing. Puoi accettare, rifiutare o personalizzare le preferenze.
            Consulta la <a class="legal-link" href="cookie-policy.html">Cookie Policy</a>.
          </p>
        </div>
        <div class="cookie-actions">
          <button class="cookie-btn" type="button" data-cookie-action="settings">Impostazioni</button>
          <button class="cookie-btn" type="button" data-cookie-action="reject">Rifiuta</button>
          <button class="cookie-btn primary" type="button" data-cookie-action="accept">Accetta tutti</button>
        </div>
      </div>
    </section>
    <div class="cookie-modal" id="cookieModal" role="dialog" aria-modal="true" aria-labelledby="cookieModalTitle" aria-hidden="true">
      <div class="cookie-panel">
        <div class="cookie-panel-head">
          <div>
            <h2 id="cookieModalTitle">Impostazioni cookie</h2>
            <p>Scegli quali categorie autorizzare. I cookie necessari non possono essere disattivati.</p>
          </div>
          <button class="cookie-close" type="button" data-cookie-action="close" aria-label="Chiudi impostazioni">×</button>
        </div>
        <div class="cookie-option">
          <div><strong>Cookie necessari</strong><p>Memorizzano le preferenze privacy e consentono le funzioni essenziali del sito.</p></div>
          <input class="cookie-switch" type="checkbox" checked disabled aria-label="Cookie necessari sempre attivi">
        </div>
        <div class="cookie-option">
          <div><strong>Cookie analitici</strong><p>Potranno essere usati per comprendere, in forma aggregata, come viene visitato il sito.</p></div>
          <input class="cookie-switch" id="cookieAnalytics" type="checkbox" aria-label="Autorizza cookie analitici">
        </div>
        <div class="cookie-option">
          <div><strong>Cookie di marketing</strong><p>Potranno essere usati per contenuti personalizzati e misurazione delle campagne.</p></div>
          <input class="cookie-switch" id="cookieMarketing" type="checkbox" aria-label="Autorizza cookie di marketing">
        </div>
        <p>Attualmente il sito non installa strumenti analitici o pubblicitari di terze parti. Le preferenze sono predisposte per eventuali integrazioni future.</p>
        <div class="cookie-panel-actions">
          <button class="cookie-btn" type="button" data-cookie-action="reject">Rifiuta non necessari</button>
          <button class="cookie-btn primary" type="button" data-cookie-action="save">Salva preferenze</button>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML("beforeend", bannerMarkup);

  const banner = document.getElementById("cookieBanner");
  const modal = document.getElementById("cookieModal");
  const analytics = document.getElementById("cookieAnalytics");
  const marketing = document.getElementById("cookieMarketing");

  function readConsent() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || !saved.date || Date.now() - saved.date > CONSENT_DURATION) return null;
      return saved;
    } catch (_) {
      return null;
    }
  }

  function storeConsent(preferences) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        necessary: true,
        analytics: Boolean(preferences.analytics),
        marketing: Boolean(preferences.marketing),
        date: Date.now()
      }));
    } catch (_) {
      /* La navigazione resta disponibile anche se il browser blocca la memoria locale. */
    }
    banner.classList.remove("visible");
    closeSettings();
  }

  function openSettings() {
    const saved = readConsent();
    analytics.checked = Boolean(saved && saved.analytics);
    marketing.checked = Boolean(saved && saved.marketing);
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeSettings() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  document.addEventListener("click", function (event) {
    const trigger = event.target.closest("[data-cookie-action]");
    if (!trigger) return;
    const action = trigger.dataset.cookieAction;
    if (action === "accept") storeConsent({ analytics: true, marketing: true });
    if (action === "reject") storeConsent({ analytics: false, marketing: false });
    if (action === "save") storeConsent({ analytics: analytics.checked, marketing: marketing.checked });
    if (action === "settings") openSettings();
    if (action === "close") closeSettings();
  });

  modal.addEventListener("click", function (event) {
    if (event.target === modal) closeSettings();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && modal.classList.contains("open")) closeSettings();
  });

  if (!readConsent()) banner.classList.add("visible");
})();
