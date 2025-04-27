// Fichier de configuration sécurisée pour l'accès à GitHub
// Ces valeurs devraient être stockées de manière sécurisée
// et non exposées directement dans le code source

// Fonction pour récupérer des valeurs sécurisées
function getSecureValue(key) {
    // Données de configuration (dans un environnement de production, 
    // ces valeurs seraient récupérées de façon plus sécurisée)
    const config = {
        "githubOwner": "javabatchcss",
        "githubRepo": "Troupe-Saint-Elme",
        "githubBranch": "main",
        "githubToken": "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" // À remplacer par un vrai token dans un environnement réel
    };
    
    return config[key] || null;
}

// Pour une implémentation plus sécurisée:
// 1. Ces valeurs ne devraient jamais être exposées côté client
// 2. Utilisez un backend pour gérer les requêtes vers l'API GitHub
// 3. Le token GitHub ne devrait jamais être inclus dans le code source
