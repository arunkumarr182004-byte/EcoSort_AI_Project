// EcoSort AI - Frontend Controller

// State variables
let currentScore = 0.00;
let leafletMap = null;
let mapMarkers = [];

// Mock recycling depots coordinates (Seattle area)
const RECYCLING_DEPOTS = [
    {
        name: "EcoCenter Downtown Depot",
        lat: 47.6062,
        lng: -122.3321,
        address: "415 Pine St, Seattle, WA",
        type: "General Recycling",
        class: "badge-plastic",
        desc: "Accepts plastics (#1-5), paper products, and clean metals."
    },
    {
        name: "Green compost Solutions",
        lat: 47.6101,
        lng: -122.3421,
        address: "800 Pike St, Seattle, WA",
        type: "Organic & Compost",
        class: "badge-organic",
        desc: "Accepts vegetable/food scraps, yard waste, and compostable packaging."
    },
    {
        name: "Hazmat Safe Disposal Depot",
        lat: 47.5998,
        lng: -122.3210,
        address: "220 Royal Brougham Way, Seattle, WA",
        type: "Hazardous Waste",
        class: "badge-hazardous",
        desc: "Accepts batteries, CFL lights, chemical cleaners, aerosols, and paints."
    },
    {
        name: "Metro E-Cycle Retail Hub",
        lat: 47.6154,
        lng: -122.3150,
        address: "1500 Broadway Ave, Seattle, WA",
        type: "E-Waste",
        class: "badge-ewaste",
        desc: "Accepts laptops, mobile phones, chargers, TV screens, and copper wires."
    },
    {
        name: "Ocean Glass & Metal Co.",
        lat: 47.5890,
        lng: -122.3380,
        address: "1200 S Nevada St, Seattle, WA",
        type: "Glass & Metals",
        class: "badge-glass",
        desc: "Specialized in clear, green, and brown glass jars and aluminum containers."
    }
];

// 1. SPA Router
function router() {
    const hash = window.location.hash || '#home';
    const pages = document.querySelectorAll('.page-section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Deactivate all pages and links
    pages.forEach(p => p.classList.remove('active'));
    navLinks.forEach(l => l.classList.remove('active'));
    
    // Activate target page and navigation link
    const targetPage = document.querySelector(`[id="page-${hash.replace('#', '')}"]`);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        document.getElementById('page-home').classList.add('active');
    }
    
    const activeLink = document.querySelector(`[id="nav-${hash.replace('#', '')}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    } else {
        document.getElementById('nav-home').classList.add('active');
    }
    
    // Close sidebar on mobile after navigating
    document.getElementById('sidebar').classList.remove('open');
    
    // Initialize/Load specific page resources
    if (hash === '#home') {
        initLeafletMap();
        updateHomeStats();
    } else if (hash === '#history') {
        loadHistory();
    } else if (hash === '#dashboard') {
        loadDashboard(); // Defined in dashboard.js
    }
}

// Helper to handle client navigations programmatically
function navigateToPage(hash) {
    window.location.hash = hash;
}

// 2. Leaflet.js Map Integration
function initLeafletMap() {
    const mapEl = document.getElementById('map-container');
    if (!mapEl) return;
    
    // If map already initialized, just invalidate size to make sure it loads properly
    if (leafletMap) {
        setTimeout(() => {
            leafletMap.invalidateSize();
        }, 100);
        return;
    }
    
    // Create map instance centered in Seattle
    leafletMap = L.map('map-container').setView([47.6062, -122.3321], 13);
    
    // Add open street map tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMap);
    
    // Add markers and build sidebar list
    const listContainer = document.getElementById('recycling-locations-list');
    if (listContainer) listContainer.innerHTML = '';
    
    // Clear old markers
    mapMarkers.forEach(m => leafletMap.removeLayer(m));
    mapMarkers = [];
    
    RECYCLING_DEPOTS.forEach((depot, index) => {
        // Create marker
        const marker = L.marker([depot.lat, depot.lng]).addTo(leafletMap);
        marker.bindPopup(`
            <div style="font-family: var(--font-main); max-width: 200px;">
                <h4 style="margin: 0 0 4px; font-weight: 700; font-size:13px;">${depot.name}</h4>
                <p style="margin: 0 0 6px; font-size: 10px; color: var(--text-muted);">${depot.address}</p>
                <span class="badge ${depot.class}" style="font-size: 9px; padding: 2px 6px;">${depot.type}</span>
                <p style="margin: 6px 0 0; font-size: 11px; line-height: 1.3;">${depot.desc}</p>
            </div>
        `);
        mapMarkers.push(marker);
        
        // Append list element
        if (listContainer) {
            const li = document.createElement('li');
            li.className = 'location-item';
            li.innerHTML = `
                <h4>${depot.name}</h4>
                <p>${depot.address}</p>
                <span class="location-type-tag ${depot.class}">${depot.type}</span>
            `;
            li.addEventListener('click', () => {
                leafletMap.setView([depot.lat, depot.lng], 15);
                marker.openPopup();
            });
            listContainer.appendChild(li);
        }
    });
}

// 3. Theme Toggle (Light / Dark Mode)
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const oldTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = oldTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            showToast(`Theme switched to ${newTheme} mode!`, 'info');
            
            // Re-render charts to look good in dark mode
            if (window.location.hash === '#dashboard') {
                loadDashboard();
            }
        });
    }
}

// 4. Toast Notifications
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-xmark';
    if (type === 'warning') icon = 'fa-triangle-exclamation';
    if (type === 'info') icon = 'fa-circle-info';
    
    toast.innerHTML = `
        <i class="fa-solid ${icon} toast-icon"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 3.5 seconds
    setTimeout(() => {
        toast.style.animation = 'slide-toast 0.3s ease-in reverse forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3500);
}

// 5. Autocomplete Global Search Bar
function initSearch() {
    const searchInput = document.getElementById('global-search');
    const dropdown = document.getElementById('search-dropdown');
    
    if (!searchInput || !dropdown) return;
    
    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        if (query.length < 2) {
            dropdown.style.display = 'none';
            return;
        }
        
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const results = await res.json();
            
            if (results.length === 0) {
                dropdown.innerHTML = `
                    <div style="padding: 12px 20px; font-size:12px; color: var(--text-muted);">
                        No results found for "${query}"
                    </div>
                `;
                dropdown.style.display = 'block';
                return;
            }
            
            dropdown.innerHTML = '';
            results.forEach(item => {
                const div = document.createElement('div');
                div.className = 'search-dropdown-item';
                
                let icon = 'fa-recycle';
                let iconClass = 'bg-plastic-light';
                
                if (item.category === 'Plastic') { icon = 'fa-bottle-water'; iconClass = 'bg-plastic-light'; }
                else if (item.category === 'Paper') { icon = 'fa-file-lines'; iconClass = 'bg-paper-light'; }
                else if (item.category === 'Glass') { icon = 'fa-glass-water'; iconClass = 'bg-glass-light'; }
                else if (item.category === 'Metal') { icon = 'fa-can-food'; iconClass = 'bg-metal-light'; }
                else if (item.category === 'Organic Waste') { icon = 'fa-apple-whole'; iconClass = 'bg-organic-light'; }
                else if (item.category === 'E-Waste') { icon = 'fa-laptop'; iconClass = 'bg-ewaste-light'; }
                else if (item.category === 'Hazardous Waste') { icon = 'fa-skull-crossbones'; iconClass = 'bg-hazardous-light'; }
                
                div.innerHTML = `
                    <div class="dropdown-item-icon ${iconClass}">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div class="dropdown-item-info">
                        <h4>${item.name}</h4>
                        <p>${item.category} • ${item.is_recyclable ? 'Recyclable' : 'Special Disposal'}</p>
                    </div>
                `;
                
                div.addEventListener('click', () => {
                    // Inject details directly to the result layout, and navigate to Scan view
                    displaySearchDetails(item);
                    searchInput.value = '';
                    dropdown.style.display = 'none';
                    navigateToPage('#scan');
                });
                
                dropdown.appendChild(div);
            });
            dropdown.style.display = 'block';
            
        } catch (err) {
            console.error('Error fetching search details:', err);
        }
    });
    
    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

// Display search information inside the results card
function displaySearchDetails(item) {
    const resultPlaceholder = document.getElementById('result-placeholder');
    const resultOutput = document.getElementById('result-output');
    
    if (!resultPlaceholder || !resultOutput) return;
    
    resultPlaceholder.style.display = 'none';
    resultOutput.style.display = 'flex';
    
    const catBadge = document.getElementById('result-category-badge');
    const title = document.getElementById('result-title');
    const recTag = document.getElementById('result-recyclable-tag');
    const confidenceVal = document.getElementById('result-confidence');
    const confidenceBar = document.getElementById('result-confidence-bar');
    const rawLabel = document.getElementById('result-raw-label');
    const carbonText = document.getElementById('result-carbon-savings');
    const disposalText = document.getElementById('result-disposal');
    const impactText = document.getElementById('result-impact');
    const safetyWrapper = document.getElementById('result-safety-wrapper');
    const safetyText = document.getElementById('result-safety');
    
    // Clean classes
    catBadge.className = 'badge';
    catBadge.classList.add(`badge-${item.category.toLowerCase().replace(' ', '')}`);
    catBadge.innerText = item.category;
    
    title.innerText = item.name;
    
    // Set Recyclability Class
    recTag.className = 'recyclable-status-tag';
    if (item.category === 'Hazardous Waste') {
        recTag.classList.add('recycled-hazardous');
        recTag.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Hazardous`;
    } else if (item.is_recyclable) {
        recTag.classList.add('recycled-true');
        recTag.innerHTML = `<i class="fa-solid fa-circle-check"></i> Recyclable`;
    } else {
        recTag.classList.add('recycled-false');
        recTag.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Non-Recyclable`;
    }
    
    // Confidence is 100% for manual searches
    confidenceVal.innerText = '100% (Search Lookup)';
    confidenceBar.style.width = '100%';
    rawLabel.innerText = item.name.toLowerCase();
    
    carbonText.innerText = item.carbon_savings.toFixed(2);
    disposalText.innerText = item.disposal_method;
    impactText.innerText = item.environmental_impact;
    
    if (item.category === 'Hazardous Waste' && item.safety_precautions) {
        safetyWrapper.style.display = 'block';
        safetyText.innerText = item.safety_precautions;
    } else {
        safetyWrapper.style.display = 'none';
    }
    
    // Show a success message
    showToast(`Loaded disposal instructions for ${item.name}`, 'success');
}

// 6. Image Selection, Upload, & AI scan implementation
function initScanFlow() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('image-upload');
    const previewContainer = document.getElementById('preview-container');
    const previewImg = document.getElementById('image-preview');
    const dropZoneContent = document.getElementById('drop-zone-content');
    const removeImgBtn = document.getElementById('remove-img-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const scanOverlay = document.getElementById('scan-overlay');
    
    if (!dropZone || !fileInput) return;
    
    // Drag-over styling
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('dragging');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragging');
        }, false);
    });
    
    // Drop file
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileSelect(files[0]);
        }
    });
    
    // Click browse select file
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
    
    // Clear preview
    removeImgBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Avoid triggering open browse click
        fileInput.value = '';
        previewContainer.style.display = 'none';
        dropZoneContent.style.display = 'flex';
        analyzeBtn.disabled = true;
        
        // Reset results placeholder
        document.getElementById('result-placeholder').style.display = 'flex';
        document.getElementById('result-output').style.display = 'none';
    });
    
    function handleFileSelect(file) {
        if (!file.type.match('image.*')) {
            showToast('Invalid file format. Please choose an image.', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            dropZoneContent.style.display = 'none';
            previewContainer.style.display = 'block';
            scanOverlay.style.display = 'none'; // hidden initially
            analyzeBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }
    
    // Classify button clicked
    analyzeBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('image', file);
        
        // UI scan feedback starts
        scanOverlay.style.display = 'flex';
        analyzeBtn.disabled = true;
        removeImgBtn.style.display = 'none';
        
        try {
            const res = await fetch('/api/scan', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            if (res.ok) {
                showToast(`AI successfully classified item as ${data.category}!`, 'success');
                displayScanResults(data);
                updateScoreAndStats();
            } else {
                showToast(data.error || 'Prediction failed. Try again.', 'error');
            }
        } catch (err) {
            console.error('Scan error:', err);
            showToast('Server connection failed.', 'error');
        } finally {
            scanOverlay.style.display = 'none';
            analyzeBtn.disabled = false;
            removeImgBtn.style.display = 'block';
        }
    });
}

// Populate prediction outputs on result card
function displayScanResults(data) {
    const resultPlaceholder = document.getElementById('result-placeholder');
    const resultOutput = document.getElementById('result-output');
    
    resultPlaceholder.style.display = 'none';
    resultOutput.style.display = 'flex';
    
    const catBadge = document.getElementById('result-category-badge');
    const title = document.getElementById('result-title');
    const recTag = document.getElementById('result-recyclable-tag');
    const confidenceVal = document.getElementById('result-confidence');
    const confidenceBar = document.getElementById('result-confidence-bar');
    const rawLabel = document.getElementById('result-raw-label');
    const carbonText = document.getElementById('result-carbon-savings');
    const disposalText = document.getElementById('result-disposal');
    const impactText = document.getElementById('result-impact');
    const safetyWrapper = document.getElementById('result-safety-wrapper');
    const safetyText = document.getElementById('result-safety');
    
    // Badge category classes
    catBadge.className = 'badge';
    catBadge.classList.add(`badge-${data.category.toLowerCase().replace(' ', '')}`);
    catBadge.innerText = data.category;
    
    title.innerText = `${data.category} Waste`;
    
    // Status text
    recTag.className = 'recyclable-status-tag';
    if (data.category === 'Hazardous Waste') {
        recTag.classList.add('recycled-hazardous');
        recTag.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Hazardous`;
    } else if (data.is_recyclable) {
        recTag.classList.add('recycled-true');
        recTag.innerHTML = `<i class="fa-solid fa-circle-check"></i> Recyclable`;
    } else {
        recTag.classList.add('recycled-false');
        recTag.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Non-Recyclable`;
    }
    
    // Probabilities
    confidenceVal.innerText = `${data.confidence}%`;
    confidenceBar.style.width = `${data.confidence}%`;
    rawLabel.innerText = data.predicted_label;
    
    carbonText.innerText = data.carbon_savings.toFixed(2);
    disposalText.innerText = data.disposal_method;
    impactText.innerText = data.environmental_impact;
    
    if (data.safety_precautions) {
        safetyWrapper.style.display = 'block';
        safetyText.innerText = data.safety_precautions;
    } else {
        safetyWrapper.style.display = 'none';
    }
}

// 7. Load History Lists
async function loadHistory() {
    const listContainer = document.getElementById('history-list');
    const emptyState = document.getElementById('history-empty');
    const actionsBar = document.getElementById('history-actions-bar');
    
    if (!listContainer) return;
    
    try {
        const res = await fetch('/api/history');
        const data = await res.json();
        
        if (data.length === 0) {
            emptyState.style.display = 'flex';
            listContainer.style.display = 'none';
            actionsBar.style.display = 'none';
            return;
        }
        
        emptyState.style.display = 'none';
        listContainer.style.display = 'grid';
        actionsBar.style.display = 'flex';
        
        listContainer.innerHTML = '';
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card history-card glass-card';
            
            const dateStr = new Date(item.scanned_at).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            card.innerHTML = `
                <div class="history-img-wrapper">
                    <img class="history-img" src="${item.filepath}" alt="${item.category} Thumbnail" onerror="this.src='/static/css/style.css'">
                    <button class="history-delete-btn" data-id="${item.id}" title="Delete scan entry">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
                <div class="history-body">
                    <div class="history-meta">
                        <span class="badge badge-${item.category.toLowerCase().replace(' ', '')}">${item.category}</span>
                        <span class="history-date">${dateStr}</span>
                    </div>
                    <h3>Predicted Waste Stream:</h3>
                    <div class="history-details-compact">
                        <span>Confidence: <strong>${item.confidence}%</strong></span>
                        <span>CO₂ Saved: <strong>${item.carbon_savings.toFixed(2)} kg</strong></span>
                    </div>
                    <div class="history-toggle-details" data-expanded="false">Show Disposal Guide <i class="fa-solid fa-chevron-down"></i></div>
                    <div class="history-extra-info" style="display: none;">
                        <p><strong>Disposal:</strong> ${item.disposal_method}</p>
                        <p><strong>Impact:</strong> ${item.environmental_impact}</p>
                        ${item.safety_precautions ? `<p style="color: var(--color-danger)"><strong>Safety:</strong> ${item.safety_precautions}</p>` : ''}
                    </div>
                </div>
            `;
            
            // Wire delete action
            const deleteBtn = card.querySelector('.history-delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteHistoryItem(item.id);
            });
            
            // Wire toggling action
            const toggleBtn = card.querySelector('.history-toggle-details');
            const extraInfo = card.querySelector('.history-extra-info');
            toggleBtn.addEventListener('click', () => {
                const isExpanded = toggleBtn.getAttribute('data-expanded') === 'true';
                if (isExpanded) {
                    extraInfo.style.display = 'none';
                    toggleBtn.innerHTML = 'Show Disposal Guide <i class="fa-solid fa-chevron-down"></i>';
                    toggleBtn.setAttribute('data-expanded', 'false');
                } else {
                    extraInfo.style.display = 'flex';
                    toggleBtn.innerHTML = 'Hide Disposal Guide <i class="fa-solid fa-chevron-up"></i>';
                    toggleBtn.setAttribute('data-expanded', 'true');
                }
            });
            
            listContainer.appendChild(card);
        });
        
    } catch (err) {
        console.error('Failed to load history list:', err);
    }
}

// Premium Custom Confirmation Modal Utility
function showConfirmDialog(title, message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-message');
    const confirmBtn = document.getElementById('confirm-modal-confirm');
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    const closeBtn = document.getElementById('confirm-modal-close');

    if (!modal) return;

    titleEl.textContent = title;
    msgEl.textContent = message;
    
    // Show modal
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);

    const closeModal = () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    };

    // Clone button to strip previous event listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', () => {
        onConfirm();
        closeModal();
    });

    const onCancel = () => {
        closeModal();
    };

    cancelBtn.onclick = onCancel;
    closeBtn.onclick = onCancel;
}

// Delete single log
function deleteHistoryItem(id) {
    showConfirmDialog(
        'Delete Scan Log',
        'Are you sure you want to delete this scan log from your history?',
        async () => {
            try {
                const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
                const data = await res.json();
                
                if (res.ok) {
                    showToast('Scan history item deleted.', 'success');
                    loadHistory();
                    updateScoreAndStats();
                } else {
                    showToast(data.error || 'Failed to delete.', 'error');
                }
            } catch (err) {
                console.error('Delete history item error:', err);
            }
        }
    );
}

// Clear all logs
function clearAllHistory() {
    showConfirmDialog(
        'Clear Scan History',
        'CAUTION: This will delete ALL logged scans and their image files. Proceed?',
        async () => {
            try {
                const res = await fetch('/api/history', { method: 'DELETE' });
                const data = await res.json();
                
                if (res.ok) {
                    showToast('All scan history cleared!', 'success');
                    loadHistory();
                    updateScoreAndStats();
                } else {
                    showToast(data.error || 'Failed to clear history.', 'error');
                }
            } catch (err) {
                console.error('Clear history error:', err);
            }
        }
    );
}

// 8. Update stats counters
async function updateScoreAndStats() {
    try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        
        currentScore = data.total_carbon_savings || 0.00;
        
        // Update header score
        const scoreEl = document.getElementById('header-eco-score');
        if (scoreEl) scoreEl.innerText = currentScore.toFixed(2);
        
        // Update Home view stats if active
        updateHomeStatsElements(data);
    } catch (err) {
        console.error('Failed to update stats:', err);
    }
}

async function updateHomeStats() {
    try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        updateHomeStatsElements(data);
    } catch (err) {
        console.error('Failed to fetch home stats:', err);
    }
}

function updateHomeStatsElements(data) {
    const scansEl = document.getElementById('home-stat-scans');
    const rateEl = document.getElementById('home-stat-rate');
    const carbonEl = document.getElementById('home-stat-carbon');
    
    if (scansEl) scansEl.innerText = data.total_scans;
    if (rateEl) rateEl.innerText = `${data.recycling_percentage}%`;
    if (carbonEl) carbonEl.innerText = `${data.total_carbon_savings.toFixed(2)} kg`;
}

// 9. Contact submission
async function handleContactSubmit(event) {
    event.preventDefault();
    
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const msg = document.getElementById('contact-message').value;
    
    if (!name || !email || !msg) return;
    
    const submitBtn = document.getElementById('contact-submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting Feedback...';
    
    try {
        const res = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, message: msg })
        });
        const data = await res.json();
        
        if (res.ok) {
            showToast('Thank you! Your message has been submitted and stored successfully.', 'success');
            document.getElementById('contact-form').reset();
        } else {
            showToast(data.error || 'Failed to submit feedback.', 'error');
        }
    } catch (err) {
        console.error('Contact submission error:', err);
        showToast('Error connecting to the server. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Message';
    }
}

// 10. Startup Initialization
document.addEventListener('DOMContentLoaded', () => {
    // SPA navigation trigger
    window.addEventListener('hashchange', router);
    
    // Toggle Mobile menu
    const mobileToggle = document.getElementById('mobile-toggle');
    const sidebar = document.getElementById('sidebar');
    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
    
    // Initialize components
    initTheme();
    initScanFlow();
    initSearch();
    updateScoreAndStats();
    
    // Clear history button wiring
    const clearBtn = document.getElementById('clear-history-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllHistory);
    }
    
    // Initialize initial route
    router();
});
