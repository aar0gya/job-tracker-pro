/**
 * Storage Manager - API Version
 * Works with both localStorage and backend API
 */

class StorageManager {
    constructor() {
        this.storageKey = 'jobApplications';
        this.apiUrl = 'http://localhost:5000/api/applications';
        this.useAPI = true; // ✅ Set to true to use backend
        this.init();
    }

    /**
     * Initialize storage
     */
    init() {
        if (!this.useAPI && !localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    /**
     * Get all applications
     */
    async getAllApplications() {
        if (this.useAPI) {
            try {
                const response = await fetch(this.apiUrl);
                const result = await response.json();
                return result.data || [];
            } catch (error) {
                console.error('API Error:', error);
                return this.getFromLocalStorage();
            }
        }
        return this.getFromLocalStorage();
    }

    /**
     * Get application by ID
     */
    async getApplicationById(id) {
        if (this.useAPI) {
            try {
                const response = await fetch(`${this.apiUrl}/${id}`);
                const result = await response.json();
                return result.data || null;
            } catch (error) {
                console.error('API Error:', error);
                return this.getByIdFromLocalStorage(id);
            }
        }
        return this.getByIdFromLocalStorage(id);
    }

    /**
     * Add new application
     */
    async addApplication(application) {
        if (this.useAPI) {
            try {
                const response = await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(application)
                });
                const result = await response.json();
                return result.data;
            } catch (error) {
                console.error('API Error:', error);
                return this.addToLocalStorage(application);
            }
        }
        return this.addToLocalStorage(application);
    }

    /**
     * Update application
     */
    async updateApplication(id, updates) {
        if (this.useAPI) {
            try {
                const response = await fetch(`${this.apiUrl}/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updates)
                });
                const result = await response.json();
                return result.data;
            } catch (error) {
                console.error('API Error:', error);
                return this.updateInLocalStorage(id, updates);
            }
        }
        return this.updateInLocalStorage(id, updates);
    }

    /**
     * Delete application
     */
    async deleteApplication(id) {
        if (this.useAPI) {
            try {
                const response = await fetch(`${this.apiUrl}/${id}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                return result.success;
            } catch (error) {
                console.error('API Error:', error);
                return this.deleteFromLocalStorage(id);
            }
        }
        return this.deleteFromLocalStorage(id);
    }

    /**
     * Search applications
     */
    async searchApplications(query) {
        if (this.useAPI) {
            try {
                const response = await fetch(`${this.apiUrl}?search=${encodeURIComponent(query)}`);
                const result = await response.json();
                return result.data || [];
            } catch (error) {
                console.error('API Error:', error);
                return this.searchInLocalStorage(query);
            }
        }
        return this.searchInLocalStorage(query);
    }

    /**
     * Get statistics
     */
    async getStatistics() {
        if (this.useAPI) {
            try {
                const response = await fetch(`${this.apiUrl}/stats`);
                const result = await response.json();
                return result.data;
            } catch (error) {
                console.error('API Error:', error);
                return this.getStatsFromLocalStorage();
            }
        }
        return this.getStatsFromLocalStorage();
    }

    /**
     * Sort applications
     */
    sortApplications(applications, sortBy) {
        const sorted = [...applications];

        switch (sortBy) {
            case 'dateDesc':
                return sorted.sort((a, b) =>
                    new Date(b.appliedDate) - new Date(a.appliedDate)
                );
            case 'dateAsc':
                return sorted.sort((a, b) =>
                    new Date(a.appliedDate) - new Date(b.appliedDate)
                );
            case 'company':
                return sorted.sort((a, b) =>
                    a.company.localeCompare(b.company)
                );
            case 'position':
                return sorted.sort((a, b) =>
                    a.position.localeCompare(b.position)
                );
            default:
                return sorted;
        }
    }

    /**
     * Export data
     */
    async exportData() {
        const applications = await this.getAllApplications();
        return JSON.stringify(applications, null, 2);
    }

    // ==========================================
    // LocalStorage Methods (fallback)
    // ==========================================

    getFromLocalStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return JSON.parse(data) || [];
        } catch (error) {
            console.error('Error reading from storage:', error);
            return [];
        }
    }

    getByIdFromLocalStorage(id) {
        const applications = this.getFromLocalStorage();
        return applications.find(app => app.id === id || app._id === id) || null;
    }

    addToLocalStorage(application) {
        try {
            const applications = this.getFromLocalStorage();
            const newApplication = {
                id: this.generateId(),
                ...application,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            applications.push(newApplication);
            this.saveToLocalStorage(applications);
            return newApplication;
        } catch (error) {
            console.error('Error adding to storage:', error);
            throw error;
        }
    }

    updateInLocalStorage(id, updates) {
        try {
            const applications = this.getFromLocalStorage();
            const index = applications.findIndex(app => app.id === id || app._id === id);

            if (index === -1) {
                return null;
            }

            applications[index] = {
                ...applications[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            this.saveToLocalStorage(applications);
            return applications[index];
        } catch (error) {
            console.error('Error updating in storage:', error);
            throw error;
        }
    }

    deleteFromLocalStorage(id) {
        try {
            const applications = this.getFromLocalStorage();
            const filtered = applications.filter(app => app.id !== id && app._id !== id);

            if (filtered.length === applications.length) {
                return false;
            }

            this.saveToLocalStorage(filtered);
            return true;
        } catch (error) {
            console.error('Error deleting from storage:', error);
            throw error;
        }
    }

    searchInLocalStorage(query) {
        if (!query) {
            return this.getFromLocalStorage();
        }

        const applications = this.getFromLocalStorage();
        const lowerQuery = query.toLowerCase();

        return applications.filter(app =>
            app.company.toLowerCase().includes(lowerQuery) ||
            app.position.toLowerCase().includes(lowerQuery) ||
            app.location.toLowerCase().includes(lowerQuery) ||
            (app.notes && app.notes.toLowerCase().includes(lowerQuery))
        );
    }

    getStatsFromLocalStorage() {
        const applications = this.getFromLocalStorage();

        return {
            total: applications.length,
            applied: applications.filter(app => app.status === 'applied').length,
            interview: applications.filter(app => app.status === 'interview').length,
            offer: applications.filter(app => app.status === 'offer').length,
            rejected: applications.filter(app => app.status === 'rejected').length,
            withdrawn: applications.filter(app => app.status === 'withdrawn').length
        };
    }

    saveToLocalStorage(applications) {
        localStorage.setItem(this.storageKey, JSON.stringify(applications));
    }

    generateId() {
        return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Create singleton instance
const storage = new StorageManager();