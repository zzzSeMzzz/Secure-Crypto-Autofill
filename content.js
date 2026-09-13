async function forceAutofill() {
  const currentHost = window.location.hostname.toLowerCase();

  chrome.storage.local.get(['cryptoAutofill'], (result) => {
    const credentialsList = result.cryptoAutofill || [];
    const matchedAccount = credentialsList.find(item => currentHost.includes(item.site));

    if (matchedAccount) {
      const usernameInput = document.getElementById('loginusername');
      const passwordInput = document.getElementById('loginpassword');

      if (usernameInput && passwordInput) {
        if (!usernameInput.dataset.extensionFilled) {
          
          // Запрашиваем мастер-пароль у фонового скрипта для расшифровки
          chrome.runtime.sendMessage({ action: "getMasterPassword" }, async (response) => {
            if (response && response.password) {
              const masterPass = response.password;

              // Дешифруем креды
              const decryptedLogin = await decryptData(matchedAccount.login, masterPass);
              const decryptedPassword = await decryptData(matchedAccount.password, masterPass);

              if (decryptedLogin && decryptedPassword) {
                usernameInput.value = decryptedLogin;
                usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
                
                passwordInput.value = decryptedPassword;
                passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

                // Красивый фиолетовый маркер — признак защищенного шифрованием автозаполнения
                usernameInput.style.borderLeft = "4px solid #9b59b6";
                passwordInput.style.borderLeft = "4px solid #9b59b6";

                usernameInput.dataset.extensionFilled = "true";
                passwordInput.dataset.extensionFilled = "true";
              }
            }
          });
        }
      }
    }
  });
}

// Запуск
forceAutofill();
setInterval(forceAutofill, 1500);