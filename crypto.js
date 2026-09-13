// crypto.js - Вспомогательные функции для Web Crypto API

// Генерация крипто-ключа на основе мастер-пароля
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw", 
    encoder.encode(password), 
    { name: "PBKDF2" }, 
    false, 
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Зашифровать строку
async function encryptData(text, password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encoder.encode(text)
  );

  // Возвращаем соль, iv и зашифрованный текст в виде hex-строк
  return {
    salt: bufToHex(salt),
    iv: bufToHex(iv),
    ciphertext: bufToHex(new Uint8Array(encrypted))
  };
}

// Расшифровать строку
async function decryptData(encryptedObj, password) {
  try {
    const salt = hexToBuf(encryptedObj.salt);
    const iv = hexToBuf(encryptedObj.iv);
    const ciphertext = hexToBuf(encryptedObj.ciphertext);
    const key = await deriveKey(password, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    return null; // Если мастер-пароль неверный
  }
}

// Утилиты перевода Buffer <-> Hex
function bufToHex(buf) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function hexToBuf(hex) {
  return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}
