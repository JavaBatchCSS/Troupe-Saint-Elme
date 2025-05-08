 // Configuration sécurisée
 const ENCRYPTION_KEY = "TroupeSaintElme2025";
    const encryptedData = {
      githubToken: "U2FsdGVkX18bflIPTYoKWYCFcJFneYp3xcwtgiHr90CLkbqlQOcfanBT7V1580l1RR5QFvZHXPxpHghmzzwUPc8pw7VN1W/Y+pOTRO0J4OfZx23zkkqmayC7/2EqfRvthq+OkDLXg1v7QsSqLjgzqQ==",
      githubOwner: "U2FsdGVkX186j9ffhpnA1a9MJtRiIa/04ShDXl5sbNQ=",
      githubRepo: "U2FsdGVkX19Zfsoi64wXtZeYZ3LTFaved+N7Qx6X6sdPw7IlmTc4/tOAKOkGPcHv",
      githubBranch: "U2FsdGVkX18dk0LRwjtJUNSytvcU62mMHrQE7rv8WUQ="
    };

    function decrypt(encryptedText) {
      try {
        const decrypted = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
        return decrypted;
      } catch (error) {
        console.error("Erreur de déchiffrement:", error);
        return null;
      }
    }

    function getSecureValue(key) {
      if (!encryptedData[key]) {
        console.error(`La clé ${key} n'existe pas dans les données sécurisées`);
        return null;
      }
      return decrypt(encryptedData[key]);
    }

    // Utiliser les valeurs déchiffrées
    const token = getSecureValue('githubToken');
    const owner = getSecureValue('githubOwner');
    const repo = `${owner}/${getSecureValue('githubRepo')}`;
    const branch = getSecureValue('githubBranch');
