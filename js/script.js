/**
 * ═══════════════════════════════════════════════════════════════════════════
 * QUANTOS Research Team - Main JavaScript
 * 
 * Table of Contents:
 * 1. Constants & Configuration
 * 2. State Management
 * 3. Utility Functions
 * 4. Header & Footer Management
 * 5. Navigation Functions
 * 6. Dark Mode Functions
 * 7. Slider/Carousel Functions
 * 8. Posts & Filtering Functions
 * 9. Pagination Functions
 * 10. Content Loading Functions
 * 11. Initialization
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
    POSTS_PER_PAGE: 6,
    SLIDER_INTERVAL: 5000,
    ANIMATION_DURATION: 300,
    MOBILE_BREAKPOINT: 768,
    DARK_MODE_CHECK_INTERVAL: 100
};

const SELECTORS = {
    // Layout
    HEADER_PLACEHOLDER: '#header-placeholder',
    FOOTER_PLACEHOLDER: '#footer-placeholder',
    
    // Dark mode
    DARK_MODE_TOGGLE: '#dark-mode-toggle',
    
    // Posts
    POSTS_CONTAINER: '#posts-container',
    POST_CONTENT: '.post-content',
    NEWS_FILTER: '.news-filter',
    FILTER_BTN: '.filter-btn',

    // Slider
    SLIDER: {
        CONTAINER: '#minimal-slides-container',
        DOTS: '#minimal-slider-dots',
        PREV: '#minimal-prev',
        NEXT: '#minimal-next',
        DOT: '.minimal-dot',
        SLIDE: '.minimal-slide'
    },
    
    // Pagination
    PAGINATION: {
        PREV: '#prev-page',
        NEXT: '#next-page',
        NUMBERS: '#page-numbers',
        LINKS: '.page-numbers a'
    },
    
    // Navigation
    NAV: 'nav',
    NAV_LINKS: 'nav ul li a',
    MOBILE_TOGGLE: '.mobile-menu-toggle',
    
    // Data attributes
    DATA_VARIABLE: '[data-variable]',
    DATA_VARIABLE_HREF: '[data-variable-href]',

    // Projects
    PROJECTS_CONTAINER: '#projects-container',
    PROJECT_DETAIL_CONTAINER: '#project-detail-container',
    PROJECT_MARKDOWN_CONTENT: '.project-markdown-content',

    // Project page
    ALL_PROJECTS_CONTAINER: '#all-projects-container',
    PROJECTS_RESULTS_COUNT: '#projects-results-count',
    PROJECTS_LAB_FILTERS: '#projects-lab-filters',
    PROJECTS_STATUS_FILTERS: '#projects-status-filters',
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

const STATE = {
    // Posts
    currentPage: 1,
    allPosts: [],
    filteredPosts: [],
    currentFilter: 'all',
    
    // Slider
    sliderIndex: 0,
    sliderInterval: null,
    
    // System
    basePath: null
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

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

/**
 * Determines the base path for the site (handles GitHub Pages subdirectories)
 * @returns {string} Base path with trailing slash or empty string
 */
const getBasePath = () => {
    if (STATE.basePath !== null) return STATE.basePath;
    
    const pathArray = window.location.pathname.split('/');
    const hasSubdirectory = pathArray.length > 2 && 
                           pathArray[1] !== '' && 
                           !pathArray[1].includes('.html');
    
    STATE.basePath = (hasSubdirectory && window.location.hostname.includes('github.io')) 
        ? `/${pathArray[1]}/` 
        : '';
    
    return STATE.basePath;
};

/**
 * Checks if current page is a post page
 * @returns {boolean} True if on a post page
 */

// const isPostPage = () => window.location.pathname.includes('/posts/');

const isPostPage = () => window.location.pathname.includes('/posts/');
const isProjectPage = () => window.location.pathname.includes('/projects/');
const isNestedContentPage = () => isPostPage() || isProjectPage();

const getRelativeRootPath = () => {
  return isNestedContentPage() ? '../../' : '';
};

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
 * Scrolls to a specific section smoothly
 * @param {string} selector - CSS selector for target section
 */
const scrollToSection = (selector) => {
    const section = getElement(selector);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
};

/**
 * Gets nested object value using dot notation
 * @param {Object} obj - Object to search
 * @param {string} path - Dot-separated path
 * @returns {*} Value at path or null
 */
const getNestedValue = (obj, path) => {
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
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. HEADER & FOOTER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Adjusts paths in HTML content for post pages
 * @param {string} html - HTML content to process
 * @returns {string} Processed HTML with adjusted paths
 */
const adjustPathsForNestedPages = (html) => {
  if (!isNestedContentPage()) return html;

  html = html.replace(/src="img\//g, 'src="../../img/');

  html = html.replace(/href="([^"]*\.html)"/g, (match, p1) => {
    if (p1.startsWith('http') || p1.startsWith('#') || p1.startsWith('../../')) {
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
    
    // const headerPath = isPostPage() ? '../../header.html' : 'header.html';

    const headerPath = getRelativeRootPath() + 'header.html';
    
    try {
        const response = await fetch(headerPath);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        let html = await response.text();
        html = adjustPathsForNestedPages(html);
        
        placeholder.innerHTML = html;
        
        // Initialize header-dependent features
        setActiveNavLink();
        initMobileNav();
        initDarkModeToggle();
        
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
    
    // const footerPath = isPostPage() ? '../../footer.html' : 'footer.html';

    const footerPath = getRelativeRootPath() + 'footer.html';
    
    try {
        const response = await fetch(footerPath);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        let html = await response.text();
        html = adjustPathsForNestedPages(html);
        
        placeholder.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading footer:', error);
        placeholder.innerHTML = '<footer><div class="container"><p>© 2025 QUANTOS Research Team</p></div></footer>';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. NAVIGATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sets active state on current navigation link
 */
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = getElements(SELECTORS.NAV_LINKS);
    
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
    const toggle = getElement(SELECTORS.MOBILE_TOGGLE);
    const nav = getElement(SELECTORS.NAV);
    
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
    const navLinks = getElements(SELECTORS.NAV_LINKS);
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
// 6. DARK MODE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initializes dark mode based on saved preference
 */
function initDarkMode() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

/**
 * Initializes dark mode toggle button
 */
function initDarkModeToggle() {
    const darkModeToggle = getElement(SELECTORS.DARK_MODE_TOGGLE);
    
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            
            const isDarkMode = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. SLIDER/CAROUSEL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates a slide element
 * @param {Object} post - Post data
 * @returns {HTMLElement} Slide element
 */
function createSlide(post) {
    const href = post.external_url
        ? post.external_url
        : `posts/${post.folder}/${post.index_file_name}.html`;
    const target = post.external_url ? ' target="_blank" rel="noopener"' : '';


    const slide = document.createElement('div');
    slide.className = 'minimal-slide';
    
    slide.innerHTML = `
        <div class="minimal-slide-content">
            <span class="post-type">${post.postType}</span>
            <h3>${post.title}</h3>
            <p>${post.excerpt}</p>
            <a href="${href}" class="btn"${target}>Read More</a>
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
    const dots = getElements(SELECTORS.SLIDER.DOT);
    
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
        const slides = getElements(SELECTORS.SLIDER.SLIDE);
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
 * Sets up slider control event listeners
 */
function setupSliderControls() {
    // Dot navigation
    const dots = getElements(SELECTORS.SLIDER.DOT);
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToSlide(index));
    });
    
    // Button navigation
    const prevBtn = getElement(SELECTORS.SLIDER.PREV);
    const nextBtn = getElement(SELECTORS.SLIDER.NEXT);
    const slides = getElements(SELECTORS.SLIDER.SLIDE);
    
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
        const response = await fetch(getBasePath() + 'posts/posts.json');
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
            container.appendChild(createSlide(post));
            
            const dot = document.createElement('div');
            dot.className = 'minimal-dot';
            dot.dataset.index = index;
            if (index === 0) dot.classList.add('active');
            dotsContainer.appendChild(dot);
        });
        
        // Initialize controls and autoplay
        setupSliderControls();
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

// ═══════════════════════════════════════════════════════════════════════════
// 8. POSTS & FILTERING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates a post card HTML
 * @param {Object} post - Post data
 * @returns {string} Post card HTML
 */
function createPostCard(post) {
    const href = post.external_url
        ? post.external_url
        : `posts/${post.folder}/${post.index_file_name}.html`;
    const target = post.external_url ? ' target="_blank" rel="noopener"' : '';

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
                <a href="${href}" class="btn"${target}>Read More</a>
            </div>
        </div>
    `;
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
 * Initializes post filtering functionality
 */
function initPostFiltering() {
    const filterButtons = getElements(SELECTORS.FILTER_BTN);
    
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
 * Loads all posts from JSON file
 */
async function loadPosts() {
    const container = getElement(SELECTORS.POSTS_CONTAINER);
    if (!container) return;
    
    try {
        if (STATE.allPosts.length === 0) {
            const response = await fetch(getBasePath() + 'posts/posts.json');
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

// ═══════════════════════════════════════════════════════════════════════════
// 9. PAGINATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

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
    getElements(SELECTORS.PAGINATION.LINKS).forEach(link => {
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

// ═══════════════════════════════════════════════════════════════════════════
// PROJECTS FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function escapeHTML(value) {
  if (value === null || value === undefined) return '';

  return String(value).replace(/[&<>"']/g, function(character) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[character];
  });
}

function getResearchLineInfo(researchLineId) {
  const researchLines = {
    quantum_imaging: {
      label: 'Quantum Imaging',
      url: 'quantum_imaging.html'
    },
    optical_computing: {
      label: 'Optical Computing',
      url: 'optical_computing.html'
    },
    paraxial_fluids: {
      label: 'Paraxial Fluids of Light',
      url: 'paraxial_fluids_of_light.html'
    },
    spectral_imaging: {
      label: 'Spectral Imaging',
      url: 'spectral_imaging.html'
    }
  };

  return researchLines[researchLineId] || {
    label: 'Research Line',
    url: 'research_lines.html'
  };
}

function updateProjectBreadcrumb(project) {
  const breadcrumb = document.querySelector('.project-breadcrumb');
  if (!breadcrumb) return;

  const researchLine = getResearchLineInfo(project.research_line);

  breadcrumb.innerHTML = `
    <a href="${getRelativeRootPath()}${researchLine.url}">${escapeHTML(researchLine.label)}</a>
    <span>/</span>
    <span>${escapeHTML(project.title)}</span>
  `;
}

function parseProjectDate(dateString) {
  if (!dateString) return new Date(0);
  const parsedDate = new Date(dateString);
  return Number.isNaN(parsedDate.getTime()) ? new Date(0) : parsedDate;
}

function formatProjectDate(dateString) {
  if (!dateString) return 'Present';

  const parsedDate = parseProjectDate(dateString);
  if (parsedDate.getTime() === 0) return dateString;

  return parsedDate.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short'
  });
}

function getProjectUrl(project) {
  const indexFile = project.index_file || 'index.html';
  return `${getRelativeRootPath()}projects/${project.folder}/${indexFile}`;
}

function getProjectThumbnailUrl(project) {
  const thumbnail = project.thumbnail || 'thumbnail.jpg';
  return `${getRelativeRootPath()}projects/${project.folder}/${thumbnail}`;
}

function createOngoingProjectCard(project) {
  return `
    <article class="project-card project-card-ongoing">
      <a class="project-card-image" href="${getProjectUrl(project)}" aria-label="Read more about ${escapeHTML(project.title)}">
        <img src="${getProjectThumbnailUrl(project)}" alt="${escapeHTML(project.title)} thumbnail" loading="lazy">
      </a>

      <div class="project-card-content">
        <div class="project-status project-status-ongoing">Ongoing</div>
        <h3>
          <a href="${getProjectUrl(project)}">${escapeHTML(project.title)}</a>
        </h3>
        <p>${escapeHTML(project.summary)}</p>
        <a class="btn project-read-more" href="${getProjectUrl(project)}">Read more</a>
      </div>
    </article>
  `;
}

function createFinishedProjectCard(project) {
  return `
    <article class="project-card project-card-finished">
      <a href="${getProjectUrl(project)}" aria-label="Read more about ${escapeHTML(project.title)}">
        <div class="project-finished-image">
          <img src="${getProjectThumbnailUrl(project)}" alt="${escapeHTML(project.title)} thumbnail" loading="lazy">
        </div>
        <h3>${escapeHTML(project.title)}</h3>
      </a>
    </article>
  `;
}

function sortOngoingProjects(projects) {
  return [...projects].sort((a, b) => {
    return parseProjectDate(b.start_date) - parseProjectDate(a.start_date);
  });
}

function sortFinishedProjects(projects) {
  return [...projects].sort((a, b) => {
    const dateA = a.end_date || a.start_date;
    const dateB = b.end_date || b.start_date;
    return parseProjectDate(dateB) - parseProjectDate(dateA);
  });
}

async function loadResearchLineProjects() {
  const container = getElement(SELECTORS.PROJECTS_CONTAINER);
  if (!container) return;

  const researchLine = container.dataset.researchLine;
  const projectsSection = container.closest('.projects-section');

  if (!researchLine) {
    if (projectsSection) {
      projectsSection.style.display = 'none';
    }
    return;
  }

  try {
    const response = await fetch(getRelativeRootPath() + 'projects/projects.json');
    if (!response.ok) throw new Error('Failed to load projects.json');

    const allProjects = await response.json();

    const researchLineProjects = allProjects.filter(project => {
      return project.research_line === researchLine;
    });

    const ongoingProjects = sortOngoingProjects(
      researchLineProjects.filter(project => project.status === 'ongoing')
    );

    const finishedProjects = sortFinishedProjects(
      researchLineProjects.filter(project => project.status === 'finished')
    );

    /*
      If this research line has no projects at all,
      hide the full Projects section, including the title.
    */
    if (ongoingProjects.length === 0 && finishedProjects.length === 0) {
      if (projectsSection) {
        projectsSection.style.display = 'none';
      }

      container.innerHTML = '';
      return;
    }

    /*
      If there are projects, make sure the section is visible.
      This is useful in case the browser cached a hidden state.
    */
    if (projectsSection) {
      projectsSection.style.display = '';
    }

    let html = '';

    /*
      Only show Ongoing Projects if there are ongoing projects.
    */
    if (ongoingProjects.length > 0) {
      html += `
        <div class="projects-group">
          <h3>Ongoing Projects</h3>
          <div class="ongoing-projects-grid">
            ${ongoingProjects.map(createOngoingProjectCard).join('')}
          </div>
        </div>
      `;
    }

    /*
      Only show Past Projects if there are finished projects.
    */
    if (finishedProjects.length > 0) {
      html += `
        <div class="projects-group">
          <h3>Past Projects</h3>
          <div class="finished-projects-grid">
            ${finishedProjects.map(createFinishedProjectCard).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading projects:', error);

    if (projectsSection) {
      projectsSection.style.display = 'none';
    }

    container.innerHTML = '';
  }
}

function createProjectMetaItem(label, value) {
  if (!value) return '';

  if (Array.isArray(value)) {
    if (value.length === 0) return '';

    return `
      <div class="project-meta-item">
        <span class="project-meta-label">${escapeHTML(label)}</span>
        <span class="project-meta-value">${value.map(escapeHTML).join(', ')}</span>
      </div>
    `;
  }

  return `
    <div class="project-meta-item">
      <span class="project-meta-label">${escapeHTML(label)}</span>
      <span class="project-meta-value">${escapeHTML(value)}</span>
    </div>
  `;
}

function createProjectOutputsSection(outputs) {
  if (!outputs) return '';

  const outputLabels = {
    publications: 'Publications',
    software: 'Software / Code',
    datasets: 'Datasets',
    reports: 'Reports',
    media: 'Videos / Media'
  };

  let html = '';

  Object.keys(outputLabels).forEach(type => {
    const items = outputs[type];

    if (!Array.isArray(items) || items.length === 0) return;

    html += `
      <section class="project-output-group">
        <h3>${outputLabels[type]}</h3>
        <div class="project-output-list">
          ${items.map(item => createProjectOutputItem(item)).join('')}
        </div>
      </section>
    `;
  });

  if (!html) return '';

  return `
    <section class="project-outputs-section">
      <h2>Outputs</h2>
      ${html}
    </section>
  `;
}

function createProjectOutputItem(item) {
  const title = item.title || 'Untitled output';
  const description = item.description || '';
  const authors = item.authors || '';
  const venue = item.venue || '';
  const year = item.year || '';
  const url = item.url || '';

  const titleHtml = url
    ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener">${escapeHTML(title)}</a>`
    : escapeHTML(title);

  const metaParts = [authors, venue, year].filter(Boolean);

  return `
    <article class="project-output-item">
      <h4>${titleHtml}</h4>
      ${metaParts.length > 0 ? `<p class="project-output-meta">${metaParts.map(escapeHTML).join(' • ')}</p>` : ''}
      ${description ? `<p>${escapeHTML(description)}</p>` : ''}
    </article>
  `;
}

async function createRelatedPostsSection(project) {
  if (!Array.isArray(project.related_posts) || project.related_posts.length === 0) {
    return '';
  }

  try {
    const response = await fetch(getRelativeRootPath() + 'posts/posts.json');
    if (!response.ok) throw new Error('Failed to load posts.json');

    const posts = await response.json();

    const relatedPosts = project.related_posts
      .map(postId => posts.find(post => post.id === postId))
      .filter(Boolean);

    if (relatedPosts.length === 0) return '';

    return `
      <section class="project-related-posts">
        <h2>Related News</h2>
        <div class="project-related-posts-grid">
          ${relatedPosts.map(createRelatedPostCard).join('')}
        </div>
      </section>
    `;
  } catch (error) {
    console.error('Error loading related posts:', error);
    return '';
  }
}

function createRelatedPostCard(post) {
  const href = post.external_url
    ? post.external_url
    : `${getRelativeRootPath()}posts/${post.folder}/${post.index_file_name}.html`;

  const target = post.external_url ? ' target="_blank" rel="noopener"' : '';

  return `
    <article class="project-related-post-card">
      <p class="project-related-post-type">${escapeHTML(post.postType || 'News')}</p>
      <h3>
        <a href="${href}"${target}>${escapeHTML(post.title)}</a>
      </h3>
      <p class="project-related-post-date">${escapeHTML(post.date || '')}</p>
      <p>${escapeHTML(post.excerpt || '')}</p>
    </article>
  `;
}

// ${project.summary ? `<p class="project-detail-summary">${escapeHTML(project.summary)}</p>` : ''}

function renderProjectHeader(project, relatedPostsHtml) {
  const startDate = formatProjectDate(project.start_date);
  const endDate = formatProjectDate(project.end_date);
  const dateRange = `${startDate} – ${endDate}`;

  return `
    <header class="project-detail-header">
      <div class="project-detail-text">
        <div class="project-status ${project.status === 'ongoing' ? 'project-status-ongoing' : 'project-status-finished'}">
          ${project.status === 'ongoing' ? 'Ongoing' : 'Finished'}
        </div>

        <h1>${escapeHTML(project.title)}</h1>

        
        
        

        <div class="project-meta-grid">
          ${createProjectMetaItem('Period', dateRange)}
          ${createProjectMetaItem('Principal Investigator', project.principal_investigator)}
          ${createProjectMetaItem('Total Funding', project.total_funding)}
          ${createProjectMetaItem('Reference', project.project_reference)}
        </div>

        ${
          project.website
            ? `<a class="btn project-website-link" href="${escapeHTML(project.website)}" target="_blank" rel="noopener">Project website</a>`
            : ''
        }
      </div>

      <div class="project-detail-image">
        <img src="${escapeHTML(project.thumbnail || 'thumbnail.jpg')}" alt="${escapeHTML(project.title)} thumbnail">
      </div>
    </header>

    ${createProjectOutputsSection(project.outputs)}
    ${relatedPostsHtml}
  `;
}

async function loadProjectPage() {
  const detailContainer = getElement(SELECTORS.PROJECT_DETAIL_CONTAINER);
  const markdownContainer = getElement(SELECTORS.PROJECT_MARKDOWN_CONTENT);

  if (!detailContainer || !markdownContainer) return;

  try {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const projectsIndex = pathParts.indexOf('projects');

    const projectFolder = projectsIndex !== -1
        ? pathParts[projectsIndex + 1]
        : pathParts[pathParts.length - 2];

    const projectsResponse = await fetch(getRelativeRootPath() + 'projects/projects.json');
    if (!projectsResponse.ok) throw new Error('Failed to load projects.json');

    const projects = await projectsResponse.json();
    const currentProject = projects.find(project => project.folder === projectFolder);

    if (!currentProject) {
      throw new Error(`Project not found: ${projectFolder}`);
    }

    updateProjectBreadcrumb(currentProject);

    document.title = `${currentProject.title} | QUANTOS Research Team`;

    const relatedPostsHtml = await createRelatedPostsSection(currentProject);
    detailContainer.innerHTML = renderProjectHeader(currentProject, relatedPostsHtml);

    const contentFile = currentProject.content_file || 'content.md';
    const markdownResponse = await fetch(contentFile);

    if (!markdownResponse.ok) {
      markdownContainer.innerHTML = '<p>No project description available yet.</p>';
      return;
    }

    const markdown = await markdownResponse.text();
    renderMarkdown(markdownContainer, markdown);
    insertRelatedPostsGrid(currentProject);
  } catch (error) {
    console.error('Error loading project page:', error);
    detailContainer.innerHTML = '<p>Error loading project. Please try again later.</p>';
    markdownContainer.innerHTML = '';
  }
}

async function getRelatedPostsForProject(project) {
  try {
    const response = await fetch(getRelativeRootPath() + 'posts/posts.json');
    if (!response.ok) throw new Error('Failed to load posts.json');

    const posts = await response.json();

    const manuallyRelatedPostIds = Array.isArray(project.related_posts)
      ? project.related_posts
      : [];

    const relatedPosts = posts.filter(post => {
      const postRelatedProjects = Array.isArray(post.related_projects)
        ? post.related_projects
        : [];

      const isLinkedFromPost = postRelatedProjects.includes(project.id);
      const isLinkedFromProject = manuallyRelatedPostIds.includes(post.id);

      return isLinkedFromPost || isLinkedFromProject;
    });

    return relatedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error('Error loading related posts:', error);
    return [];
  }
}

function getPostUrl(post) {
  if (post.external_url) {
    return post.external_url;
  }

  return `${getRelativeRootPath()}posts/${post.folder}/${post.index_file_name}.html`;
}

function getPostThumbnailUrl(post) {
  if (!post.folder) return '';

  const thumbnail = post.thumbnail || 'thumbnail.png';

  if (thumbnail.startsWith('http')) {
    return thumbnail;
  }

  return `${getRelativeRootPath()}posts/${post.folder}/${thumbnail}`;
}

function createRelatedPostThumbnailCard(post) {
  const postUrl = getPostUrl(post);
  const thumbnailUrl = getPostThumbnailUrl(post);
  const target = post.external_url ? ' target="_blank" rel="noopener"' : '';

  return `
    <article class="markdown-related-post-card">
      <a href="${postUrl}"${target}>
        ${
          thumbnailUrl
            ? `<div class="markdown-related-post-image">
                 <img 
                   src="${thumbnailUrl}" 
                   alt="${escapeHTML(post.title)} thumbnail" 
                   loading="lazy"
                   onerror="this.closest('.markdown-related-post-image').remove();"
                 >
               </div>`
            : ''
        }

        <h3>${escapeHTML(post.title)}</h3>
      </a>
    </article>
  `;
}

async function insertRelatedPostsGrid(project) {
  const placeholder = document.querySelector('[data-related-posts-grid]');
  if (!placeholder) return;

  const relatedPosts = await getRelatedPostsForProject(project);

  if (relatedPosts.length === 0) {
    placeholder.remove();
    return;
  }

  placeholder.outerHTML = `
    <div class="markdown-related-posts-grid">
      ${relatedPosts.map(createRelatedPostThumbnailCard).join('')}
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// ALL PROJECTS PAGE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const PROJECTS_PAGE_STATE = {
  projects: [],
  selectedLab: 'all',
  selectedStatus: 'all'
};

function getResearchLineInfo(researchLineId) {
  const researchLines = {
    quantum_imaging: {
      label: 'Quantum Imaging',
      url: 'quantum_imaging.html'
    },
    optical_computing: {
      label: 'Optical Computing',
      url: 'optical_computing.html'
    },
    paraxial_fluids: {
      label: 'Paraxial Fluids of Light',
      url: 'paraxial_fluids_of_light.html'
    },
    spectral_imaging: {
      label: 'Spectral Imaging',
      url: 'spectral_imaging.html'
    }
  };

  return researchLines[researchLineId] || {
    label: 'Research Line',
    url: 'research_lines.html'
  };
}

function createAllProjectsCard(project) {
  const researchLine = getResearchLineInfo(project.research_line);
  const projectStatusLabel = project.status === 'ongoing' ? 'Ongoing' : 'Finished';
  const projectStatusClass = project.status === 'ongoing'
    ? 'project-status-ongoing'
    : 'project-status-finished';

  return `
    <article class="all-project-card">
      <a class="all-project-card-image" href="${getProjectUrl(project)}" aria-label="Read more about ${escapeHTML(project.title)}">
        <img src="${getProjectThumbnailUrl(project)}" alt="${escapeHTML(project.title)} thumbnail" loading="lazy">
      </a>

      <div class="all-project-card-content">
        <div class="all-project-card-tags">
          <span class="project-status ${projectStatusClass}">${projectStatusLabel}</span>
          <a class="all-project-lab-tag" href="${researchLine.url}">
            ${escapeHTML(researchLine.label)}
          </a>
        </div>

        <h3>
          <a href="${getProjectUrl(project)}">${escapeHTML(project.title)}</a>
        </h3>

        ${project.summary ? `<p>${escapeHTML(project.summary)}</p>` : ''}

        <a class="btn all-project-read-more" href="${getProjectUrl(project)}">Read more</a>
      </div>
    </article>
  `;
}

function sortAllProjects(projects) {
  return [...projects].sort((a, b) => {
    const dateA = a.status === 'finished'
      ? (a.end_date || a.start_date)
      : a.start_date;

    const dateB = b.status === 'finished'
      ? (b.end_date || b.start_date)
      : b.start_date;

    return parseProjectDate(dateB) - parseProjectDate(dateA);
  });
}

function getFilteredProjects() {
  return PROJECTS_PAGE_STATE.projects.filter(project => {
    const matchesLab =
      PROJECTS_PAGE_STATE.selectedLab === 'all' ||
      project.research_line === PROJECTS_PAGE_STATE.selectedLab;

    const matchesStatus =
      PROJECTS_PAGE_STATE.selectedStatus === 'all' ||
      project.status === PROJECTS_PAGE_STATE.selectedStatus;

    return matchesLab && matchesStatus;
  });
}

function updateProjectsFilterButtons(containerSelector, dataAttribute, activeValue) {
  const container = getElement(containerSelector);
  if (!container) return;

  const buttons = container.querySelectorAll('.projects-filter-btn');

  buttons.forEach(button => {
    const buttonValue = button.dataset[dataAttribute];

    if (buttonValue === activeValue) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}

function renderAllProjectsPage() {
  const container = getElement(SELECTORS.ALL_PROJECTS_CONTAINER);
  const countElement = getElement(SELECTORS.PROJECTS_RESULTS_COUNT);

  if (!container) return;

  const filteredProjects = sortAllProjects(getFilteredProjects());

  if (countElement) {
    const projectWord = filteredProjects.length === 1 ? 'project' : 'projects';
    countElement.textContent = `${filteredProjects.length} ${projectWord} shown`;
  }

  if (filteredProjects.length === 0) {
    container.innerHTML = `
      <div class="projects-empty-state">
        <h3>No projects found</h3>
        <p>Try changing the selected research line or status filter.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredProjects.map(createAllProjectsCard).join('');
}

function initProjectsPageFilters() {
  const labFilters = getElement(SELECTORS.PROJECTS_LAB_FILTERS);
  const statusFilters = getElement(SELECTORS.PROJECTS_STATUS_FILTERS);

  if (labFilters) {
    labFilters.addEventListener('click', event => {
      const button = event.target.closest('[data-lab-filter]');
      if (!button) return;

      const selectedLab = button.dataset.labFilter;

      /*
        Only one research lab can be selected at a time.
        Clicking the already selected lab again returns to All.
      */
      PROJECTS_PAGE_STATE.selectedLab =
        PROJECTS_PAGE_STATE.selectedLab === selectedLab && selectedLab !== 'all'
          ? 'all'
          : selectedLab;

      updateProjectsFilterButtons(
        SELECTORS.PROJECTS_LAB_FILTERS,
        'labFilter',
        PROJECTS_PAGE_STATE.selectedLab
      );

      renderAllProjectsPage();
    });
  }

  if (statusFilters) {
    statusFilters.addEventListener('click', event => {
      const button = event.target.closest('[data-status-filter]');
      if (!button) return;

      const selectedStatus = button.dataset.statusFilter;

      /*
        Only one status is active at a time:
        All, Ongoing, or Finished.
        Clicking the active status again returns to All.
      */
      PROJECTS_PAGE_STATE.selectedStatus =
        PROJECTS_PAGE_STATE.selectedStatus === selectedStatus && selectedStatus !== 'all'
          ? 'all'
          : selectedStatus;

      updateProjectsFilterButtons(
        SELECTORS.PROJECTS_STATUS_FILTERS,
        'statusFilter',
        PROJECTS_PAGE_STATE.selectedStatus
      );

      renderAllProjectsPage();
    });
  }
}

async function loadAllProjectsPage() {
  const container = getElement(SELECTORS.ALL_PROJECTS_CONTAINER);
  if (!container) return;

  try {
    const response = await fetch(getRelativeRootPath() + 'projects/projects.json');
    if (!response.ok) throw new Error('Failed to load projects.json');

    PROJECTS_PAGE_STATE.projects = await response.json();

    initProjectsPageFilters();
    renderAllProjectsPage();
  } catch (error) {
    console.error('Error loading all projects:', error);

    container.innerHTML = `
      <div class="projects-empty-state">
        <h3>Projects could not be loaded</h3>
        <p>Please try again later.</p>
      </div>
    `;
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// 10. CONTENT LOADING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Loads site variables from JSON file
 */
async function loadSiteVariables() {
    try {
        // const variablesPath = isPostPage() ? '../../variables.json' : 'variables.json';
        const variablesPath = getRelativeRootPath() + 'variables.json';
        const response = await fetch(variablesPath);
        
        if (!response.ok) throw new Error('Failed to load variables');
        
        const variables = await response.json();
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
    getElements(SELECTORS.DATA_VARIABLE).forEach(element => {
        const variableName = element.getAttribute('data-variable');
        const value = getNestedValue(variables, variableName);
        
        if (value !== null) {
            element.textContent = value;
        }
    });
    
    // Handle href attributes
    getElements(SELECTORS.DATA_VARIABLE_HREF).forEach(element => {
        const variableName = element.getAttribute('data-variable-href');
        const value = getNestedValue(variables, variableName);
        
        if (value !== null) {
            element.href = value;
        }
    });
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
// 11. INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Main initialization function
 */
function init() {
    // Initialize dark mode immediately
    initDarkMode();
    
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

    if (getElement(SELECTORS.POSTS_CONTAINER)) {
        loadPosts();
        initPaginationButtons();
    }
    
    if (getElement(SELECTORS.POST_CONTENT)) {
        loadMarkdownContent();
    }

     if (getElement(SELECTORS.PROJECTS_CONTAINER)) {
    loadResearchLineProjects();
    }

    if (getElement(SELECTORS.PROJECT_DETAIL_CONTAINER)) {
        loadProjectPage();
    }

    if (getElement(SELECTORS.ALL_PROJECTS_CONTAINER)) {
    loadAllProjectsPage();
  }
}

// Start initialization when DOM is ready
document.addEventListener('DOMContentLoaded', init);