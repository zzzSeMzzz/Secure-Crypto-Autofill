let sessionMasterPassword = "";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "setMasterPassword") {
    sessionMasterPassword = request.password;
    sendResponse({ success: true });
  }
  if (request.action === "getMasterPassword") {
    sendResponse({ password: sessionMasterPassword });
  }
  return true;
});