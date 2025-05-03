// Configuration Firebase
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

// Initialisation de Firebase avec gestion d'erreurs
try {
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const storage = firebase.storage();
  const auth = firebase.auth();
  
  // Constants pour les propriétés Firebase
  const CONTENT_COLLECTION = 'contenu';
  const HISTORY_DOCUMENT = 'historique';
  const ADMINS_COLLECTION = 'admins';
  
  // Éléments DOM - cache pour performance
  const DOM = {
    // Sections principales
    authSection: document.getElementById('auth-section'),
    editorToolbar: document.getElementById('editor-toolbar'),
    contentContainer: document.getElementById('content-container'),
    editableContent: document.getElementById('editable-content'),
    
    // Templates
    yearTemplate: document.getElementById('year-template'),
    
    // Formulaire d'authentification
    loginForm: document.getElementById('login-form'),
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    authError: document.getElementById('auth-error'),
    
    // Boutons de l'éditeur
    saveBtn: document.getElementById('save-btn'),
    undoBtn: document.getElementById('undo-btn'),
    redoBtn: document.getElementById('redo-btn'),
    
    // Modales
    imageModal: document.getElementById('image-modal'),
    linkModal: document.getElementById('link-modal'),
    yearModal: document.getElementById('year-modal'),
    
    // Éléments des modales
    modalImageUpload: document.getElementById('modal-image-upload'),
    imagePreview: document.getElementById('image-preview'),
    insertImageBtn: document.getElementById('insert-image-btn'),
    insertLinkBtn: document.getElementById('insert-link-btn'),
    createYearBtn: document.getElementById('create-year-btn'),
    closeModalButtons: document.querySelectorAll('.close-modal'),
    cancelButtons: document.querySelectorAll('.cancel-btn')
  };
  
  // État de l'application
  const AppState = {
    isAdmin: false,
    currentSelection: null,
    undoStack: [],
    redoStack: [],
    currentContent: '',
    contentModified: false,
    lastSaveTime: null,
    autoSaveInterval: null,
    maxUndoStackSize: 50,
    uploadInProgress: false
  };
  
  // Constantes pour la configuration
  const CONFIG = {
    MAX_IMAGE_SIZE: 2 * 1024 * 1024, // 2 MB
    AUTO_SAVE_INTERVAL: 60000, // 1 minute
    UNSAVED_CHANGES_TITLE: "* Historique - Troupe Saint Elme",
    SAVED_CHANGES_TITLE: "Historique - Troupe Saint Elme",
    ALLOWABLE_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"]
  };

  // ===== INITIALISATION ET GESTION D'AUTHENTIFICATION =====
  
  /**
   * Initialise l'application au chargement du DOM
   */
  document.addEventListener('DOMContentLoaded', () => {
    // Vérifier l'état d'authentification
    auth.onAuthStateChanged(user => {
      if (user) {
        checkAdminStatus(user);
      } else {
        showLoginForm();
      }
      
      // Toujours charger le contenu
      loadContent();
    });
    
    // Initialiser les événements
    setupEventListeners();
    
    // Configurer l'auto-save pour les administrateurs
    setupAutoSave();
    
    // Activer le tooltip
    setupTooltips();
    
    // Configurer la validation du formulaire
    setupFormValidation();
    
    // Configurer le défilement fluide
    setupSmoothScrolling();
  });
  
  /**
   * Vérifie si l'utilisateur possède les droits d'administrateur
   * @param {Object} user - L'objet utilisateur Firebase
   */
  function checkAdminStatus(user) {
    const loadingIndicator = createLoadingIndicator("Vérification des droits...");
    DOM.authSection.appendChild(loadingIndicator);
    
    db.collection(ADMINS_COLLECTION).doc(user.uid).get()
      .then(doc => {
        if (doc.exists && doc.data().isAdmin) {
          AppState.isAdmin = true;
          showAdminInterface();
          
          // Enregistrer l'heure de connexion
          logAdminAction(user.uid, 'login', 'Connexion réussie');
          
          // Activer l'auto-save
          startAutoSave();
        } else {
          throw new Error("Droits d'administration insuffisants");
        }
      })
      .catch(error => {
        console.error("Erreur lors de la vérification des droits admin:", error);
        auth.signOut();
        showLoginForm();
        DOM.authError.textContent = "Vous n'avez pas les droits d'administration.";
      })
      .finally(() => {
        if (loadingIndicator.parentNode) {
          loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
      });
  }
  
  /**
   * Crée un indicateur de chargement
   * @param {String} message - Le message à afficher
   * @return {HTMLElement} - L'élément créé
   */
  function createLoadingIndicator(message) {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-spinner';
    loadingIndicator.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
    return loadingIndicator;
  }
  
  /**
   * Affiche l'interface d'administration
   */
  function showAdminInterface() {
    DOM.authSection.classList.add('hidden');
    DOM.editorToolbar.classList.remove('hidden');
    
    // Activer l'édition du contenu
    makeContentEditable(true);
    
    // Afficher les contrôles d'administration
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => element.classList.remove('hidden'));
    
    // Notify success
    showNotification('Vous êtes connecté en tant qu\'administrateur', 'success');
    
    // Update page title
    document.title = CONFIG.SAVED_CHANGES_TITLE;
  }
  
  /**
   * Affiche le formulaire de connexion
   */
  function showLoginForm() {
    AppState.isAdmin = false;
    DOM.authSection.classList.remove('hidden');
    DOM.editorToolbar.classList.add('hidden');
    
    // Désactiver l'édition du contenu
    makeContentEditable(false);
    
    // Masquer les contrôles d'administration
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => element.classList.add('hidden'));
    
    // Arrêter l'auto-save
    stopAutoSave();
    
    // Update page title
    document.title = CONFIG.SAVED_CHANGES_TITLE;
  }
  
  /**
   * Rend le contenu éditable ou non
   * @param {Boolean} editable - Indique si le contenu doit être éditable ou non
   */
  function makeContentEditable(editable) {
    const editableElements = document.querySelectorAll('[contenteditable]');
    editableElements.forEach(element => {
      element.contentEditable = editable.toString();
    });
  }
  
  /**
   * Journalise une action admin
   * @param {String} userId - ID de l'utilisateur
   * @param {String} action - L'action effectuée
   * @param {String} details - Détails supplémentaires
   */
  function logAdminAction(userId, action, details = '') {
    db.collection('admin_logs').add({
      userId: userId,
      action: action,
      details: details,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      userAgent: navigator.userAgent
    }).catch(error => {
      console.error("Erreur de journalisation:", error);
    });
  }
  
  // ===== GESTION DU CONTENU =====
  
  /**
   * Charge le contenu depuis Firebase
   */
  function loadContent() {
    // Afficher le spinner de chargement
    DOM.editableContent.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Chargement du contenu...</div>';
    
    // Récupérer le contenu depuis Firestore
    db.collection(CONTENT_COLLECTION).doc(HISTORY_DOCUMENT)
      .get()
      .then(doc => {
        if (doc.exists) {
          // Si le document existe, afficher son contenu
          const data = doc.data();
          DOM.editableContent.innerHTML = data.content || '';
          
          // Sauvegarder l'état initial pour l'historique d'annulation
          AppState.currentContent = DOM.editableContent.innerHTML;
          
          // Ajouter les gestionnaires d'événements aux éléments dynamiques
          setupDynamicEventListeners();
          
          // Ajouter les attributs nécessaires pour l'accessibilité
          enhanceAccessibility();
        } else {
          // Si le document n'existe pas, afficher un message ou un contenu par défaut
          DOM.editableContent.innerHTML = '<p>Aucun contenu historique disponible. Connectez-vous en tant qu\'administrateur pour ajouter du contenu.</p>';
          
          // Créer le document s'il n'existe pas
          if (AppState.isAdmin) {
            saveContent();
          }
        }
      })
      .catch(error => {
        console.error("Erreur lors du chargement du contenu:", error);
        DOM.editableContent.innerHTML = '<p class="error-message">Erreur lors du chargement du contenu. <button id="retry-load" class="btn btn-sm btn-outline-primary">Réessayer</button></p>';
        
        // Ajouter un gestionnaire d'événement pour réessayer
        document.getElementById('retry-load')?.addEventListener('click', loadContent);
      });
  }
  
  /**
   * Améliore l'accessibilité du contenu
   */
  function enhanceAccessibility() {
    // Ajouter des attributs ARIA aux sections d'année
    const yearSections = document.querySelectorAll('.year-section');
    yearSections.forEach((section, index) => {
      section.setAttribute('role', 'region');
      section.setAttribute('aria-label', `Année ${section.dataset.year}`);
      
      // Assurer que tous les titres sont accessibles
      const header = section.querySelector('.year-header');
      if (header) {
        header.setAttribute('role', 'heading');
        header.setAttribute('aria-level', '2');
      }
    });
    
    // Améliorer l'accessibilité des images
    const images = document.querySelectorAll('.content-image');
    images.forEach(img => {
      if (!img.alt) {
        img.alt = "Image historique de la Troupe Saint Elme";
      }
    });
  }
  
  /**
   * Sauvegarde le contenu dans Firebase
   * @param {Boolean} silent - Indique si la sauvegarde doit être silencieuse (sans notification)
   * @return {Promise} - Promesse résolue après la sauvegarde
   */
  function saveContent(silent = false) {
    if (!AppState.isAdmin) return Promise.reject("Droits insuffisants");
    
    // Si une sauvegarde est déjà en cours, ne pas en lancer une autre
    if (DOM.saveBtn.disabled) return Promise.reject("Sauvegarde déjà en cours");
    
    // Afficher un indicateur de sauvegarde
    DOM.saveBtn.disabled = true;
    DOM.saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    // Nettoyer le contenu avant de sauvegarder
    cleanupContent();
    
    // Sauvegarder dans Firestore
    return db.collection(CONTENT_COLLECTION).doc(HISTORY_DOCUMENT).set({
      content: DOM.editableContent.innerHTML,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      // Mise à jour réussie
      DOM.saveBtn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => {
        DOM.saveBtn.innerHTML = '<i class="fas fa-save"></i>';
        DOM.saveBtn.disabled = false;
      }, 1500);
      
      // Réinitialiser le statut de modification
      AppState.contentModified = false;
      AppState.lastSaveTime = new Date();
      
      // Mettre à jour l'état actuel pour l'historique d'annulation
      AppState.currentContent = DOM.editableContent.innerHTML;
      
      // Mettre à jour le titre de la page
      document.title = CONFIG.SAVED_CHANGES_TITLE;
      
      // Afficher une notification si demandé
      if (!silent) {
        showNotification('Contenu sauvegardé avec succès', 'success');
      }
      
      // Journaliser l'action admin
      const userId = auth.currentUser?.uid;
      if (userId) {
        logAdminAction(userId, 'save_content', 'Sauvegarde du contenu historique');
      }
      
      return true;
    })
    .catch(error => {
      console.error("Erreur lors de la sauvegarde:", error);
      DOM.saveBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
      setTimeout(() => {
        DOM.saveBtn.innerHTML = '<i class="fas fa-save"></i>';
        DOM.saveBtn.disabled = false;
      }, 1500);
      
      showNotification('Erreur lors de la sauvegarde. Veuillez réessayer.', 'error');
      return false;
    });
  }
  
  /**
   * Configure les gestionnaires d'événements
   */
  function setupEventListeners() {
    // Événements d'authentification
    DOM.loginBtn.addEventListener('click', handleLogin);
    DOM.logoutBtn.addEventListener('click', handleLogout);
    
    // Soumettre le formulaire avec Enter
    DOM.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleLogin(e);
    });
    
    // Événements de l'éditeur
    DOM.saveBtn.addEventListener('click', () => saveContent());
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
    DOM.undoBtn.addEventListener('click', undoAction);
    DOM.redoBtn.addEventListener('click', redoAction);
    
    // Événements des modales
    DOM.insertImageBtn.addEventListener('click', insertImage);
    DOM.insertLinkBtn.addEventListener('click', insertLink);
    DOM.createYearBtn.addEventListener('click', createNewYear);
    DOM.modalImageUpload.addEventListener('change', previewImage);
    
    // Événement pour l'onglet dans le formulaire de connexion
    DOM.emailInput.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        DOM.passwordInput.focus();
      }
    });
    
    DOM.passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        DOM.emailInput.focus();
      }
    });
    
    // Fermeture des modales
    DOM.closeModalButtons.forEach(button => {
      button.addEventListener('click', closeAllModals);
    });
    
    DOM.cancelButtons.forEach(button => {
      button.addEventListener('click', closeAllModals);
    });
    
    // Fermer les modales si on clique en dehors
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        closeAllModals();
      }
    });
    
    // Surveiller les modifications du contenu
    DOM.editableContent.addEventListener('input', function() {
      AppState.contentModified = true;
      pushToUndoStack();
    });
    
    // Capturer les images collées
    DOM.editableContent.addEventListener('paste', handlePaste);
    
    // Gérer les raccourcis clavier
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Activer la navigation par touche pour les années
    enableKeyboardNavigation();
  }
  
  /**
   * Configure la validation du formulaire
   */
  function setupFormValidation() {
    // Valider l'email en temps réel
    DOM.emailInput.addEventListener('input', () => {
      const email = DOM.emailInput.value.trim();
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      
      if (email && !isValid) {
        DOM.emailInput.classList.add('is-invalid');
      } else {
        DOM.emailInput.classList.remove('is-invalid');
      }
    });
    
    // Valider le mot de passe en temps réel
    DOM.passwordInput.addEventListener('input', () => {
      const password = DOM.passwordInput.value;
      
      if (password && password.length < 6) {
        DOM.passwordInput.classList.add('is-invalid');
      } else {
        DOM.passwordInput.classList.remove('is-invalid');
      }
    });
  }
  
  /**
   * Configure les tooltips
   */
  function setupTooltips() {
    const tooltipElements = document.querySelectorAll('[data-toggle="tooltip"]');
    tooltipElements.forEach(el => {
      new bootstrap.Tooltip(el, {
        trigger: 'hover',
        placement: 'bottom'
      });
    });
  }
  
  /**
   * Configure le défilement fluide
   */
  function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }
  
  /**
   * Active la navigation par clavier pour les sections d'année
   */
  function enableKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
      // Ne pas gérer les raccourcis si l'édition est en cours
      if (document.activeElement.isContentEditable) return;
      
      // Navigation par flèches pour les années
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const yearSections = document.querySelectorAll('.year-section');
        const yearArray = Array.from(yearSections);
        
        // Trouver la section visible actuelle
        const currentSection = yearArray.find(section => {
          const rect = section.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        });
        
        if (currentSection) {
          const currentIndex = yearArray.indexOf(currentSection);
          let targetIndex;
          
          if (e.key === 'ArrowUp' && currentIndex > 0) {
            targetIndex = currentIndex - 1;
          } else if (e.key === 'ArrowDown' && currentIndex < yearArray.length - 1) {
            targetIndex = currentIndex + 1;
          }
          
          if (targetIndex !== undefined) {
            e.preventDefault();
            yearArray[targetIndex].scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }
      }
    });
  }
  
  /**
   * Gère le collage d'images
   * @param {Event} e - L'événement de collage
   */
  function handlePaste(e) {
    if (!AppState.isAdmin) return;
    
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;
    
    // Vérifier si le presse-papier contient une image
    const items = clipboardData.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        // Empêcher le comportement par défaut du collage
        e.preventDefault();
        
        // Obtenir le fichier image
        const file = items[i].getAsFile();
        if (file) {
          // Demander une description pour l'image
          const altText = prompt("Veuillez entrer une description pour cette image:", "");
          
          // Télécharger et insérer l'image
          uploadAndInsertImage(file, altText || "Image collée");
        }
        break;
      }
    }
  }
  
  // ===== FONCTION D'AUTHENTIFICATION =====
  
  /**
   * Vérifie la validité du formulaire de connexion
   * @return {Boolean} - true si le formulaire est valide, false sinon
   */
  function validateLoginForm() {
    const email = DOM.emailInput.value.trim();
    const password = DOM.passwordInput.value;
    
    DOM.authError.textContent = "";
    
    if (!email) {
      DOM.authError.textContent = "Veuillez saisir votre email.";
      DOM.emailInput.focus();
      return false;
    }
    
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      DOM.authError.textContent = "Veuillez saisir un email valide.";
      DOM.emailInput.focus();
      return false;
    }
    
    if (!password) {
      DOM.authError.textContent = "Veuillez saisir votre mot de passe.";
      DOM.passwordInput.focus();
      return false;
    }
    
    return true;
  }
  
  /**
   * Gère la connexion de l'utilisateur
   * @param {Event} e - L'événement de soumission du formulaire
   */
  function handleLogin(e) {
    e.preventDefault();
    
    if (!validateLoginForm()) return;
    
    const email = DOM.emailInput.value.trim();
    const password = DOM.passwordInput.value;
    
    // Désactiver le bouton et montrer le chargement
    DOM.loginBtn.disabled = true;
    DOM.loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    
    // Effectuer la connexion avec Firebase
    auth.signInWithEmailAndPassword(email, password)
      .catch((error) => {
        console.error("Erreur de connexion:", error);
        
        // Messages d'erreur personnalisés selon le code d'erreur
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
          DOM.authError.textContent = "Identifiants incorrects. Veuillez réessayer.";
        } else if (error.code === 'auth/too-many-requests') {
          DOM.authError.textContent = "Trop de tentatives. Veuillez réessayer plus tard.";
        } else if (error.code === 'auth/user-disabled') {
          DOM.authError.textContent = "Ce compte a été désactivé. Contactez l'administrateur.";
        } else {
          DOM.authError.textContent = "Erreur de connexion. Veuillez réessayer.";
        }
        
        // Animation pour attirer l'attention sur l'erreur
        DOM.authError.classList.add('shake-animation');
        setTimeout(() => {
          DOM.authError.classList.remove('shake-animation');
        }, 500);
      })
      .finally(() => {
        // Réinitialiser le bouton
        DOM.loginBtn.disabled = false;
        DOM.loginBtn.innerHTML = 'Se connecter';
      });
  }
  
  /**
   * Gère la déconnexion de l'utilisateur
   */
  function handleLogout() {
    // Vérifier s'il y a des modifications non sauvegardées
    if (AppState.contentModified) {
      if (!confirm("Vous avez des modifications non enregistrées. Voulez-vous vraiment vous déconnecter ?")) {
        return;
      }
    }
    
    const userId = auth.currentUser?.uid;
    
    auth.signOut()
      .then(() => {
        showLoginForm();
        showNotification('Vous avez été déconnecté', 'info');
        
        // Journaliser la déconnexion
        if (userId) {
          logAdminAction(userId, 'logout', 'Déconnexion réussie');
        }
      })
      .catch((error) => {
        console.error("Erreur lors de la déconnexion:", error);
        showNotification('Erreur lors de la déconnexion', 'error');
      });
  }
  
  // ===== FONCTIONS DE FORMATAGE ET MODALES =====
  
  /**
   * Formate le document avec la commande spécifiée
   * @param {String} command - La commande à exécuter
   * @param {String} value - La valeur à utiliser (optionnelle)
   */
  function formatDoc(command, value = null) {
    document.execCommand(command, false, value);
    DOM.editableContent.focus();
    AppState.contentModified = true;
    
    // Mettre à jour le titre de la page
    document.title = CONFIG.UNSAVED_CHANGES_TITLE;
    
    // Mettre à jour l'état visuel des boutons de formatage
    updateFormatButtons();
  }
  
  /**
   * Met à jour l'état visuel des boutons de formatage
   */
  function updateFormatButtons() {
    // Vérifier l'état des formatages
    const isBold = document.queryCommandState('bold');
    const isItalic = document.queryCommandState('italic');
    const isUnderline = document.queryCommandState('underline');
    
    // Mettre à jour les classes des boutons
    document.getElementById('bold-btn').classList.toggle('active', isBold);
    document.getElementById('italic-btn').classList.toggle('active', isItalic);
    document.getElementById('underline-btn').classList.toggle('active', isUnderline);
  }
  
  /**
   * Affiche la modale d'image
   */
  function showImageModal() {
    // Sauvegarder la sélection actuelle
    saveCurrentSelection();
    DOM.imageModal.style.display = 'block';
    DOM.imagePreview.style.display = 'none';
    document.getElementById('image-alt').value = '';
    
    // Réinitialiser le champ de fichier
    DOM.modalImageUpload.value = '';
    
    // Supprimer les anciennes barres de progression
    const progressContainers = document.querySelectorAll('.upload-progress');
    progressContainers.forEach(container => container.remove());
  }
  
  /**
   * Affiche la modale de lien
   */
  function showLinkModal() {
    // Sauvegarder la sélection actuelle
    saveCurrentSelection();
    DOM.linkModal.style.display = 'block';
    
    // Pré-remplir avec le texte sélectionné
    const selection = window.getSelection();
    if (selection.toString()) {
      document.getElementById('link-text').value = selection.toString();
    } else {
      document.getElementById('link-text').value = '';
    }
    
    // Vérifier si la sélection contient un lien
    let linkUrl = '';
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const parentEl = range.commonAncestorContainer.parentElement;
      
      if (parentEl && parentEl.tagName === 'A') {
        linkUrl = parentEl.href;
      }
    }
