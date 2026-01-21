// Main App Controller for Portfolio Builder
const App = {
    currentView: 'auth',
    currentModal: null,

    // Initialize the application
    init() {
        console.log('Initializing Portfolio Builder...');

        // Initialize modules
        Auth.init();
        Portfolio.init();
        Export.init();

        // Setup event listeners
        this.setupEventListeners();

        console.log('Portfolio Builder initialized');
    },

    // Setup all event listeners
    setupEventListeners() {
        // Auth form switching
        document.getElementById('show-signup-btn')?.addEventListener('click', () => {
            this.showAuthForm('signup');
        });

        document.getElementById('show-login-btn')?.addEventListener('click', () => {
            this.showAuthForm('login');
        });

        document.getElementById('forgot-password-btn')?.addEventListener('click', () => {
            this.showAuthForm('forgot');
        });

        document.getElementById('back-to-login-btn')?.addEventListener('click', () => {
            this.showAuthForm('login');
        });

        // Auth form submissions
        document.getElementById('login-form-element')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Signing in...';

            const result = await Auth.signIn(email, password);

            btn.disabled = false;
            btn.textContent = 'Sign In';

            if (!result.success) {
                this.showToast(result.error, 'error');
            }
        });

        document.getElementById('signup-form-element')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;

            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Creating account...';

            const result = await Auth.signUp(email, password, name);

            btn.disabled = false;
            btn.textContent = 'Create Account';

            if (!result.success) {
                this.showToast(result.error, 'error');
            }
        });

        document.getElementById('forgot-form-element')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value;

            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Sending...';

            const result = await Auth.resetPassword(email);

            btn.disabled = false;
            btn.textContent = 'Send Reset Link';

            if (result.success) {
                this.showToast('Password reset email sent!', 'success');
                this.showAuthForm('login');
            } else {
                this.showToast(result.error, 'error');
            }
        });

        // Google auth buttons
        document.getElementById('google-login-btn')?.addEventListener('click', async () => {
            const result = await Auth.signInWithGoogle();
            if (!result.success) {
                this.showToast(result.error, 'error');
            }
        });

        document.getElementById('google-signup-btn')?.addEventListener('click', async () => {
            const result = await Auth.signInWithGoogle();
            if (!result.success) {
                this.showToast(result.error, 'error');
            }
        });

        // Navigation buttons
        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.showView('settings');
        });

        document.getElementById('settings-back-btn')?.addEventListener('click', () => {
            this.showView('dashboard');
        });

        document.getElementById('export-btn')?.addEventListener('click', () => {
            this.showModal('export-modal');
        });

        // User menu
        document.getElementById('user-menu-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('user-dropdown');
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            document.getElementById('user-dropdown').style.display = 'none';
        });

        document.getElementById('logout-btn')?.addEventListener('click', async () => {
            await Auth.signOut();
        });

        // Upgrade buttons
        document.getElementById('upgrade-btn')?.addEventListener('click', () => {
            document.getElementById('user-dropdown').style.display = 'none';
            this.showModal('pricing-modal');
        });

        document.getElementById('settings-upgrade-btn')?.addEventListener('click', () => {
            this.showModal('pricing-modal');
        });

        document.getElementById('prompt-upgrade-btn')?.addEventListener('click', () => {
            this.closeModal();
            this.showModal('pricing-modal');
        });

        // Add activity buttons
        document.getElementById('add-activity-btn')?.addEventListener('click', () => {
            Portfolio.openAddModal();
        });

        document.getElementById('empty-add-btn')?.addEventListener('click', () => {
            Portfolio.openAddModal();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                Portfolio.filter(btn.dataset.filter);
            });
        });

        // Sort select
        document.getElementById('sort-select')?.addEventListener('change', (e) => {
            Portfolio.sort(e.target.value);
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        // Close modal on overlay click
        document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') {
                this.closeModal();
            }
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.closeModal();
            }
        });

        // Settings form
        document.getElementById('save-profile-btn')?.addEventListener('click', async () => {
            const uid = Auth.currentUser?.uid;
            if (!uid) return;

            const updates = {
                displayName: document.getElementById('settings-name').value.trim(),
                gradYear: document.getElementById('settings-grad-year').value,
                bio: document.getElementById('settings-bio').value.trim()
            };

            const result = await Database.updateUserProfile(uid, updates);

            if (result.success) {
                // Update Firebase Auth display name
                if (Auth.currentUser && updates.displayName) {
                    await Auth.currentUser.updateProfile({ displayName: updates.displayName });
                }
                this.showToast('Profile saved!', 'success');
                this.updateUserUI();
            } else {
                this.showToast('Failed to save profile', 'error');
            }
        });

        // Pricing modal checkout buttons (placeholder)
        document.getElementById('checkout-monthly-btn')?.addEventListener('click', () => {
            this.showToast('Stripe checkout coming soon!', 'warning');
        });

        document.getElementById('checkout-annual-btn')?.addEventListener('click', () => {
            this.showToast('Stripe checkout coming soon!', 'warning');
        });
    },

    // Show auth form (login, signup, or forgot)
    showAuthForm(form) {
        document.getElementById('login-form').style.display = form === 'login' ? 'block' : 'none';
        document.getElementById('signup-form').style.display = form === 'signup' ? 'block' : 'none';
        document.getElementById('forgot-form').style.display = form === 'forgot' ? 'block' : 'none';
    },

    // Show view
    showView(viewName) {
        this.currentView = viewName;

        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.style.display = 'none';
        });

        // Show requested view
        const view = document.getElementById(`${viewName}-view`);
        if (view) {
            view.style.display = 'block';
        }

        // Load settings if showing settings view
        if (viewName === 'settings') {
            this.loadSettings();
        }
    },

    // Show modal
    showModal(modalId) {
        const overlay = document.getElementById('modal-overlay');
        const modal = document.getElementById(modalId);

        if (overlay && modal) {
            // Hide all modals first
            document.querySelectorAll('.modal').forEach(m => {
                m.style.display = 'none';
            });

            overlay.style.display = 'flex';
            modal.style.display = 'block';
            this.currentModal = modalId;

            // Focus first input if exists
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    },

    // Close modal
    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }

        document.querySelectorAll('.modal').forEach(m => {
            m.style.display = 'none';
        });

        this.currentModal = null;
    },

    // Show toast notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = this.getToastIcon(type);
        toast.innerHTML = `${icon}<span>${message}</span>`;

        container.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Get icon for toast type
    getToastIcon(type) {
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };
        return icons[type] || icons.info;
    },

    // Called when user signs in
    async onUserSignedIn(user) {
        this.showView('dashboard');
        this.updateUserUI();
        await Portfolio.load();
    },

    // Called when user signs out
    onUserSignedOut() {
        this.showView('auth');
        this.showAuthForm('login');
        Portfolio.activities = [];
        Portfolio.render();
    },

    // Update user-related UI elements
    updateUserUI() {
        const profile = Storage.getUserProfile() || {};
        const displayName = Auth.getDisplayName();
        const initials = Auth.getInitials();

        // Update avatar
        const avatar = document.getElementById('user-avatar');
        if (avatar) {
            avatar.textContent = initials;
        }

        // Update dropdown
        document.getElementById('user-name').textContent = displayName;
        document.getElementById('user-email').textContent = Auth.currentUser?.email || '';

        // Update subscription status
        const isPremium = Auth.isPremium();
        const subscriptionStatus = document.getElementById('subscription-status');
        if (subscriptionStatus) {
            subscriptionStatus.querySelector('.subscription-plan').textContent =
                isPremium ? 'Premium Plan' : 'Free Plan';
            subscriptionStatus.querySelector('.subscription-detail').textContent =
                isPremium ? 'Unlimited activities' : '3 activities limit';

            const upgradeBtn = subscriptionStatus.querySelector('button');
            if (upgradeBtn) {
                upgradeBtn.style.display = isPremium ? 'none' : 'block';
            }
        }

        // Show/hide upgrade button in dropdown
        const upgradeBtn = document.getElementById('upgrade-btn');
        if (upgradeBtn) {
            upgradeBtn.style.display = isPremium ? 'none' : 'flex';
        }

        // Update premium features visibility
        document.querySelectorAll('.premium-feature').forEach(el => {
            el.classList.toggle('premium-locked', !isPremium);
        });
    },

    // Load settings into form
    loadSettings() {
        const profile = Storage.getUserProfile() || {};

        document.getElementById('settings-name').value = Auth.getDisplayName();
        document.getElementById('settings-grad-year').value = profile.gradYear || '';
        document.getElementById('settings-bio').value = profile.bio || '';
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
