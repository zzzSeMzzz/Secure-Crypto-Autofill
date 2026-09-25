// background.js
importScripts('./crypto.js');

let sessionMasterPassword = "";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "setMasterPassword") {
    sessionMasterPassword = request.password;
    sendResponse({ success: true });
  }
  
  if (request.action === "getMasterPassword") {
    sendResponse({ password: sessionMasterPassword });
  }

  // Дешифровка на стороне бэкграунда (где функции crypto.js уже доступны через importScripts)
  if (request.action === "decryptCredentials") {
    if (!sessionMasterPassword) {
      sendResponse({ error: "Storage locked" });
      return true;
    }

    (async () => {
      try {
        const decryptedLogin = await decryptData(request.encryptedLogin, sessionMasterPassword);
        const decryptedPassword = await decryptData(request.encryptedPassword, sessionMasterPassword);
        sendResponse({ login: decryptedLogin, password: decryptedPassword });
      } catch (err) {
        sendResponse({ error: err.message });
      }
    })();
    return true; // Держим канал связи открытым для асинхронного ответа
  }

  return true;
});
