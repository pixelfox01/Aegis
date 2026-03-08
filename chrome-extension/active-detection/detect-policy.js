// active-detection/detect-policy.js

const AGREEMENT_PATTERNS = [
    'agree',
    'accept',
    'agree to',
    'accept the',
    'by checking',
    'by signing'
];

const POLICY_TYPES = [
    { type: 'terms', patterns: ['terms of service', 'terms and conditions', 'terms & conditions'] },
    { type: 'privacy', patterns: ['privacy policy', 'privacy notice'] },
];

function getTextNearElement(element) {
    let node = element;
    for (let i = 0; i < 3; i++) {
        if (node.parentElement) node = node.parentElement;
    }
    return node.innerText?.toLowerCase() || '';
}

function identifyPolicyTypes(text) {
    const found = [];
    for (const { type, patterns } of POLICY_TYPES) {
        if (patterns.some(pattern => text.includes(pattern))) {
            found.push(type);
        }
    }
    return found;
}

function hasAgreementLanguage(text) {
    return AGREEMENT_PATTERNS.some(pattern => text.includes(pattern));
}

function hasNearbyLink(element) {
    let node = element;
    for (let i = 0; i < 3; i++) {
        if (node.parentElement) node = node.parentElement;
    }
    return node.querySelector('a[href]') !== null;
}

function scanForPolicyCheckboxes() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const detectedPolicies = new Set();

    for (const checkbox of checkboxes) {
        const surroundingText = getTextNearElement(checkbox);

        if (!hasAgreementLanguage(surroundingText)) continue;
        if (!hasNearbyLink(checkbox)) continue;

        const policyTypes = identifyPolicyTypes(surroundingText);
        if (policyTypes.length === 0) continue;

        policyTypes.forEach(type => detectedPolicies.add(type));
    }

    return [...detectedPolicies];
}

function notifyPipelineIfDetected() {
    const policies = scanForPolicyCheckboxes();

    if (policies.length === 0) return;

    const hostname = window.location.hostname.replace(/^www\./, '');

    chrome.runtime.sendMessage({
        type: 'POLICY_DETECTED',
        payload: {
            site: hostname,
            policies
        }
    });
}

/////temp

chrome.runtime.onMessage.addListener((message) => {
    if (message.type !== 'SHOW_POLICY_POPUP') return;
    showPopup(message.payload);
  });
  
  function showPopup(data) {
    const existing = document.getElementById('privacy-guardian-popup');
    if (existing) existing.remove();
  
    const overlay = document.createElement('div');
    overlay.id = 'privacy-guardian-popup';
    overlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 8px;
      padding: 24px;
      width: 320px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.2);
      z-index: 999999;
      font-family: sans-serif;
    `;
  
    overlay.innerHTML = `
      <p>${data.site}</p>
      <p>${data.policies.join(', ')}</p>
      <button id="privacy-guardian-close">Close</button>
    `;
  
    document.body.appendChild(overlay);
  
    document.getElementById('privacy-guardian-close')
      .addEventListener('click', () => overlay.remove());
  }
  

///temp


// Run once on page load
notifyPipelineIfDetected();

// Watch for dynamically injected policy checkboxes
// (e.g. loaded in after the page via JavaScript)
const observer = new MutationObserver(() => {
    notifyPipelineIfDetected();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
