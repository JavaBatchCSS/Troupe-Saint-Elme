document.addEventListener('DOMContentLoaded', function() {
    // Configuration de la galerie
    const galleryConfig = {
        images: [
            { src: "images/photo1.jpg", alt: "Photo 1", caption: "Description de la photo 1" },
            { src: "images/photo2.jpg", alt: "Photo 2", caption: "Description de la photo 2" },
            { src: "images/photo3.jpg", alt: "Photo 3", caption: "Description de la photo 3" },
            { src: "images/photo4.jpg", alt: "Photo 4", caption: "Description de la photo 4" },
            { src: "images/installations.jpg", alt: "Installations", caption: "Nos installations" },
            { src: "images/concours_cuisine.jpg", alt: "Concours cuisine", caption: "Concours de cuisine" },
            { src: "images/vie_troupe.jpg", alt: "Vie de troupe", caption: "La vie de la troupe" }
            // Ajoutez ici d'autres images selon vos besoins
        ],
        showCaptions: true,              // Afficher les légendes sous les images
        enableLightbox: true,            // Activer la visionneuse en plein écran
        enableLazyLoading: true,         // Chargement progressif des images
        hoverEffect: 'zoom',             // Effet au survol (zoom, fade, slide)
        gridColumns: {
            mobile: 2,                   // Nombre de colonnes sur mobile
            tablet: 3,                   // Nombre de colonnes sur tablette
            desktop: 4                   // Nombre de colonnes sur desktop
        }
    };

    // Initialisation de la galerie
    initGallery(galleryConfig);

    // Fonction pour initialiser la galerie
    function initGallery(config) {
        const gallery = document.getElementById('photo-gallery');
        const lightbox = document.getElementById('lightbox');
        const lightboxImage = document.getElementById('lightbox-image');
        const lightboxCaption = document.getElementById('lightbox-caption');
        const closeLightbox = document.getElementById('close-lightbox');
        const prevButton = document.getElementById('prev-button');
        const nextButton = document.getElementById('next-button');
        
        let currentIndex = 0;

        // Création des éléments de la galerie
        config.images.forEach((image, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            
            const img = document.createElement('img');
            img.src = image.src;
            img.alt = image.alt;
            
            if (config.enableLazyLoading) {
                img.loading = 'lazy';
            }
            
            if (config.hoverEffect) {
                item.classList.add(`hover-${config.hoverEffect}`);
            }
            
            item.appendChild(img);
            
            if (config.showCaptions) {
                const caption = document.createElement('div');
                caption.className = 'gallery-caption';
                caption.textContent = image.caption;
                item.appendChild(caption);
            }
            
            // Événement de clic pour ouvrir la visionneuse
            if (config.enableLightbox) {
                item.addEventListener('click', function() {
                    openLightbox(index);
                });
            }
            
            gallery.appendChild(item);
        });
        
        // Fonction pour ouvrir la visionneuse
        function openLightbox(index) {
            currentIndex = index;
            updateLightboxContent();
            lightbox.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Empêcher le défilement du body
        }
        
        // Fonction pour fermer la visionneuse
        function closeLightboxView() {
            lightbox.style.display = 'none';
            document.body.style.overflow = ''; // Restaurer le défilement du body
        }
        
        // Fonction pour mettre à jour le contenu de la visionneuse
        function updateLightboxContent() {
            const image = config.images[currentIndex];
            lightboxImage.src = image.src;
            lightboxImage.alt = image.alt;
            
            if (config.showCaptions) {
                lightboxCaption.textContent = image.caption;
                lightboxCaption.style.display = 'block';
            } else {
                lightboxCaption.style.display = 'none';
            }
        }
        
        // Fonction pour naviguer vers l'image précédente
        function navigatePrev() {
            currentIndex = (currentIndex - 1 + config.images.length) % config.images.length;
            updateLightboxContent();
        }
        
        // Fonction pour naviguer vers l'image suivante
        function navigateNext() {
            currentIndex = (currentIndex + 1) % config.images.length;
            updateLightboxContent();
        }
        
        // Événements pour la visionneuse
        closeLightbox.addEventListener('click', closeLightboxView);
        prevButton.addEventListener('click', navigatePrev);
        nextButton.addEventListener('click', navigateNext);
        
        // Fermer la visionneuse en cliquant en dehors de l'image
        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox) {
                closeLightboxView();
            }
        });
        
        // Navigation avec les touches du clavier
        document.addEventListener('keydown', function(e) {
            if (lightbox.style.display === 'flex') {
                if (e.key === 'Escape') {
                    closeLightboxView();
                } else if (e.key === 'ArrowLeft') {
                    navigatePrev();
                } else if (e.key === 'ArrowRight') {
                    navigateNext();
                }
            }
        });
        
        // Appliquer les styles de la grille en fonction des configurations
        gallery.style.gridTemplateColumns = `repeat(${config.gridColumns.desktop}, 1fr)`;
        
        // Ajuster la grille pour les appareils mobiles
        function adjustGridForScreenSize() {
            const width = window.innerWidth;
            if (width < 768) {
                gallery.style.gridTemplateColumns = `repeat(${config.gridColumns.mobile}, 1fr)`;
            } else if (width < 1024) {
                gallery.style.gridTemplateColumns = `repeat(${config.gridColumns.tablet}, 1fr)`;
            } else {
                gallery.style.gridTemplateColumns = `repeat(${config.gridColumns.desktop}, 1fr)`;
            }
        }
        
        // Ajuster la grille au redimensionnement de la fenêtre
        window.addEventListener('resize', adjustGridForScreenSize);
        
        // Initialiser la grille au chargement
        adjustGridForScreenSize();
    }
});
