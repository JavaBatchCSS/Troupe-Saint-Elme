/**
 * Fichier secure-config.js
 * Contient les données sensibles sous forme chiffrée et les fonctions de déchiffrement
 */

// Clé de chiffrement - À remplacer par une clé plus complexe en production
const ENCRYPTION_KEY = "TroupeSaintElme2025";

// Données sensibles chiffrées (générées avec encrypt())
const encryptedData = {
  githubToken: "U2FsdGVkX1+NZINCaLjmQF8mjHX/3TjWRRCAx1OyI/Sf3/ybPFpap3Dk52rOJZ/eC7UtFLk8sqWeCx2Ewwwwjw==",
  githubOwner: "U2FsdGVkX180ieMSFZXdU51xvMf15bwQSYtGNZ4csVc=",
  githubRepo: "U2FsdGVkX1/k/9+z44gyV1u6nXcHoqGAFymf5XdkOV/GYqW1yAkCUN/w3m9a8Dwi",
  githubBranch: "U2FsdGVkX1/eQSxEtNL+5CAvqiwER9xnphRfajRW07o="
};

/**
 * Chiffre une chaîne de caractères 
 * Fonction utilitaire pour générer des valeurs chiffrées (à utiliser en développement seulement)
 * @param {string} text - Texte à chiffrer
 * @returns {string} - texte chiffré
 */
function encrypt(text) {
  try {
    // On utilise CryptoJS pour le chiffrement AES
    const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error("Erreur de chiffrement:", error);
    return null;
  }
}

/**
 * Déchiffre une chaîne de caractères
 * @param {string} encryptedText - Texte chiffré
 * @returns {string} - texte déchiffré
 */
function decrypt(encryptedText) {
  try {
    // On utilise CryptoJS pour le déchiffrement AES
    const decrypted = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error("Erreur de déchiffrement:", error);
    return null;
  }
}

/**
 * Récupère une valeur sécurisée en la déchiffrant
 * @param {string} key - Clé de la valeur à récupérer
 * @returns {string} - Valeur déchiffrée
 */
function getSecureValue(key) {
  if (!encryptedData[key]) {
    console.error(`La clé ${key} n'existe pas dans les données sécurisées`);
    return null;
  }
  
  return decrypt(encryptedData[key]);
}

/**
 * Fonction utilitaire pour vérifier si le déchiffrement fonctionne correctement
 * À utiliser uniquement en développement
 */
function testDecryption() {
  console.log("Test de déchiffrement:");
  
  for (const [key, value] of Object.entries(encryptedData)) {
    const decrypted = decrypt(value);
    console.log(`${key}: ${decrypted}`);
  }
}
