// Portfolio Module for Portfolio Builder
const Portfolio = {
    activities: [],
    currentFilter: 'all',
    currentSort: 'newest',
    editingActivityId: null,

    // Activity type icons and labels
    types: {
        club: { icon: '&#127979;', label: 'Club' },
        sport: { icon: '&#9917;', label: 'Sport' },
        volunteer: { icon: '&#129309;', label: 'Volunteer' },
        work: { icon: '&#128188;', label: 'Work' },
        award: { icon: '&#127942;', label: 'Award' },
        project: { icon: '&#128187;', label: 'Project' },
        other: { icon: '&#128204;', label: 'Other' }
    },

    // Free tier limit
    FREE_LIMIT: 3,

    // Initialize portfolio
    init() {
        this.activities = Storage.getActivities() || [];
        this.setupEventListeners();
        this.render();
    },

    // Load activities from database
    async load() {
        if (!Auth.currentUser) return;

        const result = await Database.loadActivities(Auth.currentUser.uid);
        this.activities = result.activities || [];
        this.render();
    },

    // Setup event listeners
    setupEventListeners() {
        // Skills tag input
        const skillsInput = document.getElementById('skills-input');
        if (skillsInput) {
            skillsInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addSkillTag(skillsInput.value.trim());
                    skillsInput.value = '';
                }
            });
        }

        // Activity form submission
        const activityForm = document.getElementById('activity-form');
        if (activityForm) {
            activityForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveActivity();
            });
        }

        // Ongoing checkbox
        const ongoingCheckbox = document.getElementById('activity-ongoing');
        if (ongoingCheckbox) {
            ongoingCheckbox.addEventListener('change', (e) => {
                document.getElementById('activity-end').disabled = e.target.checked;
                if (e.target.checked) {
                    document.getElementById('activity-end').value = '';
                }
            });
        }

        // Hours calculation
        const hoursWeek = document.getElementById('activity-hours-week');
        const startDate = document.getElementById('activity-start');
        const endDate = document.getElementById('activity-end');

        [hoursWeek, startDate, endDate].forEach(el => {
            if (el) {
                el.addEventListener('change', () => this.calculateTotalHours());
            }
        });

        // Add achievement button
        const addAchievementBtn = document.getElementById('add-achievement-btn');
        if (addAchievementBtn) {
            addAchievementBtn.addEventListener('click', () => this.addAchievementInput());
        }
    },

    // Check if user can add more activities
    canAddMore() {
        if (Auth.isPremium()) return true;
        return this.activities.length < this.FREE_LIMIT;
    },

    // Get remaining activity slots for free users
    getRemainingSlots() {
        if (Auth.isPremium()) return Infinity;
        return Math.max(0, this.FREE_LIMIT - this.activities.length);
    },

    // Open add activity modal
    openAddModal() {
        if (!this.canAddMore()) {
            App.showModal('upgrade-prompt-modal');
            return;
        }

        this.editingActivityId = null;
        this.resetForm();
        document.getElementById('activity-modal-title').textContent = 'Add Activity';
        document.getElementById('save-activity-btn').textContent = 'Save Activity';
        App.showModal('activity-modal');
    },

    // Open edit activity modal
    openEditModal(activityId) {
        const activity = this.activities.find(a => a.id === activityId);
        if (!activity) return;

        this.editingActivityId = activityId;
        this.populateForm(activity);
        document.getElementById('activity-modal-title').textContent = 'Edit Activity';
        document.getElementById('save-activity-btn').textContent = 'Update Activity';
        App.showModal('activity-modal');
    },

    // Reset the activity form
    resetForm() {
        document.getElementById('activity-form').reset();
        document.getElementById('skills-tags').innerHTML = '';
        document.getElementById('achievements-list').innerHTML = '';
        document.getElementById('activity-id').value = '';
        document.getElementById('activity-end').disabled = false;
        this.addAchievementInput(); // Add one empty achievement input
    },

    // Populate form with activity data
    populateForm(activity) {
        document.getElementById('activity-type').value = activity.type || '';
        document.getElementById('activity-title').value = activity.title || '';
        document.getElementById('activity-org').value = activity.organization || '';
        document.getElementById('activity-role').value = activity.role || '';
        document.getElementById('activity-description').value = activity.description || '';
        document.getElementById('activity-start').value = activity.startDate || '';
        document.getElementById('activity-end').value = activity.endDate || '';
        document.getElementById('activity-ongoing').checked = !activity.endDate;
        document.getElementById('activity-end').disabled = !activity.endDate;
        document.getElementById('activity-hours-week').value = activity.hoursPerWeek || '';
        document.getElementById('activity-total-hours').value = activity.totalHours || '';
        document.getElementById('activity-id').value = activity.id;

        // Populate skills
        const skillsContainer = document.getElementById('skills-tags');
        skillsContainer.innerHTML = '';
        (activity.skills || []).forEach(skill => this.addSkillTag(skill));

        // Populate achievements
        const achievementsList = document.getElementById('achievements-list');
        achievementsList.innerHTML = '';
        if (activity.achievements && activity.achievements.length > 0) {
            activity.achievements.forEach(achievement => this.addAchievementInput(achievement));
        } else {
            this.addAchievementInput();
        }
    },

    // Add skill tag
    addSkillTag(skill) {
        if (!skill) return;

        const skillsContainer = document.getElementById('skills-tags');
        const existingSkills = Array.from(skillsContainer.querySelectorAll('.tag'))
            .map(t => t.textContent.replace('×', '').trim().toLowerCase());

        if (existingSkills.includes(skill.toLowerCase())) return;

        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.innerHTML = `${skill}<button type="button" class="tag-remove">&times;</button>`;

        tag.querySelector('.tag-remove').addEventListener('click', () => tag.remove());

        skillsContainer.appendChild(tag);
    },

    // Add achievement input
    addAchievementInput(value = '') {
        const achievementsList = document.getElementById('achievements-list');
        const div = document.createElement('div');
        div.className = 'achievement-item';
        div.innerHTML = `
            <input type="text" class="achievement-input" placeholder="e.g., Won regional championship" value="${value}">
            <button type="button" class="btn-icon remove-achievement">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

        div.querySelector('.remove-achievement').addEventListener('click', () => {
            if (achievementsList.querySelectorAll('.achievement-item').length > 1) {
                div.remove();
            }
        });

        achievementsList.appendChild(div);
    },

    // Calculate total hours based on dates and hours per week
    calculateTotalHours() {
        const hoursPerWeek = parseFloat(document.getElementById('activity-hours-week').value) || 0;
        const startDateStr = document.getElementById('activity-start').value;
        const endDateStr = document.getElementById('activity-end').value;
        const ongoing = document.getElementById('activity-ongoing').checked;

        if (!startDateStr || !hoursPerWeek) {
            document.getElementById('activity-total-hours').value = '';
            return;
        }

        const startDate = new Date(startDateStr + '-01');
        const endDate = ongoing ? new Date() : (endDateStr ? new Date(endDateStr + '-01') : new Date());

        const weeks = Math.max(1, Math.ceil((endDate - startDate) / (7 * 24 * 60 * 60 * 1000)));
        const totalHours = Math.round(weeks * hoursPerWeek);

        document.getElementById('activity-total-hours').value = totalHours;
    },

    // Save activity (add or update)
    async saveActivity() {
        const formData = this.getFormData();

        if (!formData.title || !formData.description || !formData.startDate) {
            App.showToast('Please fill in all required fields', 'error');
            return;
        }

        const uid = Auth.currentUser?.uid;
        if (!uid) {
            App.showToast('Please sign in to save activities', 'error');
            return;
        }

        let result;
        if (this.editingActivityId) {
            result = await Database.updateActivity(uid, this.editingActivityId, formData);
        } else {
            result = await Database.addActivity(uid, formData);
        }

        if (result.success) {
            await this.load();
            App.closeModal();
            App.showToast(this.editingActivityId ? 'Activity updated!' : 'Activity added!', 'success');
        } else {
            App.showToast(result.error || 'Failed to save activity', 'error');
        }
    },

    // Get form data
    getFormData() {
        const skills = Array.from(document.querySelectorAll('#skills-tags .tag'))
            .map(t => t.textContent.replace('×', '').trim());

        const achievements = Array.from(document.querySelectorAll('.achievement-input'))
            .map(input => input.value.trim())
            .filter(a => a);

        const ongoing = document.getElementById('activity-ongoing').checked;

        return {
            type: document.getElementById('activity-type').value,
            title: document.getElementById('activity-title').value.trim(),
            organization: document.getElementById('activity-org').value.trim(),
            role: document.getElementById('activity-role').value.trim(),
            description: document.getElementById('activity-description').value.trim(),
            startDate: document.getElementById('activity-start').value,
            endDate: ongoing ? null : document.getElementById('activity-end').value,
            hoursPerWeek: parseFloat(document.getElementById('activity-hours-week').value) || 0,
            totalHours: parseFloat(document.getElementById('activity-total-hours').value) || 0,
            skills,
            achievements
        };
    },

    // Delete activity
    async deleteActivity(activityId) {
        const uid = Auth.currentUser?.uid;
        if (!uid) return;

        const result = await Database.deleteActivity(uid, activityId);

        if (result.success) {
            await this.load();
            App.closeModal();
            App.showToast('Activity deleted', 'success');
        } else {
            App.showToast(result.error || 'Failed to delete activity', 'error');
        }
    },

    // Confirm delete
    confirmDelete(activityId) {
        const activity = this.activities.find(a => a.id === activityId);
        if (!activity) return;

        document.getElementById('delete-activity-name').textContent = activity.title;
        document.getElementById('confirm-delete-btn').onclick = () => this.deleteActivity(activityId);
        App.showModal('delete-modal');
    },

    // Filter activities
    filter(type) {
        this.currentFilter = type;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === type);
        });
        this.render();
    },

    // Sort activities
    sort(by) {
        this.currentSort = by;
        this.render();
    },

    // Get filtered and sorted activities
    getFilteredActivities() {
        let filtered = [...this.activities];

        // Apply filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(a => a.type === this.currentFilter);
        }

        // Apply sort
        switch (this.currentSort) {
            case 'newest':
                filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                break;
            case 'oldest':
                filtered.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                break;
            case 'hours':
                filtered.sort((a, b) => (b.totalHours || 0) - (a.totalHours || 0));
                break;
            case 'alpha':
                filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                break;
        }

        return filtered;
    },

    // Calculate statistics
    getStats() {
        const totalActivities = this.activities.length;
        const totalHours = this.activities.reduce((sum, a) => sum + (a.totalHours || 0), 0);
        const types = new Set(this.activities.map(a => a.type)).size;

        return { totalActivities, totalHours, types };
    },

    // Format date for display
    formatDateRange(startDate, endDate) {
        const formatMonth = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr + '-01');
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        };

        const start = formatMonth(startDate);
        const end = endDate ? formatMonth(endDate) : 'Present';

        return `${start} - ${end}`;
    },

    // Render activities
    render() {
        const grid = document.getElementById('activities-grid');
        const emptyState = document.getElementById('empty-state');
        const filtered = this.getFilteredActivities();

        // Update stats
        const stats = this.getStats();
        document.getElementById('total-activities').textContent = stats.totalActivities;
        document.getElementById('total-hours').textContent = stats.totalHours.toLocaleString();
        document.getElementById('activity-types').textContent = stats.types;

        // Show/hide empty state
        if (this.activities.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';

        // Render activity cards
        grid.innerHTML = filtered.map(activity => this.renderActivityCard(activity)).join('');

        // Attach event listeners
        grid.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => this.openEditModal(btn.dataset.edit));
        });

        grid.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => this.confirmDelete(btn.dataset.delete));
        });
    },

    // Render single activity card
    renderActivityCard(activity) {
        const type = this.types[activity.type] || this.types.other;
        const skills = (activity.skills || []).slice(0, 3);
        const hasMoreSkills = (activity.skills || []).length > 3;

        return `
            <div class="activity-card">
                <div class="activity-card-header">
                    <div class="activity-icon ${activity.type}">${type.icon}</div>
                    <div class="activity-header-content">
                        <h3>${this.escapeHtml(activity.title)}</h3>
                        <span class="activity-role">${this.escapeHtml(activity.role || type.label)}</span>
                    </div>
                </div>
                <div class="activity-card-body">
                    <p class="activity-description">${this.escapeHtml(activity.description)}</p>
                    <div class="activity-meta">
                        <span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            ${this.formatDateRange(activity.startDate, activity.endDate)}
                        </span>
                        ${activity.totalHours ? `
                        <span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            ${activity.totalHours} hrs
                        </span>
                        ` : ''}
                    </div>
                    ${skills.length > 0 ? `
                    <div class="activity-skills">
                        ${skills.map(s => `<span class="skill-tag">${this.escapeHtml(s)}</span>`).join('')}
                        ${hasMoreSkills ? `<span class="skill-tag">+${activity.skills.length - 3}</span>` : ''}
                    </div>
                    ` : ''}
                </div>
                <div class="activity-card-footer">
                    <button class="btn-icon" data-edit="${activity.id}" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-icon" data-delete="${activity.id}" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    },

    // Escape HTML for safe rendering
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
