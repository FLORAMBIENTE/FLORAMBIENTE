(() => {
  'use strict';
  const destination = '3907611762375';
  const forms = new Map();
  const config = {
    preventivo: {
      customer:'tipoCliente', fullName:'nome', phone:'telefono', email:'email',
      city:'comune', address:'indirizzo', notes:'note', privacy:'privacyConsent',
      building:'edificio', consumption:'consumo', battery:'batterie', service:'servizio'
    },
    natale: {
      customer:'nataleTipoCliente', firstName:'nataleNome', lastName:'nataleCognome',
      phone:'nataleTelefono', email:'nataleEmail', city:'nataleComune',
      address:'nataleIndirizzo', notes:'nataleNote', privacy:'natalePrivacy'
    }
  };
  function control(form, key) {
    const id = config[form.dataset.whatsappForm][key];
    return id ? form.querySelector('#' + id) : null;
  }
  function value(form, key) { return control(form, key).value.trim(); }
  function validateField(input) {
    input.setCustomValidity('');
    if (!input.required || input.disabled) return true;
    if (input.type === 'checkbox') {
      if (!input.checked) input.setCustomValidity('Seleziona la dichiarazione di lettura della privacy per continuare.');
    } else {
      const text = input.value.trim();
      if (!text) input.setCustomValidity('Compila questo campo.');
      else if (input.tagName === 'SELECT' && !Array.from(input.options).some(option => option.value === text && option.value !== '')) {
        input.setCustomValidity('Seleziona una delle opzioni disponibili.');
      } else if (input.type === 'tel') {
        const digits = text.replace(/\D/g, '');
        if (!/^[+\d\s()./-]+$/.test(text) || digits.length < 7 || digits.length > 15) {
          input.setCustomValidity('Inserisci un numero di telefono valido, con almeno 7 cifre.');
        }
      } else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
        input.setCustomValidity('Inserisci un indirizzo email completo, ad esempio nome@email.it.');
      } else if (input.minLength > 0 && text.length < input.minLength) {
        input.setCustomValidity(`Inserisci almeno ${input.minLength} caratteri.`);
      }
    }
    if (input.maxLength > 0 && input.value.length > input.maxLength) input.setCustomValidity('Il testo inserito è troppo lungo.');
    return input.validity.valid;
  }
  function refresh(form) {
    const fields = Array.from(form.querySelectorAll('input, select, textarea'));
    let valid = true;
    fields.forEach(input => {
      const fieldValid = validateField(input);
      valid = fieldValid && valid;
      if (input.dataset.touched === 'true') {
        input.setAttribute('aria-invalid', String(!fieldValid));
        const wrapper = input.closest('.field, .request-field');
        if (wrapper) {
          let error = wrapper.querySelector('.request-field-error');
          if (!error) {
            error = document.createElement('span');
            error.className = 'request-field-error';
            error.id = input.id + 'Error';
            wrapper.appendChild(error);
            const descriptions = new Set((input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
            descriptions.add(error.id);
            input.setAttribute('aria-describedby', Array.from(descriptions).join(' '));
          }
          error.textContent = fieldValid ? '' : input.validationMessage;
          error.hidden = fieldValid;
        }
      }
    });
    form.querySelector('button[type="submit"]').disabled = !valid;
    const status = form.querySelector('.request-form-status');
    if (status) {
      const text = valid
        ? 'Modulo completo: puoi aprire WhatsApp con la richiesta già compilata.'
        : 'Completa tutti i campi obbligatori e seleziona la privacy per continuare.';
      if (status.textContent !== text) status.textContent = text;
    }
    return valid;
  }
  function message(form) {
    const christmas = form.dataset.whatsappForm === 'natale';
    const details = christmas ? [
      'Buongiorno FLORA, sono interessato/a all’offerta di Natale per il gazebo fotovoltaico e vorrei essere ricontattato/a per saperne di più e valutare come procedere.',
      '', 'OFFERTA DI NATALE', '- Gazebo fotovoltaico di circa 20 m²', '- Pannelli fotovoltaici: 4,2 kW',
      '- Inverter ibrido Huawei', '- Montaggio e pratiche comprese', '- A partire da 4.900,00 € + IVA'
    ] : ['Ciao FLORA, vorrei richiedere un preventivo gratuito e senza impegno.'];
    details.push('', 'DATI CLIENTE', `- Tipologia cliente: ${value(form, 'customer')}`);
    if (christmas) details.push(`- Nome: ${value(form, 'firstName')}`, `- Cognome: ${value(form, 'lastName')}`);
    else details.push(`- Nome e cognome: ${value(form, 'fullName')}`);
    details.push(`- Telefono: ${value(form, 'phone')}`, `- Email: ${value(form, 'email')}`,
      '', 'LUOGO DI INSTALLAZIONE', `- Comune / città: ${value(form, 'city')}`, `- Indirizzo: ${value(form, 'address')}`);
    if (!christmas) details.push('', 'RICHIESTA', `- Servizio richiesto: ${value(form, 'service')}`,
      `- Tipologia edificio: ${value(form, 'building')}`, `- Consumo energetico annuale medio: ${value(form, 'consumption')}`,
      `- Batterie di accumulo: ${value(form, 'battery')}`);
    details.push('', 'NOTE', value(form, 'notes') || 'Nessuna nota aggiuntiva.', '',
      'PRIVACY', 'Dichiaro di aver letto la Privacy Policy e autorizzo il trattamento dei dati necessario per rispondere alla mia richiesta.', '', 'Grazie.');
    return details.join('\n');
  }
  document.querySelectorAll('form[data-whatsapp-form]').forEach(form => {
    if (!config[form.dataset.whatsappForm]) return;
    forms.set(form, true);
    for (const eventName of ['input', 'change']) form.addEventListener(eventName, () => refresh(form));
    form.addEventListener('focusout', event => {
      if (!event.target.matches('input, select, textarea')) return;
      event.target.dataset.touched = 'true';
      refresh(form);
    });
    form.addEventListener('reset', () => setTimeout(() => {
      form.querySelectorAll('[data-touched]').forEach(input => { delete input.dataset.touched; input.removeAttribute('aria-invalid'); });
      form.querySelectorAll('.request-field-error').forEach(error => { error.hidden = true; error.textContent = ''; });
      refresh(form);
    }, 0));
    refresh(form);
  });
  // Capture validation before analytics and before any form-level listeners.
  document.addEventListener('submit', event => {
    const form = event.target;
    if (!forms.has(form)) return;
    event.preventDefault();
    if (!refresh(form) || !form.checkValidity()) {
      event.stopImmediatePropagation();
      form.querySelectorAll('[required]').forEach(input => { input.dataset.touched = 'true'; });
      refresh(form);
      form.reportValidity();
      return;
    }
    const url = `https://wa.me/${destination}?text=${encodeURIComponent(message(form))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    if (form.dataset.whatsappForm === 'natale' && window.gtag && window['ga-disable-G-DRMG920SRK'] === false) {
      // The user must still press Send in WhatsApp: this is not a confirmed lead.
      window.gtag('event', 'christmas_whatsapp_click', {offer_name:'gazebo_natale_2026', transport_type:'beacon'});
    }
  }, true);
  window.addEventListener('pageshow', () => forms.forEach((_, form) => refresh(form)));
})();
