// Mobile Menu Toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });
}

// Smooth Scrolling
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Handle nav link clicks
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        scrollToSection(targetId);
        
        // Close mobile menu if open
        if (navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        }
    });
});

// Show Login Modal - Redirects to login page
function showLogin() {
    window.location.href = '/login.html';
}

// Show Enrollment Modal - Redirects to login page (for new users to register)
function showEnroll() {
    window.location.href = '/login.html';
}

// Show Course Details - Redirects to course detail page
const LIVE_COURSE_SLUGS = new Set([
  'nism-series-i-currency-derivatives',
  'nism-series-v-a-mutual-fund-distributors',
  'nism-series-viii-equity-derivatives'
]);

function showCourseDetails(slug) {
  const realSlug = (window.COURSE_SLUG_MAP && window.COURSE_SLUG_MAP[slug]) || slug;

  if (!LIVE_COURSE_SLUGS.has(realSlug)) {
    alert('This course is coming soon.');
    return;
  }

  window.location.href = '/course-detail.html?slug=' + encodeURIComponent(realSlug);
}

// Show Mock Tests - Redirects to quiz interface
function showMockTests() {
    scrollToSection('courses');
}
// Show Free Materials
function showFreeMaterials() {
    window.location.href = '/free-materials.html';
}

// Show Dashboard
function showDashboard() {
    window.location.href = '/dashboard.html';
}

// Admin Panel - Hidden from public interface
// Access directly via: /admin.html (for authorized users only)

// Show More NISM Courses
function toggleMoreNISM() {
    const additionalCourses = document.getElementById('additionalNISM');
    const showMoreBtn = document.getElementById('showMoreNISM');
    
    if (additionalCourses.style.display === 'none') {
        additionalCourses.style.display = 'block';
        showMoreBtn.textContent = 'Show Less NISM Courses';
    } else {
        additionalCourses.style.display = 'none';
        showMoreBtn.textContent = 'Show All NISM Courses (16 Total)';
    }
}

// Show Chat - Opens the chatbot widget
function showChat() {
    // Toggle the chat widget
    const chatButton = document.getElementById('chatButton');
    if (chatButton) {
        chatButton.click();
    }
}

// Show Contact
function showContact() {
    scrollToSection('contact');
}

// Contact Form Submission
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form values
        const formData = new FormData(contactForm);
        
        // Show success message
        alert('Thank you for contacting us!\n\nYour message has been received. Our team will get back to you within 24 hours.\n\nFor urgent queries, please call us at +91 1800-XXX-XXXX');
        
        // Reset form
        contactForm.reset();
    });
}

// Navbar scroll effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    } else {
        navbar.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    }
    
    lastScroll = currentScroll;
});

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.feature-card, .course-card, .testimonial-card, .mock-feature');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Stats counter animation
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start);
        }
    }, 16);
}

// Trigger counter animation when stats section is visible
const statsSection = document.querySelector('.hero-stats');
if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumbers = entry.target.querySelectorAll('.stat-number');
                statNumbers.forEach(stat => {
                    const text = stat.textContent;
                    const number = parseInt(text.replace(/\D/g, ''));
                    const suffix = text.replace(/[0-9]/g, '');
                    
                    if (number) {
                        let counter = 0;
                        const interval = setInterval(() => {
                            counter += Math.ceil(number / 50);
                            if (counter >= number) {
                                stat.textContent = number + suffix;
                                clearInterval(interval);
                            } else {
                                stat.textContent = counter + suffix;
                            }
                        }, 30);
                    }
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    statsObserver.observe(statsSection);
}

// Course filter functionality (for future enhancement)
function filterCourses(category) {
    const courseCategories = document.querySelectorAll('.course-category');
    
    if (category === 'all') {
        courseCategories.forEach(cat => cat.style.display = 'block');
    } else {
        courseCategories.forEach(cat => {
            const title = cat.querySelector('.category-title').textContent.toLowerCase();
            if (title.includes(category.toLowerCase())) {
                cat.style.display = 'block';
            } else {
                cat.style.display = 'none';
            }
        });
    }
}

// Add hover effect to course cards
document.querySelectorAll('.course-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Testimonial carousel functionality (basic implementation)
let currentTestimonialIndex = 0;

function rotateTestimonials() {
    const testimonials = document.querySelectorAll('.testimonial-card');
    if (testimonials.length > 0) {
        testimonials.forEach((testimonial, index) => {
            if (index === currentTestimonialIndex) {
                testimonial.style.border = '2px solid var(--primary-color)';
                testimonial.style.transform = 'scale(1.05)';
            } else {
                testimonial.style.border = '2px solid var(--border-color)';
                testimonial.style.transform = 'scale(1)';
            }
        });
        
        currentTestimonialIndex = (currentTestimonialIndex + 1) % testimonials.length;
    }
}

// Rotate testimonials every 5 seconds
setInterval(rotateTestimonials, 5000);

// Success rate chart animation
const successChart = document.querySelector('.success-chart');
if (successChart) {
    const chartObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const chartValues = entry.target.querySelectorAll('.chart-value');
                chartValues.forEach(value => {
                    const height = value.style.height;
                    value.style.height = '0';
                    setTimeout(() => {
                        value.style.transition = 'height 1.5s ease-out';
                        value.style.height = height;
                    }, 100);
                });
                chartObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    chartObserver.observe(successChart);
}

console.log('NISMSTUDY.COM - Website loaded successfully!');
console.log('© 2025 NISMSTUDY.COM - Your path to financial certification success');


