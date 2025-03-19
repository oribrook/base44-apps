// Global variables
let allApps = [];
let filteredApps = [];
let currentPage = 1;
const itemsPerPage = 10;
let activeCategories = new Set();

// DOM elements
const appsGrid = document.getElementById('apps-grid');
const paginationContainer = document.getElementById('pagination');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const selectedCategoriesContainer = document.getElementById('selected-categories');

// Fetch the apps data
async function fetchApps() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        allApps = await response.json();
        filteredApps = [...allApps];
        
        // Initialize the app
        extractCategories();
        renderApps();
    } catch (error) {
        console.error('Error fetching data:', error);
        appsGrid.innerHTML = `
            <div class="error-message">
                <h3>Oops! Something went wrong</h3>
                <p>We couldn't load the apps. Please try again later.</p>
            </div>
        `;
    }
}

// Extract unique categories from all apps
function extractCategories() {
    const categoriesSet = new Set();
    
    allApps.forEach(app => {
        if (app.categories && Array.isArray(app.categories)) {
            app.categories.forEach(category => {
                categoriesSet.add(category);
            });
        }
    });
    
    // Sort categories alphabetically
    const sortedCategories = Array.from(categoriesSet).sort();
    
    // Render category select options
    categoryFilter.innerHTML = '<option value="">Select categories...</option>' + 
        sortedCategories.map(category => {
            return `<option value="${category}">${category}</option>`;
        }).join('');
    
    // Add event listener for category filter
    categoryFilter.addEventListener('change', (e) => {
        const selectedOption = e.target.value;
        if (selectedOption && !activeCategories.has(selectedOption)) {
            activeCategories.add(selectedOption);
            renderSelectedCategories();
            filterApps();
        }
    });
}

// Render selected categories as tags
function renderSelectedCategories() {
    selectedCategoriesContainer.innerHTML = '';
    
    activeCategories.forEach(category => {
        if (category) {
            const tag = document.createElement('div');
            tag.className = 'selected-category';
            tag.innerHTML = `
                <span>${category}</span>
                <span class="remove-category" data-category="${category}">×</span>
            `;
            selectedCategoriesContainer.appendChild(tag);
        }
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-category').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const categoryToRemove = e.target.dataset.category;
            activeCategories.delete(categoryToRemove);
            renderSelectedCategories();
            filterApps();
        });
    });
}

// Filter apps based on search input and selected categories
function filterApps() {
    const searchTerm = searchInput.value.toLowerCase();
    
    filteredApps = allApps.filter(app => {
        // Check if app matches search term
        const titleMatch = app.title && app.title.toLowerCase().includes(searchTerm);
        const descMatch = app.description && app.description.toLowerCase().includes(searchTerm);
        const searchMatch = titleMatch || descMatch;
        
        // Check if app matches selected categories
        let categoryMatch = true;
        if (activeCategories.size > 0) {
            categoryMatch = app.categories && app.categories.some(category => 
                activeCategories.has(category)
            );
        }
        
        return searchMatch && categoryMatch;
    });
    
    currentPage = 1;
    renderApps();
}

// Render the apps in the grid
function renderApps() {
    // Calculate pagination
    const totalPages = Math.ceil(filteredApps.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentApps = filteredApps.slice(startIndex, endIndex);
    
    // Clear the grid
    appsGrid.innerHTML = '';
    
    // Show message if no apps match filters
    if (filteredApps.length === 0) {
        appsGrid.innerHTML = `
            <div class="no-results">
                <h3>No apps found</h3>
                <p>Try changing your search or filter criteria.</p>
            </div>
        `;
        paginationContainer.innerHTML = '';
        return;
    }
    
    // Render each app card
    currentApps.forEach(app => {
        const isRTL = detectRTL(app.title) || detectRTL(app.description);
        const dirAttribute = isRTL ? 'dir="rtl"' : '';
        
        const appCard = document.createElement('div');
        appCard.className = 'app-card';
        if (isRTL) appCard.setAttribute('dir', 'rtl');
        
        appCard.innerHTML = `
            <div class="app-image">
                <img src="${app.image_url || '/api/placeholder/400/320'}" alt="${app.title}" onerror="this.src='/api/placeholder/400/320'; this.onerror=null;">
            </div>
            <div class="app-content">
                <h3 class="app-title">${app.title || 'Untitled App'}</h3>
                <p class="app-description">${app.description || 'No description available.'}</p>
                <div class="app-categories">
                    ${app.categories ? app.categories.map(cat => `<span class="app-category">${cat}</span>`).join('') : ''}
                </div>                
                <a href="${app.link || '#'}" class="app-link" target="_blank" rel="noopener noreferrer">View App</a>
            </div>
        `;
        
        appsGrid.appendChild(appCard);
    });
    
    // Render pagination
    renderPagination(totalPages);
}

// Helper function to detect RTL text
function detectRTL(text) {
    if (!text) return false;
    const rtlChars = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
    return rtlChars.test(text);
}

// Render pagination controls
function renderPagination(totalPages) {
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" 
            ${currentPage === 1 ? 'disabled' : ''}
            data-page="prev">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // First page
    paginationHTML += `
        <button class="page-btn ${currentPage === 1 ? 'active' : ''}" data-page="1">1</button>
    `;
    
    // Ellipsis and middle pages
    if (totalPages > 5) {
        if (currentPage > 3) {
            paginationHTML += `<span class="page-btn disabled">...</span>`;
        }
        
        let startPage = Math.max(2, currentPage - 1);
        let endPage = Math.min(totalPages - 1, currentPage + 1);
        
        if (currentPage <= 3) {
            endPage = Math.min(4, totalPages - 1);
        }
        
        if (currentPage >= totalPages - 2) {
            startPage = Math.max(2, totalPages - 3);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="page-btn ${currentPage === i ? 'active' : ''}" data-page="${i}">${i}</button>
            `;
        }
        
        if (currentPage < totalPages - 2) {
            paginationHTML += `<span class="page-btn disabled">...</span>`;
        }
    } else {
        for (let i = 2; i < totalPages; i++) {
            paginationHTML += `
                <button class="page-btn ${currentPage === i ? 'active' : ''}" data-page="${i}">${i}</button>
            `;
        }
    }
    
    // Last page
    if (totalPages > 1) {
        paginationHTML += `
            <button class="page-btn ${currentPage === totalPages ? 'active' : ''}" data-page="${totalPages}">${totalPages}</button>
        `;
    }
    
    // Next button
    paginationHTML += `
        <button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" 
            ${currentPage === totalPages ? 'disabled' : ''}
            data-page="next">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
    
    // Add event listeners to pagination buttons
    document.querySelectorAll('.page-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            
            if (page === 'prev') {
                currentPage--;
            } else if (page === 'next') {
                currentPage++;
            } else {
                currentPage = parseInt(page);
            }
            
            renderApps();
            appsGrid.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// Event listeners
searchInput.addEventListener('input', filterApps);

// Initialize app
document.addEventListener('DOMContentLoaded', fetchApps);


// Add this to the beginning of your script.js file
// Theme toggle functionality
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const storedTheme = localStorage.getItem('theme');
    
    // Apply stored theme on page load
    if (storedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        
        // Store the theme preference
        const currentTheme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
    });
}

// Add this to your DOMContentLoaded event
document.addEventListener('DOMContentLoaded', () => {
    fetchApps();
    initThemeToggle();  // Add this line
});