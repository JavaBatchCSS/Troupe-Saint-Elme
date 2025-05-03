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
    
    // Création des références pour les modales (qui seront créées dynamiquement)
    imageModal: null,
    linkModal: null,
    yearModal: null,
    
    // Éléments des modales (qui seront définis après la création des modales)
    modalImageUpload: null,
    imagePreview: null,
    insertImageBtn: null,
    insertLinkBtn: null,
    createYearBtn: null,
    closeModalButtons: null,
    cancelButtons: null
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
    // Créer les modales nécessaires
    createModals();
    
    // Mettre à jour les références DOM pour les modales
    updateModalReferences();
    
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
    
    // Activer les tooltips (si disponible)
    setupTooltips();
    
    // Configurer la validation du formulaire
    setupFormValidation();
    
    // Configurer le défilement fluide
    setupSmoothScrolling();
  });
  
  /**
   * Crée les modales nécessaires pour l'édition
   */
  function createModals() {
    // Créer la modale d'images
    createImageModal();
    
    // Créer la modale de liens
    createLinkModal();
    
    // Créer la modale d'année
    createYearModal();
    
    // Créer la modale de notification
    createNotificationSystem();
  }
  
  /**
   * Crée la modale d'images
   */
  function createImageModal() {
    const imageModal = document.createElement('div');
    imageModal.id = 'image-modal';
    imageModal.className = 'modal';
    imageModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Insérer une image</h2>
          <span class="close-modal">&times;</span>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="modal-image-upload">Choisir une image</label>
            <input type="file" id="modal-image-upload" accept="image/*" class="form-control">
            <small class="form-text text-muted">Taille maximale: 2 MB. Formats supportés: JPG, PNG, GIF, WEBP</small>
          </div>
          <div id="image-preview-container">
            <img id="image-preview" alt="Aperçu de l'image" style="display: none; max-width: 100%; max-height: 200px; margin-top: 10px;">
          </div>
          <div class="form-group">
            <label for="image-alt">Description de l'image (alt)</label>
            <input type="text" id="image-alt" class="form-control" placeholder="Description pour l'accessibilité...">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn cancel-btn">Annuler</button>
          <button type="button" id="insert-image-btn" class="btn btn-primary">Insérer</button>
        </div>
      </div>
    `;
    document.body.appendChild(imageModal);
  }
  
  /**
   * Crée la modale de liens
   */
  function createLinkModal() {
    const linkModal = document.createElement('div');
    linkModal.id = 'link-modal';
    linkModal.className = 'modal';
    linkModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Insérer un lien</h2>
          <span class="close-modal">&times;</span>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="link-text">Texte du lien</label>
            <input type="text" id="link-text" class="form-control" placeholder="Texte à afficher">
          </div>
          <div class="form-group">
            <label for="link-url">URL du lien</label>
            <input type="url" id="link-url" class="form-control" placeholder="https://exemple.com">
          </div>
          <div class="form-group">
            <div class="form-check">
              <input type="checkbox" id="link-new-tab" class="form-check-input" checked>
              <label for="link-new-tab" class="form-check-label">Ouvrir dans un nouvel onglet</label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn cancel-btn">Annuler</button>
          <button type="button" id="insert-link-btn" class="btn btn-primary">Insérer</button>
        </div>
      </div>
    `;
    document.body.appendChild(linkModal);
  }
  
  /**
   * Crée la modale d'année
   */
  function createYearModal() {
    const yearModal = document.createElement('div');
    yearModal.id = 'year-modal';
    yearModal.className = 'modal';
    yearModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Ajouter une nouvelle année</h2>
          <span class="close-modal">&times;</span>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="year-value">Année</label>
            <input type="number" id="year-value" class="form-control" min="1900" max="2100" value="${new Date().getFullYear()}">
          </div>
          <div class="form-group">
            <label for="year-position">Position</label>
            <select id="year-position" class="form-control">
              <option value="start">Au début</option>
              <option value="end" selected>À la fin</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn cancel-btn">Annuler</button>
          <button type="button" id="create-year-btn" class="btn btn-primary">Créer</button>
        </div>
      </div>
    `;
    document.body.appendChild(yearModal);
  }
  
  /**
   * Crée le système de notification
   */
  function createNotificationSystem() {
    const notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.className = 'notification-container';
    document.body.appendChild(notificationContainer);
    
    // Ajouter le style CSS pour les notifications
    const style = document.createElement('style');
    style.textContent = `
      .notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
      }
      
      .notification {
        padding: 12px 15px;
        margin-bottom: 10px;
        min-width: 250px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        animation: slide-in 0.3s ease-out;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .notification.success {
        background-color: #4CAF50;
      }
      
      .notification.error {
        background-color: #F44336;
      }
      
      .notification.info {
        background-color: #2196F3;
      }
      
      .notification.warning {
        background-color: #FF9800;
      }
      
      .notification .close-notification {
        cursor: pointer;
        margin-left: 10px;
      }
      
      @keyframes slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes fade-out {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      .notification.fade-out {
        animation: fade-out 0.3s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Met à jour les références DOM pour les modales
   */
  function updateModalReferences() {
    // Mettre à jour les références aux modales
    DOM.imageModal = document.getElementById('image-modal');
    DOM.linkModal = document.getElementById('link-modal');
    DOM.yearModal = document.getElementById('year-modal');
    
    // Mettre à jour les références aux éléments des modales
    DOM.modalImageUpload = document.getElementById('modal-image-upload');
    DOM.imagePreview = document.getElementById('image-preview');
    DOM.insertImageBtn = document.getElementById('insert-image-btn');
    DOM.insertLinkBtn = document.getElementById('insert-link-btn');
    DOM.createYearBtn = document.getElementById('create-year-btn');
    
    // Mettre à jour les références aux boutons de fermeture
    DOM.closeModalButtons = document.querySelectorAll('.close-modal');
    DOM.cancelButtons = document.querySelectorAll('.cancel-btn');
  }
  
  /**
   * Crée une barre d'outils d'édition supplémentaire si elle n'existe pas déjà
   */
  function createEditorToolbar() {
    if (document.getElementById('formatting-toolbar')) return;
    
    const formattingToolbar = document.createElement('section');
    formattingToolbar.id = 'formatting-toolbar';
    formattingToolbar.className = 'formatting-toolbar hidden';
    formattingToolbar.innerHTML = `
      <div class="toolbar-group text-formatting">
        <button id="bold-btn" title="Gras (Ctrl+B)" class="btn-icon"><i class="fas fa-bold"></i></button>
        <button id="italic-btn" title="Italique (Ctrl+I)" class="btn-icon"><i class="fas fa-italic"></i></button>
        <button id="underline-btn" title="Souligné (Ctrl+U)" class="btn-icon"><i class="fas fa-underline"></i></button>
      </div>
      <div class="toolbar-group headings">
        <button id="h1-btn" title="Titre 1" class="btn-icon">H1</button>
        <button id="h2-btn" title="Titre 2" class="btn-icon">H2</button>
        <button id="h3-btn" title="Titre 3" class="btn-icon">H3</button>
      </div>
      <div class="toolbar-group alignment">
        <button id="align-left-btn" title="Aligner à gauche" class="btn-icon"><i class="fas fa-align-left"></i></button>
        <button id="align-center-btn" title="Centrer" class="btn-icon"><i class="fas fa-align-center"></i></button>
        <button id="align-right-btn" title="Aligner à droite" class="btn-icon"><i class="fas fa-align-right"></i></button>
      </div>
      <div class="toolbar-group lists">
        <button id="list-ul-btn" title="Liste à puces" class="btn-icon"><i class="fas fa-list-ul"></i></button>
        <button id="list-ol-btn" title="Liste numérotée" class="btn-icon"><i class="fas fa-list-ol"></i></button>
      </div>
      <div class="toolbar-group insertions">
        <button id="image-btn" title="Insérer une image" class="btn-icon"><i class="fas fa-image"></i></button>
        <button id="link-btn" title="Insérer un lien" class="btn-icon"><i class="fas fa-link"></i></button>
        <button id="add-year-btn" title="Ajouter une nouvelle année" class="btn-icon"><i class="fas fa-calendar-plus"></i></button>
      </div>
    `;
    
    // Insérer après la barre d'outils principale mais avant le conteneur de contenu
    DOM.editorToolbar.insertAdjacentElement('afterend', formattingToolbar);
  }
  
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
          
          // Créer la barre d'outils de formatage
          createEditorToolbar();
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
    
    // Afficher également la barre de formatage
    const formattingToolbar = document.getElementById('formatting-toolbar');
    if (formattingToolbar) {
      formattingToolbar.classList.remove('hidden');
    }
    
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
    
    // Masquer également la barre de formatage
    const formattingToolbar = document.getElementById('formatting-toolbar');
    if (formattingToolbar) {
      formattingToolbar.classList.add('hidden');
    }
    
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
   * Met en place les écouteurs d'événements pour les éléments dynamiques
   */
  function setupDynamicEventListeners() {
    // Boutons de déplacement et suppression d'années
    document.querySelectorAll('.move-up-btn').forEach(btn => {
      btn.addEventListener('click', moveYearUp);
    });
    
    document.querySelectorAll('.move-down-btn').forEach(btn => {
      btn.addEventListener('click', moveYearDown);
    });
    
    document.querySelectorAll('.delete-year-btn').forEach(btn => {
      btn.addEventListener('click', deleteYear);
    });
    
    // Gestionnaire pour les clics sur les images
    document.querySelectorAll('.content-image').forEach(img => {
      if (AppState.isAdmin) {
        img.addEventListener('click', function(e) {
          if (e.altKey) {
            e.preventDefault();
            editImageProperties(this);
          }
        });
      }
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
    
    // Ajouter des attributs de titre pour les liens
    const links = document.querySelectorAll('a');
    links.forEach(link => {
      if (!link.title && link.textContent.trim()) {
        link.title = link.textContent.trim();
      }
    });
  }
  
  /**
   * Nettoie le contenu avant de le sauvegarder
   */
  function cleanupContent() {
    // Supprimer les attributs de style inutiles
    const elements = DOM.editableContent.querySelectorAll('*');
    elements.forEach(el => {
      // Supprimer les attributs data- inutiles
      for (const attr of el.attributes) {
        if (attr.name.startsWith('data-') && !attr.name.startsWith('data-year')) {
          el.removeAttribute(attr.name);
        }
      }
      
      // Nettoyer les classes inutiles
      if (el.className) {
        const classes = el.className.split(' ');
        const cleanedClasses = classes.filter(cls => {
          return !cls.includes('Apple-') && !cls.includes('mso-') && cls !== '';
        });
        el.className = cleanedClasses.join(' ');
      }
    });
    
    // Supprimer les commentaires HTML
    const commentNodes = [];
    const walker = document.createTreeWalker(
      DOM.editableContent,
      NodeFilter.SHOW_COMMENT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      commentNodes.push(node);
    }
    
    commentNodes.forEach(comment => {
      comment.parentNode.removeChild(comment);
    });
    
    // Supprimer les espaces blancs inutiles
    DOM.editableContent.innerHTML = DOM.editableContent.innerHTML.replace(/>\s+</g, '><');
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
