// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAM6sKRp9OM0u3A5IYAPVPzVby_c78v3-U",
  authDomain: "troupe-saint-elme.firebaseapp.com",
  databaseURL: "https://troupe-saint-elme-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "troupe-saint-elme",
  storageBucket: "troupe-saint-elme.firebasestorage.app",
  messagingSenderId: "1005499161402",
  appId: "1:1005499161402:web:45af5ebb1e68a931178e03",
  measurementId: "G-80KTBHE928"
};

// Initialisation de Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();

// Références aux éléments DOM
const authSection = document.getElementById('auth-section');
const editorToolbar = document.getElementById('editor-toolbar');
const contentContainer = document.getElementById('content-container');
const editableContent = document.getElementById('editable-content');
const yearTemplate = document.getElementById('year-template');
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const saveBtn = document.getElementById('save-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authError = document.getElementById('auth-error');

// Références aux modales
const imageModal = document.getElementById('image-modal');
const linkModal = document.getElementById('link-modal');
const yearModal = document.getElementById('year-modal');
const modalImageUpload = document.getElementById('modal-image-upload');
const imagePreview = document.getElementById('image-preview');
const insertImageBtn = document.getElementById('insert-image-btn');
const insertLinkBtn = document.getElementById('insert-link-btn');
const createYearBtn = document.getElementById('create-year-btn');
const closeModalButtons = document.querySelectorAll('.close-modal');
const cancelButtons = document.querySelectorAll('.cancel-btn');

// Variables globales
let isAdmin = false;
let currentSelection = null;
let undoStack = [];
let redoStack = [];
let currentContent = '';
let contentModified = false;

// ===== INITIALISATION ET GESTION D'AUTHENTIFICATION =====

// Vérifier si l'utilisateur est déjà connecté
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            checkAdminStatus(user);
        } else {
            showLoginForm();
        }
        
        // Toujours charger le contenu, qu'il soit en mode édition ou visualisation
        loadContent();
    });
    
    // Initialiser les événements
    setupEventListeners();
});

// Vérifier si l'utilisateur est administrateur
function checkAdminStatus(user) {
    db.collection('admins').doc(user.uid).get()
        .then(doc => {
            if (doc.exists && doc.data().isAdmin) {
                isAdmin = true;
                showAdminInterface();
            } else {
                // L'utilisateur est connecté mais n'est pas admin
                auth.signOut().then(() => {
                    showLoginForm();
                    authError.textContent = "Vous n'avez pas les droits d'administration.";
                });
            }
        })
        .catch(error => {
            console.error("Erreur lors de la vérification des droits admin:", error);
            auth.signOut();
            showLoginForm();
        });
}

// Afficher l'interface d'administration
function showAdminInterface() {
    authSection.classList.add('hidden');
    editorToolbar.classList.remove('hidden');
    
    // Activer l'édition du contenu
    makeContentEditable(true);
    
    // Afficher les contrôles d'administration
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => element.classList.remove('hidden'));
}

// Afficher le formulaire de connexion
function showLoginForm() {
    isAdmin = false;
    authSection.classList.remove('hidden');
    editorToolbar.classList.add('hidden');
    
    // Désactiver l'édition du contenu
    makeContentEditable(false);
    
    // Masquer les contrôles d'administration
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => element.classList.add('hidden'));
}

// Rendre le contenu éditable ou non
function makeContentEditable(editable) {
    const editableElements = document.querySelectorAll('[contenteditable]');
    editableElements.forEach(element => {
        element.contentEditable = editable.toString();
    });
}

// ===== GESTION DU CONTENU =====

// Charger le contenu depuis Firebase
function loadContent() {
    // Afficher le spinner de chargement
    editableContent.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Chargement du contenu...</div>';
    
    // Récupérer le contenu depuis Firestore
    db.collection('contenu').doc('historique')
        .get()
        .then(doc => {
            if (doc.exists) {
                // Si le document existe, afficher son contenu
                const data = doc.data();
                editableContent.innerHTML = data.content || '';
                
                // Sauvegarder l'état initial pour l'historique d'annulation
                currentContent = editableContent.innerHTML;
                
                // Ajouter les gestionnaires d'événements aux éléments dynamiques
                setupDynamicEventListeners();
            } else {
                // Si le document n'existe pas, afficher un message ou un contenu par défaut
                editableContent.innerHTML = '<p>Aucun contenu historique disponible. Connectez-vous en tant qu\'administrateur pour ajouter du contenu.</p>';
                
                // Créer le document s'il n'existe pas
                if (isAdmin) {
                    saveContent();
                }
            }
        })
        .catch(error => {
            console.error("Erreur lors du chargement du contenu:", error);
            editableContent.innerHTML = '<p class="error-message">Erreur lors du chargement du contenu. Veuillez réessayer plus tard.</p>';
        });
}

// Sauvegarder le contenu dans Firebase
function saveContent() {
    if (!isAdmin) return;
    
    // Afficher un indicateur de sauvegarde
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    saveBtn.disabled = true;
    
    // Nettoyer le contenu avant de sauvegarder
    cleanupContent();
    
    // Sauvegarder dans Firestore
    db.collection('contenu').doc('historique').set({
        content: editableContent.innerHTML,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        // Mise à jour réussie
        saveBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            saveBtn.innerHTML = '<i class="fas fa-save"></i>';
            saveBtn.disabled = false;
        }, 1500);
        
        // Réinitialiser le statut de modification
        contentModified = false;
        
        // Mettre à jour l'état actuel pour l'historique d'annulation
        currentContent = editableContent.innerHTML;
    })
    .catch(error => {
        console.error("Erreur lors de la sauvegarde:", error);
        saveBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        setTimeout(() => {
            saveBtn.innerHTML = '<i class="fas fa-save"></i>';
            saveBtn.disabled = false;
        }, 1500);
    });
}

// Nettoyer le contenu avant sauvegarde
function cleanupContent() {
    // Supprimer les attributs de données temporaires
    const tempElements = editableContent.querySelectorAll('[data-temp]');
    tempElements.forEach(element => {
        element.removeAttribute('data-temp');
    });
    
    // S'assurer que les actions d'administration sont cachées en mode visualisation
    if (!isAdmin) {
        const adminControls = editableContent.querySelectorAll('.admin-only');
        adminControls.forEach(control => {
            control.classList.add('hidden');
        });
