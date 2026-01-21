// Database Module for Portfolio Builder (Firebase Realtime Database)
const Database = {
    // Create user profile
    async createUserProfile(uid, profileData) {
        try {
            await database.ref(`users/${uid}/profile`).set(profileData);
            Storage.saveUserProfile(profileData);
            console.log('User profile created');
            return { success: true };
        } catch (error) {
            console.error('Create profile error:', error);
            return { success: false, error: error.message };
        }
    },

    // Load user profile
    async loadUserProfile(uid) {
        try {
            const snapshot = await database.ref(`users/${uid}/profile`).once('value');
            const profile = snapshot.val();

            if (profile) {
                Storage.saveUserProfile(profile);
                return { success: true, profile };
            } else {
                // Profile doesn't exist, create default
                const defaultProfile = {
                    email: Auth.currentUser?.email || '',
                    displayName: Auth.currentUser?.displayName || 'User',
                    createdAt: Date.now(),
                    subscription: 'free',
                    settings: { theme: 'dark' },
                    stats: { totalActivities: 0, totalHours: 0 }
                };
                await this.createUserProfile(uid, defaultProfile);
                return { success: true, profile: defaultProfile };
            }
        } catch (error) {
            console.error('Load profile error:', error);
            // Fall back to local storage
            const localProfile = Storage.getUserProfile();
            return { success: false, profile: localProfile, error: error.message };
        }
    },

    // Update user profile
    async updateUserProfile(uid, updates) {
        try {
            await database.ref(`users/${uid}/profile`).update(updates);

            // Update local storage
            const currentProfile = Storage.getUserProfile() || {};
            Storage.saveUserProfile({ ...currentProfile, ...updates });

            return { success: true };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, error: error.message };
        }
    },

    // Load all activities
    async loadActivities(uid) {
        try {
            const snapshot = await database.ref(`users/${uid}/activities`).once('value');
            const activitiesObj = snapshot.val() || {};

            // Convert object to array
            const activities = Object.keys(activitiesObj).map(key => ({
                id: key,
                ...activitiesObj[key]
            }));

            Storage.saveActivities(activities);
            return { success: true, activities };
        } catch (error) {
            console.error('Load activities error:', error);
            // Fall back to local storage
            const localActivities = Storage.getActivities();
            return { success: false, activities: localActivities, error: error.message };
        }
    },

    // Add new activity
    async addActivity(uid, activityData) {
        try {
            const newRef = database.ref(`users/${uid}/activities`).push();
            const activity = {
                ...activityData,
                id: newRef.key,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            await newRef.set(activity);

            // Update local storage
            const activities = Storage.getActivities();
            activities.push(activity);
            Storage.saveActivities(activities);

            // Update stats
            await this.updateActivityStats(uid);

            return { success: true, activity };
        } catch (error) {
            console.error('Add activity error:', error);
            return { success: false, error: error.message };
        }
    },

    // Update existing activity
    async updateActivity(uid, activityId, updates) {
        try {
            updates.updatedAt = Date.now();
            await database.ref(`users/${uid}/activities/${activityId}`).update(updates);

            // Update local storage
            const activities = Storage.getActivities();
            const index = activities.findIndex(a => a.id === activityId);
            if (index !== -1) {
                activities[index] = { ...activities[index], ...updates };
                Storage.saveActivities(activities);
            }

            // Update stats
            await this.updateActivityStats(uid);

            return { success: true };
        } catch (error) {
            console.error('Update activity error:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete activity
    async deleteActivity(uid, activityId) {
        try {
            await database.ref(`users/${uid}/activities/${activityId}`).remove();

            // Update local storage
            const activities = Storage.getActivities();
            const filtered = activities.filter(a => a.id !== activityId);
            Storage.saveActivities(filtered);

            // Update stats
            await this.updateActivityStats(uid);

            return { success: true };
        } catch (error) {
            console.error('Delete activity error:', error);
            return { success: false, error: error.message };
        }
    },

    // Update activity statistics
    async updateActivityStats(uid) {
        try {
            const activities = Storage.getActivities();
            const totalActivities = activities.length;
            const totalHours = activities.reduce((sum, a) => sum + (a.totalHours || 0), 0);

            await database.ref(`users/${uid}/profile/stats`).update({
                totalActivities,
                totalHours
            });

            // Update local storage
            const profile = Storage.getUserProfile() || {};
            profile.stats = { totalActivities, totalHours };
            Storage.saveUserProfile(profile);

            return { success: true };
        } catch (error) {
            console.error('Update stats error:', error);
            return { success: false, error: error.message };
        }
    },

    // Update subscription status
    async updateSubscription(uid, subscription) {
        try {
            await database.ref(`users/${uid}/profile`).update({
                subscription,
                subscriptionUpdatedAt: Date.now()
            });

            const profile = Storage.getUserProfile() || {};
            profile.subscription = subscription;
            Storage.saveUserProfile(profile);

            return { success: true };
        } catch (error) {
            console.error('Update subscription error:', error);
            return { success: false, error: error.message };
        }
    },

    // Listen for real-time updates (optional, for multi-device sync)
    listenForChanges(uid, callback) {
        database.ref(`users/${uid}/activities`).on('value', (snapshot) => {
            const activitiesObj = snapshot.val() || {};
            const activities = Object.keys(activitiesObj).map(key => ({
                id: key,
                ...activitiesObj[key]
            }));
            Storage.saveActivities(activities);
            if (callback) callback(activities);
        });
    },

    // Stop listening for changes
    stopListening(uid) {
        database.ref(`users/${uid}/activities`).off();
    }
};
