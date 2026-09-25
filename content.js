// content.js - Легковесный универсальный заполнитель

let autofillIntervalId = null;

function findInput(selectors, types) {
  for (const selector of selectors) {
    try {
      const el = document.querySelector(selector);
      if (el && el.tagName === 'INPUT') return el;
    } catch (e) {}
  }
  
  const allInputs = Array.from(document.querySelectorAll('input'));
  for (const input of allInputs) {
    const inputType = (input.type || '').toLowerCase();
    if (types.includes(inputType) && input.style.display !== 'none' && input.type !== 'hidden') {
      return input;
    }
  }
  return null;
}

function forceAutofill() {
  if (!chrome.runtime || !chrome.runtime.id) {
    if (autofillIntervalId) clearInterval(autofillIntervalId);
    return;
  }

  const currentHost = window.location.hostname.toLowerCase();

  chrome.storage.local.get(['cryptoAutofill'], (result) => {
    if (chrome.runtime.lastError || !chrome.runtime || !chrome.runtime.id) return;

    const credentialsList = result.cryptoAutofill || [];
    const matchedAccount = credentialsList.find(item => currentHost.includes(item.site));

    if (matchedAccount) {
      const usernameSelectors = [
        '#loginusername', '#username', '#login', '#user', '#email',
        'input[name="username"]', 'input[name="login"]', 'input[name="user"]', 'input[name="email"]'
      ];
      
      const passwordSelectors = [
        '#loginpassword', '#password', '#pass',
        'input[name="password"]', 'input[name="pass"]'
      ];

      const usernameInput = findInput(usernameSelectors, ['text', 'email', 'username']);
      const passwordInput = findInput(passwordSelectors, ['password']);

      if (usernameInput && passwordInput) {
        const isUserEmpty = usernameInput.value === "" || usernameInput.value !== usernameInput.dataset.lastFilledValue;
        const isPassEmpty = passwordInput.value === "" || passwordInput.value !== passwordInput.dataset.lastFilledValue;

        if ((isUserEmpty || isPassEmpty) && usernameInput.dataset.extLock !== "true") {
          usernameInput.setAttribute('data-ext-lock', 'true');

          // Запрашиваем дешифровку напрямую у фонового процесса
          chrome.runtime.sendMessage({ 
            action: "decryptCredentials", 
            encryptedLogin: matchedAccount.login,
            encryptedPassword: matchedAccount.password
          }, (response) => {
            try {
              if (!chrome.runtime || !chrome.runtime.id) return;

              if (response && response.login && response.password) {
                if (usernameInput.value !== response.login) {
                  usernameInput.value = response.login;
                  usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
                  usernameInput.dispatchEvent(new Event('change', { bubbles: true }));
                }

                if (passwordInput.value !== response.password) {
                  passwordInput.value = response.password;
                  passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                  passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
                }

                usernameInput.style.borderLeft = "4px solid #9b59b6";
                passwordInput.style.borderLeft = "4px solid #9b59b6";

                usernameInput.dataset.lastFilledValue = response.login;
                passwordInput.dataset.lastFilledValue = response.password;
              }
            } catch (err) {
              console.error("[Autofill] Ошибка ввода данных:", err);
            } finally {
              if (usernameInput) {
                usernameInput.removeAttribute('data-ext-lock');
              }
            }
          });
        }
      }
    }
  });
}

forceAutofill();
autofillIntervalId = setInterval(forceAutofill, 1000);
