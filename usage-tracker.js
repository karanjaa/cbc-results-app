const USAGE_KEY = 'cbc_grade_checker_usage';
const MAX_FREE_USES = 2;

function getUsageCount() {
    const stored = localStorage.getItem(USAGE_KEY);
    return stored ? parseInt(stored, 10) : 0;
}

function incrementUsage() {
    const current = getUsageCount();
    const newCount = current + 1;
    localStorage.setItem(USAGE_KEY, newCount.toString());
    return newCount;
}

function hasReachedLimit() {
    return getUsageCount() >= MAX_FREE_USES;
}

function getRemainingUses() {
    const remaining = MAX_FREE_USES - getUsageCount();
    return Math.max(0, remaining);
}

function checkUsageLimitAndPrompt() {
    const usageCount = incrementUsage();

    if (usageCount > MAX_FREE_USES) {
        if (typeof showUpgradeModal === 'function') {
            showUpgradeModal();
        }
        return false;
    }

    if (usageCount === MAX_FREE_USES) {
        showLimitReachedBanner();
    } else if (usageCount === MAX_FREE_USES - 1) {
        showOneUseLeftBanner();
    }

    return true;
}

function showOneUseLeftBanner() {
    const banner = document.createElement('div');
    banner.className = 'bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4 rounded-r-lg';
    banner.innerHTML = `
        <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <div>
                <p class="text-yellow-800 font-semibold">1 free check remaining</p>
                <p class="text-yellow-700 text-sm">After your next check, you'll need to create a free account to continue.</p>
            </div>
        </div>
    `;

    const resultDiv = document.getElementById('gradeResult');
    if (resultDiv && resultDiv.firstChild) {
        resultDiv.insertBefore(banner, resultDiv.firstChild);
    }
}

function showLimitReachedBanner() {
    const banner = document.createElement('div');
    banner.className = 'bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-r-lg';
    banner.innerHTML = `
        <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
            <div class="flex-1">
                <p class="text-blue-800 font-semibold mb-2">You've reached your free limit</p>
                <p class="text-blue-700 text-sm mb-3">Create a free account to continue checking grades and unlock PDF upload features with a 7-day trial.</p>
                <button onclick="showAuthModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold text-sm">
                    Create Free Account
                </button>
            </div>
        </div>
    `;

    const resultDiv = document.getElementById('gradeResult');
    if (resultDiv && resultDiv.firstChild) {
        resultDiv.insertBefore(banner, resultDiv.firstChild);
    }
}

window.getUsageCount = getUsageCount;
window.incrementUsage = incrementUsage;
window.hasReachedLimit = hasReachedLimit;
window.getRemainingUses = getRemainingUses;
window.checkUsageLimitAndPrompt = checkUsageLimitAndPrompt;
