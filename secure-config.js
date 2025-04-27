/**
 * Fichier 
 * Contient les données sensibles sous forme chiffrée et les fonctions de déchiffrement
 */

// Clé de chiffrement - À remplacer par une clé plus complexe en production
const ENCRYPTION_KEY = "TroupeSaintElme2025";

// Données sensibles chiffrées (générées avec encrypt())
const encryptedData = {
  githubToken: "U2FsdGVkX19xD7v+tZ9yTgI0X2JtOuRZ4B6JVN8+6iSfNvpwLOkGFm1LDkw2PtvXk+3W6G38QM4z+JmB3UZqpQ==",
  githubOwner: "U2FsdGVkX1+tBtNvUNwzSIZFV6wNqkdL9kY9ZbA3WrU=",
  githubRepo: "U2FsdGVkX1+c0a+6dTLaFBDC5TUG2FXmTWZzTGYoZ08=",
  githubBranch: "U2FsdGVkX19EOEa1K05t/BKTIZdILcXtTSEzUXgd8yY="
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
