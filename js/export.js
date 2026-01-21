// Export Module for Portfolio Builder
const Export = {
    // Initialize export functionality
    init() {
        this.setupEventListeners();
    },

    // Setup event listeners
    setupEventListeners() {
        // Export options
        document.querySelectorAll('.export-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = btn.dataset.format;
                if (format === 'link' && !Auth.isPremium()) {
                    App.showModal('pricing-modal');
                    return;
                }
                this.export(format);
            });
        });
    },

    // Export based on format
    export(format) {
        switch (format) {
            case 'pdf':
                this.generatePDF();
                break;
            case 'text':
                this.copyAsText();
                break;
            case 'link':
                this.createShareLink();
                break;
        }
    },

    // Generate PDF
    generatePDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const profile = Storage.getUserProfile() || {};
        const activities = Storage.getActivities() || [];
        const userName = Auth.getDisplayName();

        // Colors
        const primaryColor = [99, 102, 241];
        const textColor = [30, 41, 59];
        const mutedColor = [100, 116, 139];

        let y = 20;

        // Header
        doc.setFontSize(24);
        doc.setTextColor(...primaryColor);
        doc.text(userName, 20, y);
        y += 10;

        doc.setFontSize(11);
        doc.setTextColor(...mutedColor);
        doc.text('Extracurricular Portfolio', 20, y);
        y += 5;

        // Graduation year if set
        if (profile.gradYear) {
            doc.text(`Class of ${profile.gradYear}`, 20, y);
            y += 5;
        }

        // Bio if set
        if (profile.bio) {
            y += 5;
            doc.setFontSize(10);
            doc.setTextColor(...textColor);
            const bioLines = doc.splitTextToSize(profile.bio, 170);
            doc.text(bioLines, 20, y);
            y += bioLines.length * 5;
        }

        // Divider line
        y += 10;
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.line(20, y, 190, y);
        y += 15;

        // Summary stats
        const totalHours = activities.reduce((sum, a) => sum + (a.totalHours || 0), 0);
        doc.setFontSize(10);
        doc.setTextColor(...mutedColor);
        doc.text(`${activities.length} Activities | ${totalHours.toLocaleString()} Total Hours`, 20, y);
        y += 15;

        // Activities
        activities.forEach((activity, index) => {
            // Check if we need a new page
            if (y > 250) {
                doc.addPage();
                y = 20;
            }

            // Activity title and type
            doc.setFontSize(12);
            doc.setTextColor(...primaryColor);
            doc.setFont(undefined, 'bold');
            doc.text(activity.title || 'Untitled Activity', 20, y);

            // Role on same line (right aligned)
            if (activity.role) {
                doc.setFontSize(10);
                doc.setTextColor(...mutedColor);
                doc.setFont(undefined, 'normal');
                doc.text(activity.role, 190, y, { align: 'right' });
            }
            y += 6;

            // Organization
            if (activity.organization) {
                doc.setFontSize(10);
                doc.setTextColor(...textColor);
                doc.setFont(undefined, 'normal');
                doc.text(activity.organization, 20, y);
                y += 5;
            }

            // Date and hours
            doc.setFontSize(9);
            doc.setTextColor(...mutedColor);
            const dateRange = this.formatDateRange(activity.startDate, activity.endDate);
            const hoursText = activity.totalHours ? ` | ${activity.totalHours} hours` : '';
            doc.text(dateRange + hoursText, 20, y);
            y += 6;

            // Description
            if (activity.description) {
                doc.setFontSize(10);
                doc.setTextColor(...textColor);
                const descLines = doc.splitTextToSize(activity.description, 170);
                doc.text(descLines, 20, y);
                y += descLines.length * 5 + 2;
            }

            // Achievements
            if (activity.achievements && activity.achievements.length > 0) {
                doc.setFontSize(9);
                doc.setTextColor(...textColor);
                activity.achievements.forEach(achievement => {
                    doc.text(`• ${achievement}`, 25, y);
                    y += 5;
                });
            }

            // Skills
            if (activity.skills && activity.skills.length > 0) {
                doc.setFontSize(9);
                doc.setTextColor(...primaryColor);
                doc.text('Skills: ' + activity.skills.join(', '), 20, y);
                y += 5;
            }

            y += 10; // Space between activities
        });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(...mutedColor);
        doc.text('Generated by Portfolio Builder', 20, 285);
        doc.text(new Date().toLocaleDateString(), 190, 285, { align: 'right' });

        // Save the PDF
        const fileName = `${userName.replace(/\s+/g, '_')}_Portfolio.pdf`;
        doc.save(fileName);

        App.closeModal();
        App.showToast('PDF downloaded!', 'success');
    },

    // Copy as plain text
    copyAsText() {
        const profile = Storage.getUserProfile() || {};
        const activities = Storage.getActivities() || [];
        const userName = Auth.getDisplayName();

        let text = `${userName}\n`;
        text += `Extracurricular Portfolio\n`;
        if (profile.gradYear) text += `Class of ${profile.gradYear}\n`;
        text += `${'='.repeat(50)}\n\n`;

        if (profile.bio) {
            text += `${profile.bio}\n\n`;
        }

        const totalHours = activities.reduce((sum, a) => sum + (a.totalHours || 0), 0);
        text += `${activities.length} Activities | ${totalHours.toLocaleString()} Total Hours\n\n`;
        text += `${'='.repeat(50)}\n\n`;

        activities.forEach((activity, index) => {
            text += `${activity.title}`;
            if (activity.role) text += ` - ${activity.role}`;
            text += '\n';

            if (activity.organization) {
                text += `${activity.organization}\n`;
            }

            text += `${this.formatDateRange(activity.startDate, activity.endDate)}`;
            if (activity.totalHours) text += ` | ${activity.totalHours} hours`;
            text += '\n\n';

            if (activity.description) {
                text += `${activity.description}\n\n`;
            }

            if (activity.achievements && activity.achievements.length > 0) {
                text += 'Achievements:\n';
                activity.achievements.forEach(a => {
                    text += `  • ${a}\n`;
                });
                text += '\n';
            }

            if (activity.skills && activity.skills.length > 0) {
                text += `Skills: ${activity.skills.join(', ')}\n`;
            }

            text += '\n' + '-'.repeat(50) + '\n\n';
        });

        // Copy to clipboard
        navigator.clipboard.writeText(text).then(() => {
            App.closeModal();
            App.showToast('Copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Copy failed:', err);
            App.showToast('Failed to copy', 'error');
        });
    },

    // Create shareable link (premium feature)
    createShareLink() {
        if (!Auth.isPremium()) {
            App.showModal('pricing-modal');
            return;
        }

        // This would require a backend to create public profiles
        // For now, show a message
        App.showToast('Public profiles coming soon!', 'warning');
    },

    // Format date range helper
    formatDateRange(startDate, endDate) {
        const formatMonth = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr + '-01');
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        };

        const start = formatMonth(startDate);
        const end = endDate ? formatMonth(endDate) : 'Present';

        return `${start} - ${end}`;
    }
};
