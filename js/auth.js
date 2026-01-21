// Authentication Module for Portfolio Builder
const Auth = {
    currentUser: null,

    // Initialize auth state listener
    init() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                console.log('User signed in:', user.email);

                // Load or create user profile
                await Database.loadUserProfile(user.uid);

                // Switch to dashboard
                App.onUserSignedIn(user);
            } else {
                this.currentUser = null;
                console.log('User signed out');
                App.onUserSignedOut();
            }
        });
    },

    // Sign up with email/password
    async signUp(email, password, displayName) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update display name
            await user.updateProfile({ displayName });

            // Create user profile in database
            await Database.createUserProfile(user.uid, {
                email: user.email,
                displayName: displayName,
                createdAt: Date.now(),
                subscription: 'free',
                settings: {
                    theme: 'dark'
                },
                stats: {
                    totalActivities: 0,
                    totalHours: 0
                }
            });

            return { success: true, user };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    },

    // Sign in with email/password
    async signIn(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    },

    // Sign in with Google
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const userCredential = await auth.signInWithPopup(provider);
            const user = userCredential.user;
            const isNewUser = userCredential.additionalUserInfo?.isNewUser;

            // Create profile for new users
            if (isNewUser) {
                await Database.createUserProfile(user.uid, {
                    email: user.email,
                    displayName: user.displayName || 'User',
                    createdAt: Date.now(),
                    subscription: 'free',
                    settings: {
                        theme: 'dark'
                    },
                    stats: {
                        totalActivities: 0,
                        totalHours: 0
                    }
                });
            }

            return { success: true, user };
        } catch (error) {
            console.error('Google sign in error:', error);
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    },

    // Sign out
    async signOut() {
        try {
            await auth.signOut();
            Storage.clear();
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    },

    // Send password reset email
    async resetPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    },

    // Get user-friendly error messages
    getErrorMessage(code) {
        const messages = {
            'auth/email-already-in-use': 'This email is already registered. Try signing in instead.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/operation-not-allowed': 'Email/password sign in is not enabled.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/popup-closed-by-user': 'Sign in was cancelled.',
            'auth/network-request-failed': 'Network error. Please check your connection.'
        };
        return messages[code] || 'An error occurred. Please try again.';
    },

    // Check if user is premium
    isPremium() {
        const profile = Storage.getUserProfile();
        return profile?.subscription === 'premium';
    },

    // Get current user's display name
    getDisplayName() {
        return this.currentUser?.displayName || 'User';
    },

    // Get initials for avatar
    getInitials() {
        const name = this.getDisplayName();
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
};
