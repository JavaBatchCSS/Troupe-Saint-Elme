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

// Ajouter cette fonction complète
function setupEventListeners() {
    // Événements d'authentification
    loginBtn.addEventListener('click', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    
    // Événements de l'éditeur
    saveBtn.addEventListener('click', saveContent);
    document.getElementById('bold-btn').addEventListener('click', () => formatDoc('bold'));
    document.getElementById('italic-btn').addEventListener('click', () => formatDoc('italic'));
    document.getElementById('underline-btn').addEventListener('click', () => formatDoc('underline'));
    document.getElementById('h1-btn').addEventListener('click', () => formatDoc('formatBlock', 'h1'));
    document.getElementById('h2-btn').addEventListener('click', () => formatDoc('formatBlock', 'h2'));
    document.getElementById('h3-btn').addEventListener('click', () => formatDoc('formatBlock', 'h3'));
    document.getElementById('align-left-btn').addEventListener('click', () => formatDoc('justifyLeft'));
    document.getElementById('align-center-btn').addEventListener('click', () => formatDoc('justifyCenter'));
    document.getElementById('align-right-btn').addEventListener('click', () => formatDoc('justifyRight'));
    document.getElementById('list-ul-btn').addEventListener('click', () => formatDoc('insertUnorderedList'));
    document.getElementById('list-ol-btn').addEventListener('click', () => formatDoc('insertOrderedList'));
    document.getElementById('image-btn').addEventListener('click', showImageModal);
    document.getElementById('link-btn').addEventListener('click', showLinkModal);
    document.getElementById('add-year-btn').addEventListener('click', showYearModal);
    document.getElementById('undo-btn').addEventListener('click', undoAction);
    document.getElementById('redo-btn').addEventListener('click', redoAction);
    
    // Événements des modales
    insertImageBtn.addEventListener('click', insertImage);
    insertLinkBtn.addEventListener('click', insertLink);
    createYearBtn.addEventListener('click', createNewYear);
    modalImageUpload.addEventListener('change', previewImage);
    
    // Fermeture des modales
    closeModalButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    cancelButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    // Surveiller les modifications du contenu
    editableContent.addEventListener('input', function() {
        contentModified = true;
        pushToUndoStack();
    });
    
    // Gérer les raccourcis clavier
    document.addEventListener('keydown', handleKeyboardShortcuts);
}
// Fonction de connexion
function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        authError.textContent = "Veuillez remplir tous les champs.";
        return;
    }
    
    // Effectuer la connexion avec Firebase
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Connexion réussie, la vérification des droits admin se fait dans onAuthStateChanged
            authError.textContent = "";
            emailInput.value = "";
            passwordInput.value = "";
        })
        .catch((error) => {
            console.error("Erreur de connexion:", error);
            authError.textContent = "Identifiants incorrects. Veuillez réessayer.";
        });
}

// Fonction de déconnexion
function handleLogout() {
    auth.signOut()
        .then(() => {
            showLoginForm();
        })
        .catch((error) => {
            console.error("Erreur lors de la déconnexion:", error);
        });
}
// Fonction pour formater le contenu
function formatDoc(command, value = null) {
    document.execCommand(command, false, value);
    editableContent.focus();
    contentModified = true;
}

// Fonction pour montrer la modale d'image
function showImageModal() {
    // Sauvegarder la sélection actuelle
    saveCurrentSelection();
    imageModal.style.display = 'block';
    imagePreview.style.display = 'none';
    document.getElementById('image-alt').value = '';
}

// Fonction pour montrer la modale de lien
function showLinkModal() {
    // Sauvegarder la sélection actuelle
    saveCurrentSelection();
    linkModal.style.display = 'block';
    
    // Pré-remplir avec le texte sélectionné
    const selection = window.getSelection();
    if (selection.toString()) {
        document.getElementById('link-text').value = selection.toString();
    } else {
        document.getElementById('link-text').value = '';
    }
    document.getElementById('link-url').value = 'https://';
}

// Fonction pour montrer la modale d'année
function showYearModal() {
    yearModal.style.display = 'block';
    document.getElementById('new-year-input').value = new Date().getFullYear();
}

// Fermer toutes les modales
function closeAllModals() {
    imageModal.style.display = 'none';
    linkModal.style.display = 'none';
    yearModal.style.display = 'none';
}

// Prévisualiser l'image
function previewImage() {
    const file = modalImageUpload.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Sauvegarder la sélection actuelle
function saveCurrentSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        currentSelection = selection.getRangeAt(0);
    }
}

// Restaurer la sélection
function restoreSelection() {
    if (currentSelection) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(currentSelection);
    }
}
// Enregistrer l'état pour l'annulation
function pushToUndoStack() {
    // Limiter la taille de la pile
    if (undoStack.length >= 20) {
        undoStack.shift();
    }
    
    undoStack.push(currentContent);
    currentContent = editableContent.innerHTML;
    
    // Vider la pile de rétablissement lors d'une nouvelle action
    redoStack = [];
}

// Annuler la dernière action
function undoAction() {
    if (undoStack.length === 0) return;
    
    // Sauvegarder l'état actuel pour le rétablissement
    redoStack.push(currentContent);
    
    // Restaurer l'état précédent
    const previousState = undoStack.pop();
    editableContent.innerHTML = previousState;
    currentContent = previousState;
    
    // Réattacher les gestionnaires d'événements
    setupDynamicEventListeners();
}

// Rétablir l'action annulée
function redoAction() {
    if (redoStack.length === 0) return;
    
    // Sauvegarder l'état actuel pour l'annulation
    undoStack.push(currentContent);
    
    // Restaurer l'état suivant
    const nextState = redoStack.pop();
    editableContent.innerHTML = nextState;
    currentContent = nextState;
    
    // Réattacher les gestionnaires d'événements
    setupDynamicEventListeners();
}

// Gérer les raccourcis clavier
function handleKeyboardShortcuts(e) {
    // Ctrl+Z pour annuler
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undoAction();
    }
    
    // Ctrl+Y pour rétablir
    if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redoAction();
    }
    
    // Ctrl+S pour sauvegarder
    if (e.ctrlKey && e.key === 's' && isAdmin) {
        e.preventDefault();
        saveContent();
    }
}

// Ajouter des gestionnaires d'événements aux éléments dynamiques
function setupDynamicEventListeners() {
    if (!isAdmin) return;
    
    // Gestionnaires pour les boutons d'années
    const yearActions = document.querySelectorAll('.year-actions button');
    yearActions.forEach(button => {
        if (button.classList.contains('move-up-btn')) {
            button.addEventListener('click', function() {
                const currentSection = this.closest('.year-section');
                const prevSection = currentSection.previousElementSibling;
                if (prevSection && prevSection.classList.contains('year-section')) {
                    prevSection.before(currentSection);
                    contentModified = true;
                }
            });
        } else if (button.classList.contains('move-down-btn')) {
            button.addEventListener('click', function() {
                const currentSection = this.closest('.year-section');
                const nextSection = currentSection.nextElementSibling;
                if (nextSection && nextSection.classList.contains('year-section')) {
                    nextSection.after(currentSection);
                    contentModified = true;
                }
            });
        } else if (button.classList.contains('delete-year-btn')) {
            button.addEventListener('click', function() {
                const year = this.closest('.year-section').dataset.year;
                if (confirm(`Voulez-vous vraiment supprimer l'année ${year} ?`)) {
                    this.closest('.year-section').remove();
                    contentModified = true;
                }
            });
        }
    });
    
    // Gestionnaires pour les images
    const deleteImageBtns = document.querySelectorAll('.image-delete-btn');
    deleteImageBtns.forEach(button => {
        button.addEventListener('click', function() {
            if (confirm("Voulez-vous vraiment supprimer cette image ?")) {
                this.closest('.image-wrapper').remove();
                contentModified = true;
            }
        });
    });
}
// Amélioration de la création d'année
function createNewYear() {
    const yearInput = document.getElementById('new-year-input');
    const yearValue = parseInt(yearInput.value);
    
    // Validation de l'année
    if (isNaN(yearValue) || yearValue < 1900 || yearValue > 2100) {
        alert("Veuillez entrer une année valide entre 1900 et 2100.");
        return;
    }
    
    // Vérifier si l'année existe déjà
    const existingYear = document.querySelector(`.year-section[data-year="${yearValue}"]`);
    if (existingYear) {
        alert(`L'année ${yearValue} existe déjà.`);
        yearInput.focus();
        return;
    }
    
    // Créer une nouvelle section d'année à partir du template
    const yearTemplate = document.getElementById('year-template');
    const newYearNode = document.importNode(yearTemplate.content, true);
    
    // Configurer les données de l'année
    const yearSection = newYearNode.querySelector('.year-section');
    yearSection.dataset.year = yearValue;
    
    // Configurer le titre
    const yearTitle = newYearNode.querySelector('.year-title');
    yearTitle.textContent = `Année ${yearValue}`;
    
    // Ajouter au contenu dans l'ordre chronologique (du plus récent au plus ancien)
    let inserted = false;
    const yearSections = document.querySelectorAll('.year-section');
    
    if (yearSections.length > 0) {
        for (let i = 0; i < yearSections.length; i++) {
            const currentYear = parseInt(yearSections[i].dataset.year);
            
            if (yearValue > currentYear) {
                yearSections[i].before(yearSection);
                inserted = true;
                break;
            }
        }
    }
    
    // Si aucune insertion n'a été faite (année la plus ancienne), ajouter à la fin
    if (!inserted) {
        editableContent.appendChild(yearSection);
    }
    
    // Configurer les gestionnaires d'événements
    setupDynamicEventListeners();
    
    // Fermer la modale
    closeAllModals();
    
    // Enregistrer pour l'annulation
    pushToUndoStack();
    
    // Mettre le focus sur le contenu de la nouvelle année
    setTimeout(() => {
        const newYearContent = yearSection.querySelector('.year-content');
        newYearContent.focus();
    }, 100);
}
