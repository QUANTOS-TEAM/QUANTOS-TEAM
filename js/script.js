/**
 * ═══════════════════════════════════════════════════════════════════════════
 * QUANTOS Research Team - Main JavaScript
 * 
 * Table of Contents:
 * 1. Constants & Configuration
 * 2. Utility Functions
 * 3. Header & Footer Management
 * 4. Navigation Functions
 * 5. Slider/Carousel Functions
 * 6. Posts & Filtering
 * 7. Form Validation
 * 8. Content Loading
 * 9. Initialization
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
    POSTS_PER_PAGE: 12,
    SLIDER_INTERVAL: 5000,
    ANIMATION_DURATION: 300,
    MOBILE_BREAKPOINT: 768
};

const SELECTORS = {
    HEADER_PLACEHOLDER: '#header-placeholder',
    FOOTER_PLACEHOLDER: '#footer-placeholder',
    POSTS_CONTAINER: '#posts-container',
    POST_CONTENT: '.post-content',
    NEWS_FILTER: '.news-filter',
    CONTACT_FORM: '#contactForm',
    SLIDER: {
        CONTAINER: '#minimal-slides-container',
        DOTS: '#minimal-slider-dots',
        PREV: '#minimal-prev',
        NEXT: '#minimal-next'
    },
    PAGINATION: {
        PREV: '#prev-page',
        NEXT: '#next-page',
        NUMBERS: '#page-numbers'
    }
};

// State management
const STATE = {
    currentPage: 1,
    allPosts: [],
    filteredPosts: [],
    currentFilter: 'all',
    sliderIndex: 0,
    sliderInterval: null
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Determines the base path for the site (handles GitHub Pages subdirectories)
 * @returns {string} Base path with trailing slash or empty string
 */
const getBasePath = () => {
    const pathArray = window.location.pathname.split('/');
    const hasSubdirectory = pathArray.length > 2 && 
                           pathArray[1] !== '' && 
                           !pathArray[1].includes('.html');
    
    if (hasSubdirectory && window.location.hostname.includes('github.io')) {
        return `/${pathArray[1]}/`;
    }
    return '';
};

/**
 * Checks if current page is a post page
 * @returns {boolean} True if on a post page
 */
const isPostPage = () => window.location.pathname.includes('/posts/');

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
};

/**
 * Safely queries DOM element
 * @param {string} selector - CSS selector
 * @returns {Element|null} DOM element or null
 */
const getElement = (selector) => document.querySelector(selector);

/**
 * Safely queries all matching DOM elements
 * @param {string} selector - CSS selector
 * @returns {NodeList} List of matching elements
 */
const getElements = (selector) => document.querySelectorAll(selector);

// Cache base path
const BASE_PATH = getBasePath();

// ═══════════════════════════════════════════════════════════════════════════
// 3. HEADER & FOOTER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Adjusts paths in HTML content for post pages
 * @param {string} html - HTML content to process
 * @returns {string} Processed HTML with adjusted paths
 */
const adjustPathsForPosts = (html) => {
    if (!isPostPage()) return html;
    
    // Fix image sources
    html = html.replace(/src="img\//g, 'src="../../img/');
    
    // Fix HTML links
    html = html.replace(/href="([^"]*\.html)"/g, (match, p1) => {
        if (p1.startsWith('http') || p1.startsWith('#')) {
            return match;
        }
        return `href="../../${p1}"`;
    });
    
    return html;
};

/**
 * Loads and injects header HTML
 */
async function loadHeader() {
    const placeholder = getElement(SELECTORS.HEADER_PLACEHOLDER);
    if (!placeholder) return;
    
    const headerPath = isPostPage() ? '../../header.html' : 'header.html';
    
    try {
        const response = await fetch(headerPath);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        let html = await response.text();
        html = adjustPathsForPosts(html);
        
        placeholder.innerHTML = html;
        
        // Initialize header-dependent features
        setActiveNavLink();
        initMobileNav();
    } catch (error) {
        console.error('Error loading header:', error);
        placeholder.innerHTML = '<header><div class="container"><div class="logo">QUANTOS</div></div></header>';
    }
}

/**
 * Loads and injects footer HTML
 */
async function loadFooter() {
    const placeholder = getElement(SELECTORS.FOOTER_PLACEHOLDER);
    if (!placeholder) return;
    
    const footerPath = isPostPage() ? '../../footer.html' : 'footer.html';
    
    try {
        const response = await fetch(footerPath);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        let html = await response.text();
        html = adjustPathsForPosts(html);
        
        placeholder.innerHTML = html;
    } catch (error) {
        console.error('Error loading footer:', error);
        placeholder.innerHTML = '<footer><div class="container"><p>© 2025 QUANTOS Research Team</p></div></footer>';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. NAVIGATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sets active state on current navigation link
 */
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = getElements('nav ul li a');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        
        let href = link.getAttribute('href');
        
        // Clean up href for post pages
        if (isPostPage() && href?.startsWith('../../')) {
            href = href.replace('../../', '');
        }
        
        // Determine active state
        let shouldBeActive = false;
        
        if (isPostPage()) {
            // Highlight home for all post pages
            shouldBeActive = href === 'index.html';
        } else {
            const currentPageName = currentPath.split('/').pop();
            shouldBeActive = currentPageName === href || 
                           (currentPath.endsWith('/') && href === 'index.html');
        }
        
        if (shouldBeActive) {
            link.classList.add('active');
        }
    });
}

/**
 * Initializes mobile navigation menu
 */
function initMobileNav() {
    const toggle = getElement('.mobile-menu-toggle');
    const nav = getElement('nav');
    
    if (!toggle || !nav) return;
    
    // Toggle menu on click
    toggle.addEventListener('click', function() {
        nav.classList.toggle('active');
        this.innerHTML = this.innerHTML === '☰' ? '✕' : '☰';
    });
    
    // Keyboard accessibility
    toggle.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.click();
        }
    });
    
    // Close menu when clicking nav links on mobile
    const navLinks = getElements('nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= CONFIG.MOBILE_BREAKPOINT) {
                nav.classList.remove('active');
                toggle.innerHTML = '☰';
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. SLIDER/CAROUSEL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates a slide element
 * @param {Object} post - Post data
 * @returns {HTMLElement} Slide element
 */
function createSlide(post) {
    const slide = document.createElement('div');
    slide.className = 'minimal-slide';
    
    slide.innerHTML = `
        <div class="minimal-slide-content">
            <span class="post-type">${post.postType}</span>
            <h3>${post.title}</h3>
            <p>${post.excerpt}</p>
            <a href="posts/${post.folder}/${post.index_file_name}.html" class="btn">Read More</a>
        </div>
        <div class="minimal-slide-image">
            <img src="posts/${post.folder}/thumbnail.png" alt="${post.title}">
        </div>
    `;
    
    return slide;
}

/**
 * Updates slider to show specific slide
 * @param {number} index - Slide index to show
 */
function goToSlide(index) {
    const container = getElement(SELECTORS.SLIDER.CONTAINER);
    const dots = getElements('.minimal-dot');
    
    if (!container) return;
    
    container.style.transform = `translateX(-${index * 100}%)`;
    
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
    
    STATE.sliderIndex = index;
}

/**
 * Starts automatic slide progression
 */
function startSliderAutoPlay() {
    stopSliderAutoPlay();
    STATE.sliderInterval = setInterval(() => {
        const slides = getElements('.minimal-slide');
        if (slides.length > 0) {
            const nextIndex = (STATE.sliderIndex + 1) % slides.length;
            goToSlide(nextIndex);
        }
    }, CONFIG.SLIDER_INTERVAL);
}

/**
 * Stops automatic slide progression
 */
function stopSliderAutoPlay() {
    if (STATE.sliderInterval) {
        clearInterval(STATE.sliderInterval);
        STATE.sliderInterval = null;
    }
}

/**
 * Initializes the highlights slider
 */
async function initMinimalSlider() {
    const container = getElement(SELECTORS.SLIDER.CONTAINER);
    const dotsContainer = getElement(SELECTORS.SLIDER.DOTS);
    
    if (!container || !dotsContainer) return;
    
    // Clear existing content
    container.innerHTML = '';
    dotsContainer.innerHTML = '';
    
    try {
        const response = await fetch(BASE_PATH + 'posts/posts.json');
        if (!response.ok) throw new Error('Failed to load posts');
        
        const posts = await response.json();
        const highlights = posts.filter(post => post.tags?.includes('highlight'));
        
        if (highlights.length === 0) {
            container.innerHTML = `
                <div class="minimal-slide">
                    <div class="minimal-slide-content">
                        <h3>No highlights available</h3>
                        <p>Check back soon for featured content.</p>
                    </div>
                    <div class="minimal-slide-image"></div>
                </div>
            `;
            return;
        }
        
        // Create slides and dots
        highlights.forEach((post, index) => {
            // Add slide
            container.appendChild(createSlide(post));
            
            // Add dot
            const dot = document.createElement('div');
            dot.className = 'minimal-dot';
            dot.dataset.index = index;
            if (index === 0) dot.classList.add('active');
            dotsContainer.appendChild(dot);
        });
        
        // Initialize controls
        setupSliderControls();
        
        // Start autoplay
        startSliderAutoPlay();
        
        // Pause on hover
        container.addEventListener('mouseenter', stopSliderAutoPlay);
        container.addEventListener('mouseleave', startSliderAutoPlay);
        
    } catch (error) {
        console.error('Error initializing slider:', error);
        container.innerHTML = `
            <div class="minimal-slide">
                <div class="minimal-slide-content">
                    <h3>Error loading highlights</h3>
                    <p>Please refresh the page to try again.</p>
                </div>
                <div class="minimal-slide-image"></div>
            </div>
        `;
    }
}

/**
 * Sets up slider control event listeners
 */
function setupSliderControls() {
    // Dot navigation
    const dots = getElements('.minimal-dot');
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToSlide(index));
    });
    
    // Button navigation
    const prevBtn = getElement(SELECTORS.SLIDER.PREV);
    const nextBtn = getElement(SELECTORS.SLIDER.NEXT);
    const slides = getElements('.minimal-slide');
    
    if (prevBtn && slides.length > 0) {
        prevBtn.addEventListener('click', () => {
            const newIndex = (STATE.sliderIndex - 1 + slides.length) % slides.length;
            goToSlide(newIndex);
        });
    }
    
    if (nextBtn && slides.length > 0) {
        nextBtn.addEventListener('click', () => {
            const newIndex = (STATE.sliderIndex + 1) % slides.length;
            goToSlide(newIndex);
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. POSTS & FILTERING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates a post card HTML
 * @param {Object} post - Post data
 * @returns {string} Post card HTML
 */
function createPostCard(post) {
    return `
        <div class="post-card" data-post="${post.tags?.[0] || ''}">
            <div class="post-image">
                <img src="posts/${post.folder}/thumbnail.png" alt="${post.title}">
            </div>
            <div class="post-content">
                <span class="post-type">${post.postType}</span>
                <h3 class="post-title">${post.title}</h3>
                <p class="post-date">${post.date}</p>
                <p class="post-excerpt">${post.excerpt}</p>
                <a href="posts/${post.folder}/${post.index_file_name}.html" class="btn">Read More</a>
            </div>
        </div>
    `;
}

/**
 * Loads all posts from JSON file
 */
async function loadPosts() {
    const container = getElement(SELECTORS.POSTS_CONTAINER);
    if (!container) return;
    
    try {
        if (STATE.allPosts.length === 0) {
            const response = await fetch(BASE_PATH + 'posts/posts.json');
            if (!response.ok) throw new Error('Failed to load posts');
            
            STATE.allPosts = await response.json();
            STATE.filteredPosts = [...STATE.allPosts];
        }
        
        displayPostsPage(STATE.currentPage);
        updatePaginationControls();
        initPostFiltering();
        
    } catch (error) {
        console.error('Error loading posts:', error);
        container.innerHTML = '<p>Failed to load posts. Please try again later.</p>';
    }
}

/**
 * Displays posts for current page
 * @param {number} page - Page number to display
 */
function displayPostsPage(page) {
    const container = getElement(SELECTORS.POSTS_CONTAINER);
    if (!container) return;
    
    const startIndex = (page - 1) * CONFIG.POSTS_PER_PAGE;
    const endIndex = startIndex + CONFIG.POSTS_PER_PAGE;
    const postsToShow = STATE.filteredPosts.slice(startIndex, endIndex);
    
    if (postsToShow.length === 0) {
        container.innerHTML = '<p>No posts match the current filter.</p>';
        return;
    }
    
    container.innerHTML = postsToShow.map(createPostCard).join('');
}

/**
 * Updates pagination controls based on current state
 */
function updatePaginationControls() {
    const totalPages = Math.ceil(STATE.filteredPosts.length / CONFIG.POSTS_PER_PAGE);
    const prevButton = getElement(SELECTORS.PAGINATION.PREV);
    const nextButton = getElement(SELECTORS.PAGINATION.NEXT);
    const pageNumbers = getElement(SELECTORS.PAGINATION.NUMBERS);
    
    if (!prevButton || !nextButton || !pageNumbers) return;
    
    // Update button states
    prevButton.disabled = STATE.currentPage === 1;
    nextButton.disabled = STATE.currentPage === totalPages || totalPages === 0;
    
    // Generate page numbers
    pageNumbers.innerHTML = generatePageNumbers(totalPages);
    
    // Add click handlers to page links
    getElements('.page-numbers a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            STATE.currentPage = parseInt(this.dataset.page);
            displayPostsPage(STATE.currentPage);
            updatePaginationControls();
            scrollToSection('.news-feed');
        });
    });
}

/**
 * Generates pagination number links HTML
 * @param {number} totalPages - Total number of pages
 * @returns {string} HTML for page numbers
 */
function generatePageNumbers(totalPages) {
    if (totalPages === 0) return '<span class="current-page">0</span>';
    
    const current = STATE.currentPage;
    let html = '';
    
    // Calculate visible page range
    let startPage = Math.max(1, current - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // First page
    if (startPage > 1) {
        html += `<a href="#" data-page="1">1</a>`;
        if (startPage > 2) html += '<span>...</span>';
    }
    
    // Page range
    for (let i = startPage; i <= endPage; i++) {
        if (i === current) {
            html += `<span class="current-page">${i}</span>`;
        } else {
            html += `<a href="#" data-page="${i}">${i}</a>`;
        }
    }
    
    // Last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span>...</span>';
        html += `<a href="#" data-page="${totalPages}">${totalPages}</a>`;
    }
    
    return html;
}

/**
 * Initializes post filtering functionality
 */
function initPostFiltering() {
    const filterButtons = getElements('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.dataset.filter;
            
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Apply filter
            STATE.currentFilter = filter;
            applyFilter(filter);
            
            // Reset to first page
            STATE.currentPage = 1;
            displayPostsPage(STATE.currentPage);
            updatePaginationControls();
        });
    });
}

/**
 * Applies filter to posts
 * @param {string} filter - Filter value to apply
 */
function applyFilter(filter) {
    if (filter === 'all') {
        STATE.filteredPosts = [...STATE.allPosts];
    } else {
        STATE.filteredPosts = STATE.allPosts.filter(post => 
            post.tags?.includes(filter)
        );
    }
}

/**
 * Scrolls to a specific section smoothly
 * @param {string} selector - CSS selector for target section
 */
function scrollToSection(selector) {
    const section = getElement(selector);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. FORM VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Shows validation error message
 * @param {HTMLElement} input - Input element with error
 * @param {string} message - Error message to display
 */
function showError(input, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = 'color: #0091BE; font-size: 0.8rem; margin-top: 5px;';
    errorDiv.textContent = message;
    
    input.parentElement.appendChild(errorDiv);
}

/**
 * Initializes contact form validation
 */
function initContactFormValidation() {
    const form = getElement(SELECTORS.CONTACT_FORM);
    if (!form) return;
    
    form.addEventListener('submit', function(event) {
        let isValid = true;
        
        // Clear previous errors
        getElements('.error-message').forEach(el => el.remove());
        
        // Validate fields
        const fields = {
            name: { element: getElement('#name'), message: 'Name is required' },
            email: { element: getElement('#email'), message: 'Valid email is required' },
            message: { element: getElement('#message'), message: 'Message is required' }
        };
        
        // Check each field
        Object.entries(fields).forEach(([key, field]) => {
            if (!field.element) return;
            
            const value = field.element.value.trim();
            
            if (!value) {
                showError(field.element, field.message);
                isValid = false;
            } else if (key === 'email' && !isValidEmail(value)) {
                showError(field.element, 'Please enter a valid email');
                isValid = false;
            }
        });
        
        if (!isValid) {
            event.preventDefault();
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. CONTENT LOADING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Loads site variables from JSON file
 */
async function loadSiteVariables() {
    try {
        const variablesPath = isPostPage() ? '../../variables.json' : 'variables.json';
        const response = await fetch(variablesPath);
        
        if (!response.ok) throw new Error('Failed to load variables');
        
        const variables = await response.json();
        
        // Apply variables to elements
        applyVariables(variables);
        
    } catch (error) {
        console.error('Error loading site variables:', error);
    }
}

/**
 * Applies variables to DOM elements
 * @param {Object} variables - Variables object
 */
function applyVariables(variables) {
    // Handle text content
    getElements('[data-variable]').forEach(element => {
        const variableName = element.getAttribute('data-variable');
        const value = getNestedValue(variables, variableName);
        
        if (value !== null) {
            element.textContent = value;
        }
    });
    
    // Handle href attributes
    getElements('[data-variable-href]').forEach(element => {
        const variableName = element.getAttribute('data-variable-href');
        const value = getNestedValue(variables, variableName);
        
        if (value !== null) {
            element.href = value;
        }
    });
}

/**
 * Gets nested object value using dot notation
 * @param {Object} obj - Object to search
 * @param {string} path - Dot-separated path
 * @returns {*} Value at path or null
 */
function getNestedValue(obj, path) {
    const parts = path.split('.');
    let value = obj;
    
    for (const part of parts) {
        if (value && value[part] !== undefined) {
            value = value[part];
        } else {
            return null;
        }
    }
    
    return value;
}

/**
 * Loads and renders markdown content for posts
 */
async function loadMarkdownContent() {
    const postContent = getElement(SELECTORS.POST_CONTENT);
    if (!postContent) return;
    
    try {
        // Extract post folder from URL
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const postFolder = pathParts[pathParts.length - 2];
        
        // Load posts.json to get markdown filename
        const postsResponse = await fetch('../../posts/posts.json');
        if (!postsResponse.ok) throw new Error('Failed to load posts.json');
        
        const posts = await postsResponse.json();
        const currentPost = posts.find(post => post.folder === postFolder);
        
        if (!currentPost?.md_file_name) {
            throw new Error(`No markdown file for post: ${postFolder}`);
        }
        
        // Load markdown file
        const markdownResponse = await fetch(`${currentPost.md_file_name}.md`);
        if (!markdownResponse.ok) throw new Error('Failed to load markdown');
        
        const markdown = await markdownResponse.text();
        
        // Process and render markdown
        renderMarkdown(postContent, markdown);
        
    } catch (error) {
        console.error('Error loading markdown:', error);
        postContent.innerHTML = '<p>Error loading content. Please try again later.</p>';
    }
}

/**
 * Processes and renders markdown content
 * @param {HTMLElement} container - Container element
 * @param {string} markdown - Markdown content
 */
function renderMarkdown(container, markdown) {
    // Protect LaTeX from markdown parser
    const processedMarkdown = markdown
        .replace(/\$\$([\s\S]*?)\$\$/g, match => '<!--MATH_DISPLAY:' + btoa(match) + '-->')
        .replace(/\$([\s\S]*?)\$/g, match => '<!--MATH_INLINE:' + btoa(match) + '-->');
    
    // Parse markdown
    let html = marked.parse(processedMarkdown);
    
    // Restore LaTeX
    html = html
        .replace(/<!--MATH_DISPLAY:(.*?)-->/g, (_, p1) => atob(p1))
        .replace(/<!--MATH_INLINE:(.*?)-->/g, (_, p1) => atob(p1));
    
    // Update content
    container.innerHTML = html;
    
    // Trigger MathJax rendering
    if (window.MathJax?.typeset) {
        MathJax.typeset();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sets up pagination button event listeners
 */
function initPaginationButtons() {
    const prevButton = getElement(SELECTORS.PAGINATION.PREV);
    const nextButton = getElement(SELECTORS.PAGINATION.NEXT);
    
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (STATE.currentPage > 1) {
                STATE.currentPage--;
                displayPostsPage(STATE.currentPage);
                updatePaginationControls();
                scrollToSection('.news-feed');
            }
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            const totalPages = Math.ceil(STATE.filteredPosts.length / CONFIG.POSTS_PER_PAGE);
            if (STATE.currentPage < totalPages) {
                STATE.currentPage++;
                displayPostsPage(STATE.currentPage);
                updatePaginationControls();
                scrollToSection('.news-feed');
            }
        });
    }
}

/**
 * Main initialization function
 */
function init() {
    // Load page components
    loadHeader();
    loadFooter();
    loadSiteVariables();
    
    // Initialize features based on page elements
    if (getElement(SELECTORS.SLIDER.CONTAINER)) {
        initMinimalSlider();
    }
    
    if (getElement(SELECTORS.NEWS_FILTER)) {
        initPostFiltering();
    }
    
    if (getElement(SELECTORS.CONTACT_FORM)) {
        initContactFormValidation();
    }
    
    if (getElement(SELECTORS.POSTS_CONTAINER)) {
        loadPosts();
        initPaginationButtons();
    }
    
    if (getElement(SELECTORS.POST_CONTENT)) {
        loadMarkdownContent();
    }
}

// Start initialization when DOM is ready
document.addEventListener('DOMContentLoaded', init);