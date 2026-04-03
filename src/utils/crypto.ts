import CryptoJS from 'crypto-js';
import { SECRET_IV, SECRET_KEY } from '../config/env';

export const encrypt = (plainText: string) => {
    const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
    const iv = CryptoJS.enc.Utf8.parse(SECRET_IV);

    const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(plainText), key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    // Convert raw bytes to base64 (same as Node)
    return CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
};

export const decrypt = (cipherText: string) => {
    const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
    const iv = CryptoJS.enc.Utf8.parse(SECRET_IV);

    // Parse base64 input (no salt)
    const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Base64.parse(cipherText)
    });

    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
};