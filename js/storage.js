// Local Storage Module for Portfolio Builder
const Storage = {
    prefix: 'portfolio_',

    // Get item from localStorage
    get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Storage get error:', e);
            return null;
        }
    },

    // Set item in localStorage
    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },

    // Remove item from localStorage
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },

    // Clear all portfolio data
    clear() {
        try {
            const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
            keys.forEach(k => localStorage.removeItem(k));
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    },

    // Activity-specific methods
    getActivities() {
        return this.get('activities') || [];
    },

    saveActivities(activities) {
        return this.set('activities', activities);
    },

    // User profile methods
    getUserProfile() {
        return this.get('userProfile') || null;
    },

    saveUserProfile(profile) {
        return this.set('userProfile', profile);
    },

    // Settings methods
    getSettings() {
        return this.get('settings') || {
            theme: 'dark'
        };
    },

    saveSettings(settings) {
        return this.set('settings', settings);
    }
};
