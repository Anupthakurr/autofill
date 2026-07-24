// JobFill — Content Script
// Detects job application form fields and fills them with stored profile data.
// Supports standard HTML forms, React/Vue/Angular synthetic events, and dynamic DOM.

(function () {
  'use strict';

  // Prevent double-injection
  if (window.__jobFillInjected) return;
  window.__jobFillInjected = true;

  // ============================================================
  // FIELD DETECTION CONFIG
  // Each key maps to the profile field name.
  // patterns: regex tested against combined signal text
  // autocomplete: values to match against element's autocomplete attr
  // inputType: values to match against element's type attr
  // tagName: restrict to specific tag (e.g. 'TEXTAREA')
  // ============================================================

  const FIELD_CONFIG = {
    firstName: {
      patterns: [/first[\s._\-]?name/i, /\bfname\b/i, /given[\s._\-]?name/i, /\bforename\b/i],
      autocomplete: ['given-name'],
    },
    lastName: {
      patterns: [/last[\s._\-]?name/i, /\blname\b/i, /family[\s._\-]?name/i, /\bsurname\b/i],
      autocomplete: ['family-name'],
    },
    fullName: {
      patterns: [/^name$/i, /full[\s._\-]?name/i, /your[\s._\-]?name/i, /applicant[\s._\-]?name/i, /candidate[\s._\-]?name/i],
      autocomplete: ['name'],
    },
    email: {
      patterns: [/e[\s._\-]?mail/i, /email[\s._\-]?address/i],
      autocomplete: ['email'],
      inputType: ['email'],
    },
    phone: {
      patterns: [/\bphone\b/i, /\btelephone\b/i, /\bmobile\b/i, /\bcell\b/i, /contact[\s._\-]?number/i, /phone[\s._\-]?number/i],
      autocomplete: ['tel'],
      inputType: ['tel'],
    },
    city: {
      patterns: [/\bcity\b/i, /\btown\b/i, /\blocality\b/i],
      autocomplete: ['address-level2'],
    },
    state: {
      patterns: [/\bstate\b/i, /\bprovince\b/i, /\bregion\b/i],
      autocomplete: ['address-level1'],
    },
    country: {
      patterns: [/\bcountry\b/i, /\bnation\b/i],
      autocomplete: ['country', 'country-name'],
    },
    zipCode: {
      patterns: [/\bzip\b/i, /postal[\s._\-]?code/i, /\bpostcode\b/i],
      autocomplete: ['postal-code'],
    },
    linkedin: {
      patterns: [/\blinkedin\b/i, /linked[\s._\-]?in[\s._\-]?(url|profile|link|page)?/i],
    },
    github: {
      patterns: [/\bgithub\b/i, /git[\s._\-]?hub[\s._\-]?(url|profile|link)?/i],
    },
    portfolio: {
      patterns: [/\bportfolio\b/i, /personal[\s._\-]?(website|site|url)/i],
    },
    resumeUrl: {
      patterns: [/resume[\s._\-]?(url|link|drive|online)?/i, /\bcv[\s._\-]?(url|link)?\b/i, /upload[\s._\-]?(your[\s._\-]?)?(resume|cv)/i],
    },
    twitter: {
      patterns: [/\btwitter\b/i, /\bx\.com\b/i, /twitter[\s._\-]?(url|handle|profile)?/i],
    },
    stackoverflow: {
      patterns: [/stack[\s._\-]?overflow/i, /\bstackoverflow\b/i],
    },
    behance: {
      patterns: [/\bbehance\b/i],
    },
    dribbble: {
      patterns: [/\bdribbble\b/i],
    },
    medium: {
      patterns: [/\bmedium\b/i, /\bblog[\s._\-]?url\b/i],
    },
    currentRole: {
      patterns: [/current[\s._\-]?(role|title|position)/i, /job[\s._\-]?title/i, /^title$/i, /^position$/i],
    },
    yearsOfExperience: {
      patterns: [/years[\s._\-]?of[\s._\-]?experience/i, /experience[\s._\-]?years/i, /years[\s._\-]?experience/i, /how[\s._\-]?many[\s._\-]?years/i],
      inputType: ['number'],
    },
    desiredRole: {
      patterns: [/desired[\s._\-]?(role|position|job)/i, /applying[\s._\-]?for/i, /position[\s._\-]?applied/i, /role[\s._\-]?applying/i],
    },
    salary: {
      patterns: [/\bsalary\b/i, /\bcompensation\b/i, /expected[\s._\-]?salary/i, /desired[\s._\-]?salary/i, /salary[\s._\-]?expectation/i],
    },
    workAuthorization: {
      patterns: [/work[\s._\-]?auth/i, /authorized[\s._\-]?to[\s._\-]?work/i, /work[\s._\-]?permit/i, /visa[\s._\-]?status/i, /legally[\s._\-]?authorized/i, /\bsponsorship\b/i],
    },
    requireSponsorship: {
      patterns: [/require[\s._\-]?sponsorship/i, /need[\s._\-]?sponsorship/i, /visa[\s._\-]?sponsorship/i],
    },
    degree: {
      patterns: [/\bdegree\b/i, /education[\s._\-]?level/i, /highest[\s._\-]?degree/i, /\bqualification\b/i],
    },
    fieldOfStudy: {
      patterns: [/\bmajor\b/i, /field[\s._\-]?of[\s._\-]?study/i, /\bconcentration\b/i, /area[\s._\-]?of[\s._\-]?study/i, /\bspecialization\b/i, /\bdiscipline\b/i],
    },
    institution: {
      patterns: [/\buniversity\b/i, /\bcollege\b/i, /\binstitution\b/i, /^school$/i, /alma[\s._\-]?mater/i, /school[\s._\-]?name/i, /college[\s._\-]?name/i],
    },
    graduationYear: {
      patterns: [/graduation[\s._\-]?year/i, /grad[\s._\-]?year/i, /year[\s._\-]?of[\s._\-]?graduation/i, /expected[\s._\-]?graduation/i, /class[\s._\-]?of/i],
    },
    gpa: {
      patterns: [/\bgpa\b/i, /\bcgpa\b/i, /grade[\s._\-]?point/i, /cumulative[\s._\-]?gpa/i],
    },
    skills: {
      patterns: [/\bskills\b/i, /technical[\s._\-]?skills/i, /\btechnologies\b/i, /tech[\s._\-]?stack/i, /\bprogramming\b/i, /tools[\s._\-]?and[\s._\-]?technologies/i],
    },
    coverLetter: {
      patterns: [/cover[\s._\-]?letter/i, /\bmotivation\b/i, /personal[\s._\-]?statement/i, /why[\s._\-]?do[\s._\-]?you[\s._\-]?want/i, /additional[\s._\-]?info/i, /tell[\s._\-]?us[\s._\-]?about/i, /why[\s._\-]?are[\s._\-]?you[\s._\-]?interested/i],
      tagName: 'TEXTAREA',
    },
    summary: {
      patterns: [/\bsummary\b/i, /professional[\s._\-]?summary/i, /about[\s._\-]?me/i, /\bbio\b/i, /\bintroduction\b/i, /\bbackground\b/i],
      tagName: 'TEXTAREA',
    },
  };

  // ============================================================
  // SIGNAL EXTRACTION — collects all text hints from an element
  // ============================================================

  function getFieldSignals(element) {
    const parts = [];

    // Direct attributes (highest priority)
    if (element.name) parts.push(element.name);
    if (element.id) parts.push(element.id);
    if (element.placeholder) parts.push(element.placeholder);
    const ac = element.getAttribute('autocomplete');
    if (ac) parts.push(ac);
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) parts.push(ariaLabel);

    // Associated <label for="id">
    if (element.id) {
      try {
        const label = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
        if (label) parts.push(label.innerText || label.textContent);
      } catch (_) { /* CSS.escape may fail on weird IDs */ }
    }

    // Parent <label> element
    const parentLabel = element.closest('label');
    if (parentLabel) parts.push(parentLabel.innerText || parentLabel.textContent);

    // aria-labelledby references
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      labelledBy.split(/\s+/).forEach(id => {
        const el = document.getElementById(id);
        if (el) parts.push(el.innerText || el.textContent);
      });
    }

    // Walk up DOM (max 3 levels) for container labels / custom components
    let parent = element.parentElement;
    let depth = 0;
    while (parent && depth < 4) {
      const text = (parent.innerText || parent.textContent || '').trim();
      if (text && text.length < 120) parts.push(text);
      parent = parent.parentElement;
      depth++;
    }

    return parts.join(' ').toLowerCase();
  }

  // ============================================================
  // FIELD IDENTIFICATION
  // ============================================================

  function identifyField(element) {
    const skipTypes = ['hidden', 'submit', 'button', 'image', 'reset', 'file', 'checkbox', 'radio'];
    if (skipTypes.includes((element.type || '').toLowerCase())) return null;

    const signals = getFieldSignals(element);
    const tagName = element.tagName;
    const autocomplete = (element.getAttribute('autocomplete') || '').toLowerCase();
    const inputType = (element.type || '').toLowerCase();

    for (const [fieldKey, config] of Object.entries(FIELD_CONFIG)) {
      // Autocomplete attribute match (most reliable)
      if (config.autocomplete && config.autocomplete.includes(autocomplete)) {
        return fieldKey;
      }

      // Input type match (reliable for email/tel)
      if (config.inputType && config.inputType.includes(inputType)) {
        return fieldKey;
      }

      // Tag name constraint (e.g. TEXTAREA only)
      if (config.tagName && tagName !== config.tagName) {
        continue;
      }

      // Pattern match against combined signals
      for (const pattern of config.patterns) {
        if (pattern.test(signals)) {
          return fieldKey;
        }
      }
    }

    return null;
  }

  // ============================================================
  // RESOLVE VALUE FOR FIELD KEY
  // ============================================================

  function resolveValue(fieldKey, profile) {
    switch (fieldKey) {
      case 'fullName':
        return profile.fullName || [profile.firstName, profile.lastName].filter(Boolean).join(' ');
      case 'skills':
        return Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills || '');
      default:
        return profile[fieldKey] || '';
    }
  }

  // ============================================================
  // FILL A SINGLE ELEMENT
  // ============================================================

  function fillElement(element, value) {
    if (!value) return false;

    if (element.tagName === 'SELECT') {
      const valueLower = value.toLowerCase();
      const options = Array.from(element.options);
      const match = options.find(
        o => o.text.toLowerCase().includes(valueLower) || o.value.toLowerCase().includes(valueLower)
      );
      if (!match) return false;
      element.value = match.value;
    } else {
      // Use native setter so React's fiber reconciler sees the change
      const proto = element.tagName === 'TEXTAREA'
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

      if (nativeSetter) {
        nativeSetter.call(element, value);
      } else {
        element.value = value;
      }
    }

    // Dispatch events — covers React 16+/17/18, Vue 2/3, Angular, vanilla
    const eventsToFire = [
      new Event('input', { bubbles: true, cancelable: true }),
      new Event('change', { bubbles: true, cancelable: true }),
      new KeyboardEvent('keydown', { bubbles: true }),
      new KeyboardEvent('keyup', { bubbles: true }),
    ];
    eventsToFire.forEach(ev => element.dispatchEvent(ev));

    // Visual highlight
    element.classList.add('jf-filled');
    setTimeout(() => element.classList.remove('jf-filled'), 3000);

    return true;
  }

  // ============================================================
  // FILL ALL FORMS ON THE PAGE
  // ============================================================

  function fillForms(profile) {
    const selector = [
      'input:not([type="hidden"])',
      'input:not([type="submit"])',
      'input:not([type="button"])',
      'input:not([type="image"])',
      'input:not([type="reset"])',
      'input:not([type="file"])',
      'input:not([type="checkbox"])',
      'input:not([type="radio"])',
      'textarea',
      'select',
    ].join(', ');

    // Use a smarter selector
    const elements = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="reset"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]), textarea, select'
    );

    let filledCount = 0;
    elements.forEach(el => {
      const fieldKey = identifyField(el);
      if (fieldKey) {
        const value = resolveValue(fieldKey, profile);
        if (value && fillElement(el, value)) {
          filledCount++;
        }
      }
    });

    return filledCount;
  }

  // ============================================================
  // COUNT IDENTIFIABLE FIELDS
  // ============================================================

  function countIdentifiableFields() {
    const elements = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="reset"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]), textarea, select'
    );
    let count = 0;
    elements.forEach(el => { if (identifyField(el)) count++; });
    return count;
  }

  // ============================================================
  // FLOATING ACTION BUTTON
  // ============================================================

  let fab = null;
  let toast = null;

  function showFAB(fieldCount) {
    if (fab) {
      const countEl = fab.querySelector('.jf-fab-count');
      if (countEl) countEl.textContent = fieldCount;
      return;
    }

    fab = document.createElement('button');
    fab.id = 'jobfill-fab';
    fab.setAttribute('aria-label', 'JobFill: Auto-fill form fields');
    fab.innerHTML = `
      <span class="jf-fab-icon">✨</span>
      <span class="jf-fab-label">Auto-Fill</span>
      <span class="jf-fab-count">${fieldCount}</span>
    `;

    fab.addEventListener('click', async () => {
      const result = await chrome.storage.local.get('jobProfile');
      const profile = result.jobProfile;

      if (!profile || !Object.values(profile).some(v => v && (Array.isArray(v) ? v.length > 0 : String(v).trim()))) {
        showToast('⚠️ Profile is empty — click the JobFill icon in the toolbar to fill in your details!');
        return;
      }

      // Filling state
      fab.classList.add('jf-filling');
      fab.querySelector('.jf-fab-label').textContent = 'Filling...';
      fab.querySelector('.jf-fab-icon').textContent = '⚡';
      fab.disabled = true;

      const filled = fillForms(profile);

      setTimeout(() => {
        fab.classList.remove('jf-filling');
        fab.classList.add('jf-done');
        fab.querySelector('.jf-fab-icon').textContent = '✅';
        fab.querySelector('.jf-fab-label').textContent = 'Done!';
        fab.disabled = false;
        showToast(`✨ Filled ${filled} field${filled !== 1 ? 's' : ''} successfully!`);

        setTimeout(() => {
          fab.classList.remove('jf-done');
          fab.querySelector('.jf-fab-icon').textContent = '✨';
          fab.querySelector('.jf-fab-label').textContent = 'Auto-Fill';
        }, 4000);
      }, 400);
    });

    document.body.appendChild(fab);

    // Animate in after a frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => fab.classList.add('jf-visible'));
    });
  }

  function showToast(message) {
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'jobfill-toast';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('jf-toast-show');

    clearTimeout(toast.__hideTimer);
    toast.__hideTimer = setTimeout(() => {
      toast.classList.remove('jf-toast-show');
    }, 4000);
  }

  // ============================================================
  // FORM DETECTION
  // ============================================================

  function detectAndShowFAB() {
    const count = countIdentifiableFields();
    if (count > 0) {
      showFAB(count);
      // Update toolbar badge
      chrome.runtime.sendMessage({ type: 'UPDATE_BADGE', count }).catch(() => {});
    }
  }

  // ============================================================
  // MUTATION OBSERVER — handle dynamically loaded forms (SPAs)
  // ============================================================

  let debounceTimer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(detectAndShowFAB, 600);
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
    detectAndShowFAB();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
      detectAndShowFAB();
    });
  }

  // ============================================================
  // MESSAGE LISTENER — from popup "Fill Now" button
  // ============================================================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FILL_FORMS') {
      const filled = fillForms(message.profile);
      showToast(`✨ Filled ${filled} field${filled !== 1 ? 's' : ''}!`);
      sendResponse({ filled });
    }

    if (message.type === 'DETECT_FIELDS') {
      sendResponse({ count: countIdentifiableFields() });
    }

    return false;
  });

})();
