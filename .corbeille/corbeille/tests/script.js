// Ce script sera utilisé pour configurer EmailJS
// et gérer l'approbation des utilisateurs

// Configuration EmailJS
function setupEmailJS() {
    // Remplacez "YOUR_PUBLIC_KEY" par votre clé publique EmailJS
    emailjs.init("YOUR_PUBLIC_KEY");
}

// Fonction pour envoyer la demande d'accès
function sendAccessRequest(prenom, email) {
    // Paramètres pour EmailJS
    const templateParams = {
        prenom: prenom,
        email: email,
        timestamp: new Date().toLocaleString(),
        validation_url: `${window.location.origin}/validation.html?prenom=${encodeURIComponent(prenom)}&email=${encodeURIComponent(email)}&timestamp=${encodeURIComponent(new Date().toLocaleString())}`
    };
    
    // Envoyer l'email à l'administrateur
    return emailjs.send('service_id', 'template_id', templateParams);
}

// Fonction pour envoyer l'email d'approbation
function sendApprovalEmail(prenom, email) {
    // Paramètres pour EmailJS
    const templateParams = {
        prenom: prenom,
        email: email,
        site_url: window.location.origin,
        message: 'Votre demande d\'accès à notre site a été approuvée. Vous pouvez maintenant accéder au contenu.'
    };
    
    // Envoyer l'email à l'utilisateur
    return emailjs.send('service_id', 'template_approval', templateParams);
}

// Fonction pour envoyer l'email de refus
function sendRejectionEmail(prenom, email) {
    // Paramètres pour EmailJS
    const templateParams = {
        prenom: prenom,
        email: email,
        message: 'Nous sommes désolés, mais votre demande d\'accès à notre site a été refusée.'
    };
    
    // Envoyer l'email à l'utilisateur
    return emailjs.send('service_id', 'template_rejection', templateParams);
}

// Fonction pour marquer un utilisateur comme approuvé
function markUserAsApproved(email) {
    localStorage.setItem('userApproved', 'true');
    localStorage.setItem('userEmail', email);
}

// Vérifier si l'utilisateur est déjà approuvé
function isUserApproved() {
    return localStorage.getItem('userApproved') === 'true';
}

// Pour terminer la session
function logout() {
    localStorage.removeItem('userApproved');
    localStorage.removeItem('userEmail');
    window.location.href = 'index.html';
}

// Fonction pour obtenir les paramètres de l'URL
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    
    for (const [key, value] of params.entries()) {
        result[key] = value;
    }
    
    return result;
}
