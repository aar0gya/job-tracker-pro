/**
 * Job Tracker Application
 * Main application logic
 */

class JobTrackerApp {
    constructor() {
        this.storage = storage;
        this.currentEditId = null;
        this.currentFilters = {
            search: '',
            status: 'all',
            sortBy: 'dateDesc'
        };

        this.init();
    }

    /**
     * Initialize application
     */
    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.loadApplications();
        this.updateStatistics();
        this.setDefaultDate();
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        // Modals
        this.jobModal = document.getElementById('jobModal');
        this.viewModal = document.getElementById('viewModal');

        // Forms
        this.jobForm = document.getElementById('jobForm');

        // Buttons
        this.addJobBtn = document.getElementById('addJobBtn');
        this.closeModalBtn = document.getElementById('closeModal');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.closeViewModalBtn = document.getElementById('closeViewModal');
        this.closeDetailsBtn = document.getElementById('closeDetailsBtn');

        // Inputs
        this.searchInput = document.getElementById('searchInput');
        this.statusFilter = document.getElementById('statusFilter');
        this.sortBySelect = document.getElementById('sortBy');

        // Display elements
        this.applicationsBody = document.getElementById('applicationsBody');
        this.emptyState = document.getElementById('emptyState');
        this.modalTitle = document.getElementById('modalTitle');
        this.resultsCount = document.getElementById('resultsCount');
        this.detailsContent = document.getElementById('detailsContent');

        // Stats
        this.totalAppsEl = document.getElementById('totalApps');
        this.pendingAppsEl = document.getElementById('pendingApps');
        this.interviewAppsEl = document.getElementById('interviewApps');
        this.rejectedAppsEl = document.getElementById('rejectedApps');

        // Toast
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Modal controls
        this.addJobBtn.addEventListener('click', () => this.openAddModal());
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        this.closeViewModalBtn.addEventListener('click', () => this.closeViewModal());
        this.closeDetailsBtn.addEventListener('click', () => this.closeViewModal());

        // Close on backdrop click
        this.jobModal.addEventListener('click', (e) => {
            if (e.target === this.jobModal) this.closeModal();
        });
        this.viewModal.addEventListener('click', (e) => {
            if (e.target === this.viewModal) this.closeViewModal();
        });

        // Form submission
        this.jobForm.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Search and filters
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.statusFilter.addEventListener('change', (e) => this.handleStatusFilter(e.target.value));
        this.sortBySelect.addEventListener('change', (e) => this.handleSort(e.target.value));

        // Export
        this.exportBtn.addEventListener('click', () => this.exportData());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeViewModal();
            }
        });
    }

    /**
     * Set default date
     */
    setDefaultDate() {
        const dateInput = document.getElementById('appliedDate');
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    /**
     * Open add modal
     */
    openAddModal() {
        this.currentEditId = null;
        this.modalTitle.textContent = 'Add New Application';
        this.jobForm.reset();
        this.setDefaultDate();
        this.jobModal.classList.add('active');
    }

    /**
 * Open edit modal
 */
    async openEditModal(id) {
        const application = await this.storage.getApplicationById(id);
        if (!application) return;

        // Use _id from MongoDB or id from localStorage
        this.currentEditId = application._id || application.id;
        this.modalTitle.textContent = 'Edit Application';

        // Populate form - handle both date formats
        const appliedDate = application.appliedDate;
        const dateValue = appliedDate ? appliedDate.split('T')[0] : '';

        document.getElementById('company').value = application.company || '';
        document.getElementById('position').value = application.position || '';
        document.getElementById('location').value = application.location || '';
        document.getElementById('salary').value = application.salary || '';
        document.getElementById('status').value = application.status || 'applied';
        document.getElementById('appliedDate').value = dateValue;
        document.getElementById('jobUrl').value = application.jobUrl || '';
        document.getElementById('contactPerson').value = application.contactPerson || '';
        document.getElementById('notes').value = application.notes || '';

        this.jobModal.classList.add('active');
    }

    /**
     * Close modal
     */
    closeModal() {
        this.jobModal.classList.remove('active');
        this.jobForm.reset();
        this.currentEditId = null;
    }

    /**
     * Close view modal
     */
    closeViewModal() {
        this.viewModal.classList.remove('active');
    }

    /**
 * Handle form submit
 */
    async handleFormSubmit(e) {
        e.preventDefault();

        const formData = {
            company: document.getElementById('company').value.trim(),
            position: document.getElementById('position').value.trim(),
            location: document.getElementById('location').value.trim(),
            salary: document.getElementById('salary').value.trim(),
            status: document.getElementById('status').value,
            appliedDate: document.getElementById('appliedDate').value,
            jobUrl: document.getElementById('jobUrl').value.trim(),
            contactPerson: document.getElementById('contactPerson').value.trim(),
            notes: document.getElementById('notes').value.trim()
        };

        console.log('Submitting:', formData); // DEBUG

        try {
            if (this.currentEditId) {
                const result = await this.storage.updateApplication(this.currentEditId, formData);
                console.log('Update result:', result); // DEBUG
                this.showToast('Application updated successfully!');
            } else {
                const result = await this.storage.addApplication(formData);
                console.log('Add result:', result); // DEBUG
                this.showToast('Application added successfully!');
            }

            this.closeModal();
            await this.loadApplications();
            await this.updateStatistics();
        } catch (error) {
            console.error('Error submitting form:', error);
            this.showToast('Error: ' + error.message);
        }
    }

    /**
     * Handle search
     */
    handleSearch(query) {
        this.currentFilters.search = query;
        this.loadApplications();
    }

    /**
     * Handle status filter
     */
    handleStatusFilter(status) {
        this.currentFilters.status = status;
        this.loadApplications();
    }

    /**
     * Handle sort
     */
    handleSort(sortBy) {
        this.currentFilters.sortBy = sortBy;
        this.loadApplications();
    }

    /**
 * Load applications
 */
    async loadApplications() {
        let applications = await this.storage.getAllApplications();

        // Apply search
        if (this.currentFilters.search) {
            applications = await this.storage.searchApplications(this.currentFilters.search);
        }

        // Apply status filter
        if (this.currentFilters.status !== 'all') {
            applications = applications.filter(app => app.status === this.currentFilters.status);
        }

        // Apply sorting
        applications = this.storage.sortApplications(applications, this.currentFilters.sortBy);

        // Update count
        this.resultsCount.textContent = `${applications.length} application${applications.length !== 1 ? 's' : ''}`;

        // Display
        if (applications.length === 0) {
            this.showEmptyState();
        } else {
            this.renderApplications(applications);
        }
    }

    /**
 * Render applications
 */
    renderApplications(applications) {
        this.emptyState.style.display = 'none';

        this.applicationsBody.innerHTML = applications.map(app => {
            const id = app._id || app.id;
            return `
            <tr>
                <td class="company-cell">${this.escapeHtml(app.company)}</td>
                <td class="position-cell">${this.escapeHtml(app.position)}</td>
                <td class="location-cell">${this.escapeHtml(app.location)}</td>
                <td>
                    <span class="status-badge status-${app.status}">
                        ${app.status}
                    </span>
                </td>
                <td>${this.formatDate(app.appliedDate)}</td>
                <td class="actions-cell">
                    <button class="btn btn-icon" onclick="app.viewDetails('${id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-icon" onclick="app.openEditModal('${id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-icon" onclick="app.deleteApplication('${id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        }).join('');
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        this.applicationsBody.innerHTML = '';
        this.emptyState.style.display = 'block';
    }

    /**
 * View details
 */
    async viewDetails(id) {
        const app = await this.storage.getApplicationById(id);
        if (!app) return;

        this.detailsContent.innerHTML = `
        <div class="detail-row">
            <div class="detail-label">Company</div>
            <div class="detail-value">${this.escapeHtml(app.company)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Position</div>
            <div class="detail-value">${this.escapeHtml(app.position)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Location</div>
            <div class="detail-value">${this.escapeHtml(app.location)}</div>
        </div>
        ${app.salary ? `
            <div class="detail-row">
                <div class="detail-label">Salary</div>
                <div class="detail-value">${this.escapeHtml(app.salary)}</div>
            </div>
        ` : ''}
        <div class="detail-row">
            <div class="detail-label">Status</div>
            <div class="detail-value">
                <span class="status-badge status-${app.status}">${app.status}</span>
            </div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Applied Date</div>
            <div class="detail-value">${this.formatDate(app.appliedDate)}</div>
        </div>
        ${app.jobUrl ? `
            <div class="detail-row">
                <div class="detail-label">Job URL</div>
                <div class="detail-value">
                    <a href="${this.escapeHtml(app.jobUrl)}" target="_blank">View Posting</a>
                </div>
            </div>
        ` : ''}
        ${app.contactPerson ? `
            <div class="detail-row">
                <div class="detail-label">Contact</div>
                <div class="detail-value">${this.escapeHtml(app.contactPerson)}</div>
            </div>
        ` : ''}
        ${app.notes ? `
            <div class="detail-row">
                <div class="detail-label">Notes</div>
                <div class="detail-value">${this.escapeHtml(app.notes).replace(/\n/g, '<br>')}</div>
            </div>
        ` : ''}
    `;

        this.viewModal.classList.add('active');
    }

    /**
 * Delete application
 */
    async deleteApplication(id) {
        const app = await this.storage.getApplicationById(id);
        if (!app) return;

        if (confirm(`Delete application for ${app.position} at ${app.company}?`)) {
            await this.storage.deleteApplication(id);
            this.loadApplications();
            this.updateStatistics();
            this.showToast('Application deleted!');
        }
    }

    /**
 * Update statistics
 */
    async updateStatistics() {
        const stats = await this.storage.getStatistics();

        this.totalAppsEl.textContent = stats.total;
        this.pendingAppsEl.textContent = stats.applied;
        this.interviewAppsEl.textContent = stats.interview;
        this.rejectedAppsEl.textContent = stats.rejected;
    }

    /**
 * Export data
 */
    async exportData() {
        const data = await this.storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `job-applications-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Data exported!');
    }

    /**
     * Show toast
     */
    showToast(message) {
        this.toastMessage.textContent = message;
        this.toast.classList.add('show');

        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    /**
     * Format date
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app
let app;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new JobTrackerApp();
    });
} else {
    app = new JobTrackerApp();
}