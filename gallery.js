document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const galleryImages = [
        { src: 'images/photo1.jpg', alt: 'Photo 1' },
        { src: 'images/photo2.jpg', alt: 'Photo 2' },
        { src: 'images/photo3.jpg', alt: 'Photo 3' },
        { src: 'images/photo4.jpg', alt: 'Photo 4' },
        // Ajoutez ici d'autres images selon vos besoins
    ];
    
    // Éléments DOM
    const showcaseImage = document.getElementById('showcase-current');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const thumbnailsContainer = document.getElementById('thumbnails-container');
    
    // Variables d'état
    let currentIndex = 0;
    let touchStartX = 0;
    let touchEndX = 0;
    
    // Initialisation
    function initGallery() {
        // Générer les miniatures
        galleryImages.forEach((image, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnail.innerHTML = `<img src="${image.src}" alt="${image.alt} miniature">`;
            thumbnail.setAttribute('data-index', index);
            thumbnail.addEventListener('click', () => {
                setCurrentImage(index);
            });
            thumbnailsContainer.appendChild(thumbnail);
        });
        
        // Configurer les écouteurs d'événements
        prevBtn.addEventListener('click', showPrevImage);
        nextBtn.addEventListener('click', showNextImage);
        
        // Écouteurs d'événements pour les touches clavier
        document.addEventListener('keydown', handleKeyDown);
        
        // Écouteurs d'événements pour les gestes tactiles
        showcaseImage.addEventListener('touchstart', handleTouchStart);
        showcaseImage.addEventListener('touchend', handleTouchEnd);
    }
    
    // Définir l'image actuelle
    function setCurrentImage(index) {
        // Mettre à jour les classes des miniatures
        const thumbnails = thumbnailsContainer.querySelectorAll('.thumbnail');
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        thumbnails[index].classList.add('active');
        
        // Faire défiler la miniature active dans la vue si nécessaire
        thumbnails[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        
        // Animer le changement d'image
        showcaseImage.classList.remove('fade-in');
        void showcaseImage.offsetWidth; // Forcer le reflow pour réinitialiser l'animation
        
        // Changer l'image
        showcaseImage.src = galleryImages[index].src;
        showcaseImage.alt = galleryImages[index].alt;
        showcaseImage.classList.add('fade-in');
        
        // Mettre à jour l'index courant
        currentIndex = index;
    }
    
    // Naviguer vers l'image précédente
    function showPrevImage() {
        const newIndex = currentIndex > 0 ? currentIndex - 1 : galleryImages.length - 1;
        setCurrentImage(newIndex);
    }
    
    // Naviguer vers l'image suivante
    function showNextImage() {
        const newIndex = currentIndex < galleryImages.length - 1 ? currentIndex + 1 : 0;
        setCurrentImage(newIndex);
    }
    
    // Gérer les touches du clavier
    function handleKeyDown(event) {
        if (event.key === 'ArrowLeft') {
            showPrevImage();
        } else if (event.key === 'ArrowRight') {
            showNextImage();
        }
    }
    
    // Gérer le toucher initial
    function handleTouchStart(event) {
        touchStartX = event.changedTouches[0].screenX;
    }
    
    // Gérer la fin du toucher
    function handleTouchEnd(event) {
        touchEndX = event.changedTouches[0].screenX;
        handleSwipe();
    }
    
    // Gérer le balayage
    function handleSwipe() {
        const minSwipeDistance = 50;
        const swipeDistance = touchEndX - touchStartX;
        
        if (swipeDistance > minSwipeDistance) {
            // Balayage de gauche à droite -> image précédente
            showPrevImage();
        } else if (swipeDistance < -minSwipeDistance) {
            // Balayage de droite à gauche -> image suivante
            showNextImage();
        }
    }
    
    // Démarrer la galerie
    initGallery();
});
