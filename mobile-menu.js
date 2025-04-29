// Script pour le menu mobile
document.addEventListener('DOMContentLoaded', function() {
    // Créer le bouton de menu mobile
    const createMobileMenuButton = function() {
        const header = document.querySelector('header');
        const nav = document.querySelector('nav');
        
        if (!header || !nav) return;
        
        // Créer le bouton de menu
        const menuButton = document.createElement('button');
        menuButton.classList.add('mobile-menu-button');
        menuButton.setAttribute('aria-label', 'Menu');
        menuButton.innerHTML = `
            <span class="menu-icon">
                <span class="bar"></span>
                <span class="bar"></span>
                <span class="bar"></span>
            </span>
        `;
        
        // Insérer le bouton avant la navigation
        header.insertBefore(menuButton, nav);
        
        // Ajouter la classe "mobile-nav" à la navigation
        nav.classList.add('mobile-nav');
        
        // Ajouter un écouteur d'événements pour le clic sur le bouton
        menuButton.addEventListener('click', function() {
            nav.classList.toggle('mobile-nav-active');
            menuButton.classList.toggle('active');
        });
        
        // Fermer le menu lorsqu'un lien est cliqué
        const navLinks = nav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                nav.classList.remove('mobile-nav-active');
                menuButton.classList.remove('active');
            });
        });
        
        // Fermer le menu lorsque l'utilisateur clique en dehors
        document.addEventListener('click', function(event) {
            const isClickInsideNav = nav.contains(event.target);
            const isClickOnButton = menuButton.contains(event.target);
            
            if (!isClickInsideNav && !isClickOnButton && nav.classList.contains('mobile-nav-active')) {
                nav.classList.remove('mobile-nav-active');
                menuButton.classList.remove('active');
            }
        });
    };
    
    // Appliquer le menu mobile uniquement sur les petits écrans
    const applyMobileMenu = function() {
        const windowWidth = window.innerWidth;
        const existingButton = document.querySelector('.mobile-menu-button');
        
        if (windowWidth <= 768) {
            if (!existingButton) {
                createMobileMenuButton();
            }
        } else {
            if (existingButton) {
                existingButton.remove();
                const nav = document.querySelector('nav');
                if (nav) {
                    nav.classList.remove('mobile-nav');
                    nav.classList.remove('mobile-nav-active');
                }
            }
        }
    };
    
    // Appliquer le menu mobile au chargement
    applyMobileMenu();
    
    // Réappliquer lors du redimensionnement de la fenêtre
    window.addEventListener('resize', applyMobileMenu);
});
