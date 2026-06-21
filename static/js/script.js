document.addEventListener('DOMContentLoaded', () => {
    const applicationsGrid = document.getElementById('applicationsGrid');
    const companySearch = document.getElementById('companySearch');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const addAppBtn = document.getElementById('addAppBtn');
    const appModal = document.getElementById('appModal');
    const closeModal = document.querySelector('.close');
    const applicationForm = document.getElementById('applicationForm');

    let allApplications = [];
    let currentFilter = 'all';

    // Fetch and display applications
    async function fetchApplications() {
        try {
            const response = await fetch('/api/applications');
            allApplications = await response.json();
            renderApplications();
        } catch (error) {
            console.error('Error fetching applications:', error);
        }
    }

    function renderApplications() {
        const searchTerm = companySearch.value.toLowerCase();

        const filtered = allApplications.filter(app => {
            const matchesSearch = app.company.toLowerCase().includes(searchTerm) ||
                app.position.toLowerCase().includes(searchTerm);
            const matchesFilter = currentFilter === 'all' || app.status === currentFilter;
            return matchesSearch && matchesFilter;
        });

        applicationsGrid.innerHTML = filtered.map(app => `
            <div class="job-card glass" data-id="${app.id}">
                <div class="card-header">
                    <div class="company-logo">${app.company.charAt(0)}</div>
                    <span class="status-badge status-${app.status}">${app.status}</span>
                </div>
                <div class="job-info">
                    <h3>${app.position}</h3>
                    <p class="company-name">${app.company}</p>
                </div>
                <div class="job-details">
                    <span>${app.platform || 'N/A'}</span>
                    <span>${app.date_applied}</span>
                </div>
                <div class="card-footer">
                    <a href="${app.link || '#'}" target="_blank" class="link-btn" title="Visit Link">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                    <button class="delete-btn" onclick="deleteApplication(${app.id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Filter functionality
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.status;
            renderApplications();
        });
    });

    // Search functionality
    companySearch.addEventListener('input', renderApplications);

    // Modal handling
    addAppBtn.onclick = () => appModal.style.display = 'block';
    closeModal.onclick = () => appModal.style.display = 'none';
    window.onclick = (e) => { if (e.target == appModal) appModal.style.display = 'none'; };

    // Form submission
    applicationForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = {
            company: document.getElementById('company').value,
            position: document.getElementById('position').value,
            platform: document.getElementById('platform').value,
            status: document.getElementById('status').value,
            link: document.getElementById('link').value,
            notes: document.getElementById('notes').value
        };

        try {
            const response = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                appModal.style.display = 'none';
                applicationForm.reset();
                fetchApplications();
            }
        } catch (error) {
            console.error('Error adding application:', error);
        }
    };

    // Global delete function access
    window.deleteApplication = async (id) => {
        if (!confirm('Are you sure you want to delete this application?')) return;

        try {
            const response = await fetch(`/api/applications/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchApplications();
            }
        } catch (error) {
            console.error('Error deleting application:', error);
        }
    };

    // Initial load
    fetchApplications();
});
