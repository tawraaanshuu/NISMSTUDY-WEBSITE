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

        if (navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        }
    });
});

function showLogin() {
    window.location.href = '/login.html';
}

function showEnroll() {
    window.location.href = '/login.html';
}

const LIVE_COURSE_SLUGS = new Set([
  'nism-series-i-currency-derivatives',
  'nism-series-v-a-mutual-fund-distributors',
  'nism-series-viii-equity-derivatives'
]);

function showCourseDetails(slug) {
  const realSlug = (window.COURSE_SLUG_MAP && window.COURSE_SLUG_MAP[slug]) || slug;

  if (LIVE_COURSE_SLUGS.size && !LIVE_COURSE_SLUGS.has(realSlug)) {
    alert('This course is coming soon.');
    return;
  }

  window.location.href = '/courses.html?slug=' + encodeURIComponent(realSlug);
}

function showMockTests() {
    scrollToSection('courses');
}

function showFreeMaterials() {
    window.location.href = '/free-materials.html';
}

function showDashboard() {
    window.location.href = '/login.html';
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

const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you for contacting us!\n\nYour message has been received. Our team will get back to you within 24 hours.\n\nFor urgent queries, please call us at +91 1800-XXX-XXXX');
        contactForm.reset();
    });
}

let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (navbar) {
        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        } else {
            navbar.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        }
    }

    lastScroll = currentScroll;
});

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

function formatPriceInr(price) {
    if (typeof price !== 'number') return 'Free';
    return `₹${price.toLocaleString('en-IN')}`;
}

function createCourseCard(course) {
    const badgeHtml = course.home_badge
        ? `<div class="course-badge">${course.home_badge}</div>`
        : '';

    const description = course.short_description || 'Course details available on the next page.';
    const price = formatPriceInr(course.price_inr);

    return `
        <div class="course-card">
            ${badgeHtml}
            <div class="course-icon">🎓</div>
            <h4>${course.title}</h4>
            <p>${description}</p>
            <div class="course-details">
                <div class="detail-row">
                    <span class="detail-label">Price:</span>
                    <span class="detail-value">${price}</span>
                </div>
            </div>
            <button class="btn btn-primary btn-block" onclick="showCourseDetails('${course.slug}')">View Details</button>
        </div>
    `;
}

function renderHomeCourses(courses) {
    const grid = document.getElementById('homePopularCoursesGrid');
    const state = document.getElementById('homeCoursesState');
    const footerLinks = document.getElementById('homePopularCourseLinks');

    if (!grid || !state || !footerLinks) return;

    if (!courses.length) {
        state.textContent = 'No popular courses are configured right now.';
        grid.innerHTML = '';
        footerLinks.innerHTML = '<li><a href="#courses">Courses</a></li>';
        return;
    }

    state.textContent = '';
    grid.innerHTML = courses.map(createCourseCard).join('');
    footerLinks.innerHTML = courses.slice(0, 5).map((course) => (
        `<li><a href="/course-detail.html?slug=${encodeURIComponent(course.slug)}">${course.title}</a></li>`
    )).join('');
}

function renderSupportTeasers(items) {
    const list = document.getElementById('homeSupportTeaserList');
    if (!list) return;

    if (!items.length) {
        list.innerHTML = '<li><a href="#contact">Contact Us</a></li>';
        return;
    }

    list.innerHTML = items.map((item) => (
        `<li><a href="${item.href}">${item.label}</a></li>`
    )).join('');
}

async function initHomeSupabaseContent() {
    const coursesGrid = document.getElementById('homePopularCoursesGrid');
    if (!coursesGrid) return;

    if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
        const state = document.getElementById('homeCoursesState');
        if (state) state.textContent = 'Supabase configuration is missing for home content.';
        renderSupportTeasers([]);
        return;
    }

    const { createClient } = window.supabase;
    const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

    try {
        const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('id, slug, title, short_description, price_inr, home_badge, home_order, status, show_on_home')
            .eq('status', 'published')
            .eq('show_on_home', true)
            .order('home_order', { ascending: true })
            .limit(6);

        if (coursesError) throw coursesError;
        renderHomeCourses(courses || []);
    } catch (error) {
        const state = document.getElementById('homeCoursesState');
        if (state) state.textContent = 'Could not load popular courses right now.';
        console.warn('Home popular courses load failed:', error.message);
    }

    try {
        const { data: supportItems, error: supportError } = await supabase
            .from('home_support_links')
            .select('label, href, sort_order, is_active')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .limit(8);

        if (supportError) throw supportError;
        renderSupportTeasers(supportItems || []);
    } catch (error) {
        renderSupportTeasers([]);
        console.warn('Home support teaser load failed:', error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.feature-card, .course-card, .testimonial-card, .mock-feature, .portal-card');

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    initHomeSupabaseContent();
});

window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

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

document.querySelectorAll('.course-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px) scale(1.02)';
    });

    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

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

setInterval(rotateTestimonials, 5000);

console.log('NISMSTUDY.COM - Home page loaded successfully');
