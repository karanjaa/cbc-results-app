function showAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showUpgradeModal() {
    showAuthModal();
}

window.showAuthModal = showAuthModal;
window.closeAuthModal = closeAuthModal;
window.showUpgradeModal = showUpgradeModal;
