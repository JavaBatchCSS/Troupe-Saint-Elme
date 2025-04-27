// Fichier de configuration sécurisée pour l'accès à GitHub
// Ces valeurs sont sensibles et ne devraient pas être exposées
// dans un environnement de production

// Fonction pour récupérer des valeurs sécurisées
function getSecureValue(key) {
    // Données de configuration 
    // IMPORTANT: Dans un environnement de production, ces informations
    // devraient être stockées de manière plus sécurisée (variables d'environnement, 
    // secrets managés, etc.)
    const config = {
        "githubOwner": "javabatchcss",
        "githubRepo": "Troupe-Saint-Elme",
        "githubBranch": "main",
        // ATTENTION: Il s'agit d'un exemple de token. Vous devez remplacer cette valeur
        // par un token GitHub valide avec les permissions nécessaires pour lire/écrire
        // dans le dépôt spécifié.
        "githubToken": "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" 
    };
    
    return config[key] || null;
}

// Remarques sur la sécurité:
// 1. Ce fichier expose directement le token GitHub, ce qui est risqué
// 2. Pour une implémentation plus sécurisée:
//    - Utilisez un backend pour gérer les requêtes API GitHub
//    - Ne stockez jamais de tokens ou secrets dans le code frontend
//    - Implémentez une authentification appropriée pour les utilisateurs
//    - Considérez l'utilisation d'OAuth pour l'authentification GitHub
