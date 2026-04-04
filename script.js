// Mobile Menu Toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');

if (mobileMenuToggle && navMenu) {
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
    const href = link.getAttribute('href') || '';

    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.substring(1);
      scrollToSection(targetId);
    }

    if (navMenu && navMenu.classList.contains('active')) {
      navMenu.classList.remove('active');
      mobileMenuToggle.classList.remove('active');
    }
  });
});

// Login
function showLogin() {
  window.location.href = '/login.html';
}

// Enroll
function showEnroll() {
  window.location.href = '/login.html';
}

// 3 live courses only
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

function showMockTests() {
  scrollToSection('courses');
}

function showFreeMaterials() {
  window.location.href = '/free-materials.html';
}

function showDashboard() {
  window.location.href = '/dashboard.html';
}

function toggleMoreNISM() {
  const additionalCourses = document.getElementById('additionalNISM');
  const showMoreBtn = document.getElementById('showMoreNISM');

  if (!additionalCourses || !showMoreBtn) return;

  if (additionalCourses.style.display === 'none') {
    additionalCourses.style.display = 'block';
    showMoreBtn.textContent = 'Show Less NISM Courses';
  } else {
    additionalCourses.style.display = 'none';
    showMoreBtn.textContent = 'Show All NISM Courses (16 Total)';
  }
}

function showChat() {
  const chatButton = document.getElementById('chatButton');
  if (chatButton) {
    chatButton.click();
  }
}

function showContact() {
  scrollToSection('contact');
}

// Contact Form Submission
const contactForm = document.getElementById('contactForm');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Thank you for contacting us!\n\nYour message has been received. Our team will get back to you within 24 hours.\n\nFor urgent queries, please call us at +91 1800-XXX-XXXX');
    contactForm.reset();
  });
}

// Navbar scroll effect
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
  if (!navbar) return;

  const currentScroll = window.pageYOffset;

  if (currentScroll > 100) {
    navbar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
  } else {
    navbar.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
  }
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

console.log('NISMSTUDY.COM - Website loaded successfully!');
