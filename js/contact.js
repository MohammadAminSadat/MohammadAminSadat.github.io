/**
 * contact.js — Contact form validation and submission
 *
 * The form uses Formspree (https://formspree.io) for actual email delivery.
 * Replace YOUR_FORM_ID in contact.html with your Formspree endpoint.
 * Until then, the form shows a success state without sending anything.
 */

function showFieldError(field, message) {
  const wrapper = field.closest('.form-group');
  wrapper.classList.add('has-error');
  let err = wrapper.querySelector('.field-error');
  if (!err) {
    err = document.createElement('span');
    err.className = 'field-error';
    wrapper.appendChild(err);
  }
  err.textContent = message;
}

function clearFieldError(field) {
  const wrapper = field.closest('.form-group');
  wrapper.classList.remove('has-error');
  const err = wrapper.querySelector('.field-error');
  if (err) err.textContent = '';
}

function validateForm(form) {
  let valid = true;
  const name = form.querySelector('#name');
  const email = form.querySelector('#email');
  const message = form.querySelector('#message');

  if (!name.value.trim()) {
    showFieldError(name, 'Please enter your name.');
    valid = false;
  } else clearFieldError(name);

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value.trim() || !emailRe.test(email.value)) {
    showFieldError(email, 'Please enter a valid email address.');
    valid = false;
  } else clearFieldError(email);

  if (message.value.trim().length < 10) {
    showFieldError(message, 'Please write at least a sentence.');
    valid = false;
  } else clearFieldError(message);

  return valid;
}

function setFormState(form, state) {
  const btn = form.querySelector('.form-submit');
  const btnText = btn.querySelector('span');
  const feedback = document.getElementById('form-feedback');

  if (state === 'loading') {
    btn.disabled = true;
    if (btnText) btnText.textContent = 'Sending…';
    if (feedback) feedback.className = 'form-feedback';
  }

  if (state === 'success') {
    btn.disabled = false;
    if (btnText) btnText.textContent = 'Send Message';
    form.reset();
    if (feedback) {
      feedback.className = 'form-feedback success';
      feedback.textContent = '✓ Message sent — I\'ll get back to you soon.';
    }
  }

  if (state === 'error') {
    btn.disabled = false;
    if (btnText) btnText.textContent = 'Send Message';
    if (feedback) {
      feedback.className = 'form-feedback error';
      feedback.textContent = 'Something went wrong. Please email me directly.';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  // Clear errors on input
  form.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('input', () => clearFieldError(field));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;

    const action = form.getAttribute('action');

    // If no Formspree ID set yet, show a demo success state
    if (!action || action.includes('YOUR_FORM_ID')) {
      setFormState(form, 'loading');
      await new Promise(r => setTimeout(r, 800));
      setFormState(form, 'success');
      return;
    }

    // Real Formspree submission
    setFormState(form, 'loading');
    try {
      const res = await fetch(action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });
      setFormState(form, res.ok ? 'success' : 'error');
    } catch {
      setFormState(form, 'error');
    }
  });
  // ── Crypto support widget ──
  const CRYPTO_WALLETS = [
    { coin: 'BTC', address: 'bc1phluehdxs4ztkskvgn4tu2y90vn33xhud6h9yjsxghturzy3qm4lsdfdcsv', network: 'Bitcoin — Network: Bitcoin' },
    { coin: 'ETH', address: '0x2b648E645E6A6452679F7cE80e812845D09984D3', network: 'Ethereum — Network: ERC-20' },
    { coin: 'USDT', address: 'TRiwFyAehRmDtUo7nKYP7X84aAedpN3Vd7', network: 'USDT — Network: TRC-20 · send only via Tron network' },
    { coin: 'USDC', address: '0x2b648E645E6A6452679F7cE80e812845D09984D3', network: 'USDC — Network: Base · send only via Base network' },
    { coin: 'TRX', address: 'TRiwFyAehRmDtUo7nKYP7X84aAedpN3Vd7', network: 'Tron — Network: TRC-20' },
  ];

  const coinTabs = document.querySelectorAll('.coin-tab');
  const walletAddr = document.querySelector('.wallet-address');
  const walletNet = document.querySelector('.wallet-network');
  const copyBtn = document.querySelector('.copy-wallet-btn');

  if (coinTabs.length && walletAddr) {
    coinTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        coinTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const w = CRYPTO_WALLETS[tab.dataset.index];
        walletAddr.textContent = w.address;
        walletNet.textContent = w.network;
        if (copyBtn) copyBtn.textContent = 'Copy';
      });
    });

    copyBtn?.addEventListener('click', async () => {
      await navigator.clipboard.writeText(walletAddr.textContent);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => (copyBtn.textContent = 'Copy'), 1500);
    });
  }
});
