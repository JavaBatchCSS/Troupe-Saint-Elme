document.addEventListener("DOMContentLoaded", function () {
    const galleryItems = document.querySelectorAll(".gallery-item img");
    const lightbox = document.getElementById("lightbox");
    const lightboxImage = document.getElementById("lightbox-image");
    const closeLightbox = document.getElementById("close-lightbox");

    // Ouvrir la visionneuse lorsque l'image est cliquée
    galleryItems.forEach(item => {
        item.addEventListener("click", function () {
            lightboxImage.src = this.src;
            lightbox.style.display = "flex";
        });
    });

    // Fermer la visionneuse lorsque le bouton de fermeture est cliqué
    closeLightbox.addEventListener("click", function () {
        lightbox.style.display = "none";
        lightboxImage.src = "";
    });

    // Fermer la visionneuse en cliquant en dehors de l'image
    lightbox.addEventListener("click", function (e) {
        if (e.target !== lightboxImage && e.target !== closeLightbox) {
            lightbox.style.display = "none";
            lightboxImage.src = "";
        }
    });
});
