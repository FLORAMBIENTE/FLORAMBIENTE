(function () {
  const STORAGE_KEY = "flora_cookie_consent";
  const CONSENT_DURATION = 180 * 24 * 60 * 60 * 1000;
  const CONSENT_VERSION = 2;
  const MEASUREMENT_ID = "G-DRMG920SRK";
  let analyticsAllowed = false;
  let analyticsLoaded = false;
  const disableKey = "ga-disable-" + MEASUREMENT_ID;
  window[disableKey] = true;

  function applyAnalyticsConsent(allowed) {
    analyticsAllowed = Boolean(allowed);
    window[disableKey] = !analyticsAllowed;
    if (!analyticsAllowed) {
      document.cookie.split(";").forEach(function (entry) {
        const name = entry.split("=")[0].trim();
        if (!/^_ga(?:_|$)/.test(name)) return;
        const parts = location.hostname.split(".");
        document.cookie = name + "=; Max-Age=0; path=/";
        for (let i = 0; i < parts.length - 1; i++) {
          document.cookie = name + "=; Max-Age=0; path=/; domain=." + parts.slice(i).join(".");
        }
      });
      // Reload after revocation to unload Google's timers and listeners entirely.
      if (analyticsLoaded) location.reload();
      return;
    }
    if (analyticsLoaded) return;
    analyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", {
      analytics_storage: "granted", ad_storage: "denied",
      ad_user_data: "denied", ad_personalization: "denied"
    });
    window.gtag("js", new Date());
    let referrer = "";
    try { referrer = new URL(document.referrer).origin; } catch (_) {}
    window.gtag("config", MEASUREMENT_ID, {
      allow_google_signals: false, allow_ad_personalization_signals: false,
      cookie_expires: 15552000, cookie_update: false,
      page_location: location.origin + location.pathname,
      page_referrer: referrer
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + MEASUREMENT_ID;
    document.head.appendChild(script);
  }

  function track(name, parameters) {
    if (!analyticsAllowed || !window.gtag) return;
    window.gtag("event", name, parameters || {});
  }

  document.addEventListener("click", function (event) {
    const service = event.target.closest("[data-service]");
    const services = ["edilizia", "elettrico", "clima", "verde", "microeolico", "post-incidente", "monitoraggio", "energia"];
    if (service && services.includes(service.dataset.service)) {
      track("service_open", { service_name: service.dataset.service });
    }
    const link = event.target.closest("a[href]");
    if (!link) return;
    const href = link.getAttribute("href") || "";
    if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(href)) track("contact_click", { contact_method: "whatsapp" });
    else if (/^tel:/i.test(href)) track("contact_click", { contact_method: "phone" });
    else if (/^mailto:/i.test(href)) track("contact_click", { contact_method: "email" });
  });
  document.addEventListener("submit", function (event) {
    const form = event.target;
    if (!form.checkValidity()) return;
    if (form.id === "solarSimulatorForm") track("simulator_use");
    if (["quoteForm", "partnerForm"].includes(form.id)) {
      track("whatsapp_form_submit", { form_name: form.id === "quoteForm" ? "preventivo" : "collaborazione" });
    }
  });
  let scrollTracked = false;
  window.addEventListener("scroll", function () {
    if (!analyticsAllowed || scrollTracked) return;
    const height = document.documentElement.scrollHeight;
    if (height > window.innerHeight && window.scrollY + window.innerHeight >= height * 0.9) {
      scrollTracked = true;
      track("scroll", { percent_scrolled: 90 });
    }
  }, { passive: true });

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
          <div><strong>Cookie analitici</strong><p>Google Analytics 4 misura visite e interazioni sul sito, solo con il tuo consenso.</p></div>
          <input class="cookie-switch" id="cookieAnalytics" type="checkbox" aria-label="Autorizza cookie analitici">
        </div>
        <div class="cookie-option">
          <div><strong>Cookie di marketing</strong><p>Potranno essere usati per contenuti personalizzati e misurazione delle campagne.</p></div>
          <input class="cookie-switch" id="cookieMarketing" type="checkbox" aria-label="Autorizza cookie di marketing">
        </div>
        <p>Google Analytics 4 viene caricato solo se autorizzi i cookie analitici. Non sono attivi strumenti pubblicitari. Puoi revocare il consenso dalle impostazioni cookie.</p>
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
      if (!saved || saved.version !== CONSENT_VERSION || !saved.date || Date.now() - saved.date > CONSENT_DURATION) return null;
      return saved;
    } catch (_) {
      return null;
    }
  }

  function storeConsent(preferences) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        necessary: true,
        version: CONSENT_VERSION,
        analytics: Boolean(preferences.analytics),
        marketing: Boolean(preferences.marketing),
        date: Date.now()
      }));
    } catch (_) {
      /* La navigazione resta disponibile anche se il browser blocca la memoria locale. */
    }
    banner.classList.remove("visible");
    closeSettings();
    applyAnalyticsConsent(preferences.analytics);
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
  applyAnalyticsConsent(Boolean(readConsent() && readConsent().analytics));
  window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEY || event.key === null) {
      const consent = readConsent();
      applyAnalyticsConsent(Boolean(consent && consent.analytics));
      if (!consent) banner.classList.add("visible");
    }
  });
})();
