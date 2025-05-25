// Main JavaScript file for Research Group Website

// DOM Content Loaded Event - Main initialization
document.addEventListener('DOMContentLoaded', function() {
    // Load header and footer
    loadHeader();
    loadFooter();

    initMinimalSlider();
    
    // Initialize components if they exist
    // if (document.querySelector('.mini-highlights-slider')) {
    //     initMinimalSlider();
    // }
    
    if (document.querySelector('.news-filter')) {
        initPostFiltering();
    }
    
    if (document.querySelector('#contactForm')) {
        initContactFormValidation();
    }
    
    if (document.querySelector('#posts-container')) {
        loadPosts();
    }

    if (document.querySelector('.post-content')) {
        loadMarkdownContent();
    }

    loadSiteVariables();
});

// ===== HEADER & FOOTER FUNCTIONS =====

/**
 * Loads the header based on current path
 */
function loadHeader() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) return;
    
    // Determine correct path based on location
    const headerPath = window.location.pathname.includes('/posts/') 
        ? '../../header.html' 
        : 'header.html';
    
    fetch(headerPath)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load header: ' + response.status);
            }
            return response.text();
        })
        .then(data => {
            headerPlaceholder.innerHTML = data;
            // Initialize after header loads
            setActiveNavLink();
            initMobileNav();
        })
        .catch(error => {
            console.error('Error loading header:', error);
            headerPlaceholder.innerHTML = '<header><div class="container"><div class="logo">Research Group</div></div></header>';
        });
}

/**
 * Loads the footer based on current path
 */
function loadFooter() {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (!footerPlaceholder) return;
    
    // Determine correct path based on location
    const footerPath = window.location.pathname.includes('/posts/') 
        ? '../../footer.html' 
        : 'footer.html';
    
    fetch(footerPath)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load footer: ' + response.status);
            }
            return response.text();
        })
        .then(data => {
            footerPlaceholder.innerHTML = data;
        })
        .catch(error => {
            console.error('Error loading footer:', error);
            footerPlaceholder.innerHTML = '<footer><div class="container"><p>Footer content unavailable.</p></div></footer>';
        });
}

/**
 * Sets active navigation link based on current page
 */
function setActiveNavLink() {
    const currentPage = window.location.pathname;
    const navLinks = document.querySelectorAll('nav ul li a');
    
    navLinks.forEach(link => {
        // Remove active class from all links
        link.classList.remove('active');
        
        const href = link.getAttribute('href');
        
        // Add active class to the current page link
        if (currentPage.endsWith(href) || 
            (currentPage.endsWith('/') && href === '/index.html') ||
            (currentPage.includes('/posts/') && href === '/index.html') ||
            (currentPage.includes('/lab') && href === '/laboratories.html')) {
            link.classList.add('active');
        }
    });
}

/**
 * Initializes mobile navigation functionality
 */
function initMobileNav() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('nav');
    
    if (!mobileMenuToggle || !nav) return;
    
    mobileMenuToggle.addEventListener('click', function() {
        nav.classList.toggle('active');
        
        // Toggle between menu and close icons
        this.innerHTML = this.innerHTML === '☰' ? '✕' : '☰';
    });
    
    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                nav.classList.remove('active');
                mobileMenuToggle.innerHTML = '☰';
            }
        });
    });
}

// ===== HIGHLIGHTS & SLIDER FUNCTIONS =====

/**
 * Loads highlights from posts with "highlight" tag
 */

async function initMinimalSlider() {
    const slidesContainer = document.getElementById('minimal-slides-container');
    const dotsContainer = document.getElementById('minimal-slider-dots');
    
    if (!slidesContainer || !dotsContainer) return;
    
    // Clear any existing content
    slidesContainer.innerHTML = '';
    dotsContainer.innerHTML = '';
    
    try {
        // Fetch posts data from JSON file
        const response = await fetch('/posts/posts.json');
        if (!response.ok) {
            throw new Error('Failed to load posts data');
        }
        
        const posts = await response.json();
        
        // Filter posts with the "highlight" tag
        const highlights = posts.filter(post => 
            post.tags && post.tags.includes('highlight')
        );
        
        // Check if we found any highlights
        if (highlights.length === 0) {
            slidesContainer.innerHTML = `
                <div class="minimal-slide">
                    <div class="minimal-slide-content">
                        <h3>No highlights available</h3>
                        <p>There are currently no highlighted posts to display.</p>
                    </div>
                    <div class="minimal-slide-image">
                        <!-- Placeholder image or leave empty -->
                    </div>
                </div>
            `;
            return;
        }
        
        // Create slides for each highlight
        highlights.forEach((post, index) => {
            // Create slide element
            const slideElement = document.createElement('div');
            slideElement.className = 'minimal-slide';
            
            // Create slide content
            slideElement.innerHTML = `
                <div class="minimal-slide-content">
                    <span class="post-type">${post.postType}</span>
                    <h3>${post.title}</h3>
                    <p>${post.excerpt}</p>
                    <a href="/posts/${post.folder}/index.html" class="btn">Read More</a>
                </div>
                <div class="minimal-slide-image">
                    <img src="/posts/${post.folder}/thumbnail.png" alt="${post.title}">
                </div>
            `;
            
            // Add slide to container
            slidesContainer.appendChild(slideElement);
            
            // Create navigation dot
            const dot = document.createElement('div');
            dot.className = 'minimal-dot';
            if (index === 0) dot.classList.add('active');
            dot.dataset.index = index;
            dotsContainer.appendChild(dot);
        });
        
        // Set up slider functionality
        const slideElements = document.querySelectorAll('.minimal-slide');
        const dots = document.querySelectorAll('.minimal-dot');
        const prevBtn = document.getElementById('minimal-prev');
        const nextBtn = document.getElementById('minimal-next');
        
        let currentIndex = 0;
        
        // Function to go to a specific slide
        function goToSlide(index) {
            slidesContainer.style.transform = `translateX(-${index * 100}%)`;
            
            // Update active dot
            dots.forEach(dot => dot.classList.remove('active'));
            dots[index]?.classList.add('active');
            
            currentIndex = index;
        }
        
        // Add event listeners to dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                goToSlide(index);
            });
        });
        
        // Add event listeners to buttons
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const newIndex = (currentIndex - 1 + slideElements.length) % slideElements.length;
                goToSlide(newIndex);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const newIndex = (currentIndex + 1) % slideElements.length;
                goToSlide(newIndex);
            });
        }
        
        // Auto-slide functionality
        let slideInterval = setInterval(() => {
            const newIndex = (currentIndex + 1) % slideElements.length;
            goToSlide(newIndex);
        }, 5000);
        
        // Pause on hover
        slidesContainer.addEventListener('mouseenter', () => {
            clearInterval(slideInterval);
        });
        
        slidesContainer.addEventListener('mouseleave', () => {
            slideInterval = setInterval(() => {
                const newIndex = (currentIndex + 1) % slideElements.length;
                goToSlide(newIndex);
            }, 5000);
        });
        
    } catch (error) {
        console.error('Error loading highlights:', error);
        slidesContainer.innerHTML = `
            <div class="minimal-slide">
                <div class="minimal-slide-content">
                    <h3>Error loading highlights</h3>
                    <p>There was a problem loading the highlighted posts. Please refresh the page to try again.</p>
                </div>
                <div class="minimal-slide-image">
                    <!-- Placeholder image or leave empty -->
                </div>
            </div>
        `;
    }
}

// ===== POSTS & FILTERING FUNCTIONS =====

/**
 * Loads posts from JSON file or uses static fallback
 */
// Pagination and filtering variables
let currentPage = 1;
const postsPerPage = 12; // Adjust as needed
let allPosts = []; // All posts from JSON
let filteredPosts = []; // Posts after filtering
let currentFilter = 'all'; // Current active filter

// Load posts with pagination and filtering support
async function loadPosts() {
  try {
    // Fetch posts data once
    if (allPosts.length === 0) {
      const response = await fetch('/posts/posts.json');
      if (!response.ok) {
        throw new Error('Failed to load posts');
      }
      allPosts = await response.json();
      filteredPosts = [...allPosts]; // Initialize with all posts
    }

    // Display the current page
    displayPostsPage(currentPage);
    updatePaginationControls();
    
    // Initialize filter buttons
    initPostFiltering();
  } catch (error) {
    console.error('Error loading posts:', error);
    document.getElementById('posts-container').innerHTML = 
      '<p>Failed to load posts. Please try again later.</p>';
  }
}

// Display posts for the current page
function displayPostsPage(page) {
  const postsContainer = document.getElementById('posts-container');
  postsContainer.innerHTML = ''; // Clear current posts
  
  // Calculate which posts to show
  const startIndex = (page - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const postsToShow = filteredPosts.slice(startIndex, endIndex);
  
  if (postsToShow.length === 0) {
    postsContainer.innerHTML = '<p>No posts match the current filter.</p>';
    return;
  }
  
  // Create HTML for each post
  postsToShow.forEach(post => {
    const postHTML = `
      <div class="post-card" data-post="${post.tags[0]}">
        <div class="post-image">
          <img src="/posts/${post.folder}/thumbnail.png" alt="${post.title}">
        </div>
        <div class="post-content">
          <span class="post-type">${post.postType}</span>
          <h3 class="post-title">${post.title}</h3>
          <p class="post-date">${post.date}</p>
          <p class="post-excerpt">${post.excerpt}</p>
          <a href="/posts/${post.folder}/index.html" class="btn">Read More</a>
        </div>
      </div>
    `;
    
    postsContainer.innerHTML += postHTML;
  });
}

// Update pagination buttons and page numbers
function updatePaginationControls() {
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');
  const pageNumbers = document.getElementById('page-numbers');
  
  // Update buttons state
  prevButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage === totalPages || totalPages === 0;
  
  // Generate page numbers
  pageNumbers.innerHTML = '';
  
  if (totalPages === 0) {
    pageNumbers.innerHTML = '<span class="current-page">0</span>';
    return;
  }
  
  // Calculate range of page numbers to show
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  
  // Adjust if we're near the end
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }
  
  // Add first page link if needed
  if (startPage > 1) {
    pageNumbers.innerHTML += `<a href="#" data-page="1">1</a>`;
    if (startPage > 2) {
      pageNumbers.innerHTML += `<span>...</span>`;
    }
  }
  
  // Add page number links
  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      pageNumbers.innerHTML += `<span class="current-page">${i}</span>`;
    } else {
      pageNumbers.innerHTML += `<a href="#" data-page="${i}">${i}</a>`;
    }
  }
  
  // Add last page link if needed
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pageNumbers.innerHTML += `<span>...</span>`;
    }
    pageNumbers.innerHTML += `<a href="#" data-page="${totalPages}">${totalPages}</a>`;
  }
  
  // Add click event to page number links
  document.querySelectorAll('.page-numbers a').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      currentPage = parseInt(this.getAttribute('data-page'));
      displayPostsPage(currentPage);
      updatePaginationControls();
      // Scroll to top of posts section
      document.querySelector('.news-feed').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// Initialize post filtering
function initPostFiltering() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const filter = this.dataset.filter;
      
      // Toggle active class on buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Apply filtering
      currentFilter = filter;
      applyFilter(filter);
      
      // Reset to first page when changing filters
      currentPage = 1;
      displayPostsPage(currentPage);
      updatePaginationControls();
    });
  });
}

// Apply filter to posts
function applyFilter(filter) {
    if (filter === 'all') {
      filteredPosts = [...allPosts];
    } else {
      filteredPosts = allPosts.filter(post => 
        // Check if any tag matches the filter
        post.tags && post.tags.includes(filter)
      );
    }
  }

// Add event listeners for pagination and initialize
document.addEventListener('DOMContentLoaded', function() {
  // Load initial posts
  if (document.getElementById('posts-container')) {
    loadPosts();
  }
  
  // Previous page button
  const prevButton = document.getElementById('prev-page');
  if (prevButton) {
    prevButton.addEventListener('click', function() {
      if (currentPage > 1) {
        currentPage--;
        displayPostsPage(currentPage);
        updatePaginationControls();
        // Scroll to top of posts section
        document.querySelector('.news-feed').scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
  
  // Next page button
  const nextButton = document.getElementById('next-page');
  if (nextButton) {
    nextButton.addEventListener('click', function() {
      const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        displayPostsPage(currentPage);
        updatePaginationControls();
        // Scroll to top of posts section
        document.querySelector('.news-feed').scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Rest of your initialization code...
});
// ===== CONTACT FORM VALIDATION =====

/**
 * Initializes contact form validation
 */
function initContactFormValidation() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function(event) {
        let isValid = true;
        
        // Get form fields
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('message');
        
        // Clear previous error messages
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(el => el.remove());
        
        // Validate name (required)
        if (nameInput.value.trim() === '') {
            showError(nameInput, 'Name is required');
            isValid = false;
        }
        
        // Validate email (required and format)
        if (emailInput.value.trim() === '') {
            showError(emailInput, 'Email is required');
            isValid = false;
        } else if (!isValidEmail(emailInput.value)) {
            showError(emailInput, 'Please enter a valid email');
            isValid = false;
        }
        
        // Validate message (required)
        if (messageInput.value.trim() === '') {
            showError(messageInput, 'Message is required');
            isValid = false;
        }
        
        if (!isValid) {
            event.preventDefault();
        }
    });
    
    // Helper functions for form validation
    function showError(input, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = '#0091BE';
        errorDiv.style.fontSize = '0.8rem';
        errorDiv.style.marginTop = '5px';
        errorDiv.textContent = message;
        
        const parent = input.parentElement;
        parent.appendChild(errorDiv);
    }
    
    function isValidEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email.toLowerCase());
    }
}


async function loadSiteVariables() {
    try {
      // Fetch the variables.json file
      const response = await fetch('/variables.json');
      if (!response.ok) {
        throw new Error('Failed to load site variables');
      }
      
      const variables = await response.json();
      
      // Find all elements with data-variable attribute
      document.querySelectorAll('[data-variable]').forEach(element => {
        const variableName = element.getAttribute('data-variable');
        
        // Handle nested properties like "socialLinks.twitter"
        if (variableName.includes('.')) {
          const parts = variableName.split('.');
          let value = variables;
          for (const part of parts) {
            if (value && value[part] !== undefined) {
              value = value[part];
            } else {
              value = null;
              break;
            }
          }
          if (value !== null) {
            element.textContent = value;
          }
        } 
        // Handle simple properties
        else if (variables[variableName] !== undefined) {
          element.textContent = variables[variableName];
        }
      });
      
      // Handle link href attributes
      document.querySelectorAll('[data-variable-href]').forEach(element => {
        const variableName = element.getAttribute('data-variable-href');
        if (variableName.includes('.')) {
          const parts = variableName.split('.');
          let value = variables;
          for (const part of parts) {
            if (value && value[part] !== undefined) {
              value = value[part];
            } else {
              value = null;
              break;
            }
          }
          if (value !== null) {
            element.href = value;
          }
        } else if (variables[variableName] !== undefined) {
          element.href = variables[variableName];
        }
      });
      
    } catch (error) {
      console.error('Error loading site variables:', error);
    }
  }
  


  function loadMarkdownContent() {
    const postContent = document.querySelector('.post-content');
    if (!postContent) return;
    
    // Get the current path
    const currentPath = window.location.pathname;
    const postFolder = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
    
    // Fetch the markdown file
    fetch(postFolder + 'content.md')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load markdown content: ' + response.status);
        }
        return response.text();
      })
      .then(markdown => {
        // Process the markdown content to protect LaTeX
        let processedMarkdown = markdown
          // Replace display math with placeholders
          .replace(/\$\$([\s\S]*?)\$\$/g, function(match) {
            return '<!--MATH_DISPLAY:' + btoa(match) + '-->';
          })
          // Replace inline math with placeholders
          .replace(/\$([\s\S]*?)\$/g, function(match) {
            return '<!--MATH_INLINE:' + btoa(match) + '-->';
          });
        
        // Parse markdown with placeholders
        let html = marked.parse(processedMarkdown);
        
        // Restore LaTeX
        html = html
          .replace(/<!--MATH_DISPLAY:(.*?)-->/g, function(match, p1) {
            return atob(p1);
          })
          .replace(/<!--MATH_INLINE:(.*?)-->/g, function(match, p1) {
            return atob(p1);
          });
        
        // Update content
        postContent.innerHTML = html;
        
        // Force MathJax to process the page
        if (window.MathJax) {
          console.log("Processing equations with MathJax...");
          if (typeof MathJax.typeset === 'function') {
            MathJax.typeset();
          } else if (typeof MathJax.Hub !== 'undefined') {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
          }
          
          // Add a backup typesetting attempt after a delay
          setTimeout(() => {
            if (typeof MathJax.typeset === 'function') {
              MathJax.typeset();
            }
          }, 500);
        }
      })
      .catch(error => {
        console.error('Error loading markdown content:', error);
        postContent.innerHTML = '<p>Error loading content. Please try again later.</p>';
      });
  }