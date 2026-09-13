// popup.js
let currentMasterPassword = "";

document.addEventListener('DOMContentLoaded', async () => {
  const authScreen = document.getElementById('authScreen');
  const mainScreen = document.getElementById('mainScreen');
  const masterPasswordInput = document.getElementById('masterPassword');
  const unlockBtn = document.getElementById('unlockBtn');
  const accountsList = document.getElementById('accountsList');
  
  // Проверяем, может хранилище уже разблокировано в этой сессии
  chrome.runtime.sendMessage({ action: "getMasterPassword" }, (response) => {
    if (response && response.password) {
      currentMasterPassword = response.password;
      showMainScreen();
    }
  });

  unlockBtn.addEventListener('click', () => {
    const pass = masterPasswordInput.value.trim();
    if (pass.length < 4) {
      alert("Мастер-пароль должен быть не менее 4 символов");
      return;
    }
    currentMasterPassword = pass;
    // Передаем бэкграунду для временного хранения в сессии
    chrome.runtime.sendMessage({ action: "setMasterPassword", password: pass });
    showMainScreen();
  });

  document.getElementById('addBtn').addEventListener('click', async () => {
    const site = document.getElementById('siteInput').value.trim().toLowerCase();
    const login = document.getElementById('loginInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();

    if (!site || !login || !password) return alert("Заполните все поля!");

    // Шифруем данные перед сохранением
    const encLogin = await encryptData(login, currentMasterPassword);
    const encPassword = await encryptData(password, currentMasterPassword);

    chrome.storage.local.get(['cryptoAutofill'], (result) => {
      const list = result.cryptoAutofill || [];
      list.push({ site, login: encLogin, password: encPassword, id: Date.now() });
      
      chrome.storage.local.set({ cryptoAutofill: list }, () => {
        document.getElementById('siteInput').value = '';
        document.getElementById('loginInput').value = '';
        document.getElementById('passwordInput').value = '';
        showStatus();
        renderList(list);
      });
    });
  });

  document.getElementById('lockBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "setMasterPassword", password: "" });
    currentMasterPassword = "";
    masterPasswordInput.value = "";
    mainScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
  });

  function showMainScreen() {
    authScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
    chrome.storage.local.get(['cryptoAutofill'], (result) => {
      renderList(result.cryptoAutofill || []);
    });
  }

  function renderList(list) {
    accountsList.innerHTML = "";
    if (list.length === 0) accountsList.innerHTML = "<div style='color:#7f8c8d;font-size:12px;'>Список пуст</div>";
    list.forEach(item => {
      const div = document.createElement('div');
      div.className = "account-item";
      div.innerHTML = `<span><b>${item.site}</b></span>`;
      
      const delBtn = document.createElement('button');
      delBtn.className = "delete-btn";
      delBtn.innerText = "Удалить";
      delBtn.onclick = () => deleteItem(item.id);
      
      div.appendChild(delBtn);
      accountsList.appendChild(div);
    });
  }

  function deleteItem(id) {
    chrome.storage.local.get(['cryptoAutofill'], (result) => {
      const list = result.cryptoAutofill || [];
      const filtered = list.filter(item => item.id !== id);
      chrome.storage.local.set({ cryptoAutofill: filtered }, () => renderList(filtered));
    });
  }

  function showStatus() {
    const status = document.getElementById('status');
    status.classList.remove('hidden');
    setTimeout(() => status.classList.add('hidden'), 2000);
  }
});