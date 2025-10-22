// Create and append preloader
const preloader = document.createElement('div');
preloader.className = 'preloader';
document.body.appendChild(preloader);

// Handle preloader
window.addEventListener('load', () => {
    preloader.classList.add('hidden');
    setTimeout(() => {
        preloader.remove();
    }, 500);
});

// Mobile and Platform Detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isAndroid = /Android/i.test(navigator.userAgent);
const isChrome = /Chrome/i.test(navigator.userAgent);

// Android Chrome Specific Fixes
if (isAndroid && isChrome) {
    // Optimize touch feedback
    document.querySelectorAll('.touch-target').forEach(element => {
        element.addEventListener('touchstart', e => {
            e.currentTarget.style.transition = 'background-color 0.2s';
            e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary-rgb), 0.1)';
        }, { passive: true });

        element.addEventListener('touchend', e => {
            e.currentTarget.style.backgroundColor = '';
            setTimeout(() => {
                e.currentTarget.style.transition = '';
            }, 200);
        }, { passive: true });
    });

    // Fix Chrome mobile viewport issues
    const setViewportHeight = () => {
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    window.addEventListener('resize', setViewportHeight);
    setViewportHeight();
}

// iOS Safari Fixes
if (isIOS) {
    // Prevent double-tap zoom on buttons and links
    document.addEventListener('touchend', (e) => {
        if (e.target.tagName.toLowerCase() === 'button' ||
            e.target.tagName.toLowerCase() === 'a') {
            e.preventDefault();
            if (e.target.click) {
                e.target.click();
            }
        }
    }, { passive: false });

    // Fix iOS scroll issues
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.body.style.webkitOverflowScrolling = 'touch';

    // Fix iOS input focus issues
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            document.body.style.position = 'fixed';
            input.style.position = 'absolute';
        });
        input.addEventListener('blur', () => {
            document.body.style.position = '';
            input.style.position = '';
            window.scrollTo(0, 0);
        });
    });

    // Fix iOS scroll to top on orientation change
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 300);
    });
}

// Touch Gesture Handler
class TouchGestureHandler {
        constructor(element, options = {}) {
            this.element = element;
            this.options = {
                swipeThreshold: 50,
                timeThreshold: 300,
                pinchThreshold: 0.1,
                rotateThreshold: 15,
                longPressThreshold: 500,
                ...options
            };
            
            this.touches = [];
            this.pinchStartDistance = 0;
            this.initialAngle = 0;
            this.longPressTimer = null;
            
            this.touchStartX = 0;
            this.touchStartY = 0;
            this.touchEndX = 0;
            this.touchEndY = 0;
            this.touchStartTime = 0;
            
            this.onTouchStart = this.onTouchStart.bind(this);
            this.onTouchMove = this.onTouchMove.bind(this);
            this.onTouchEnd = this.onTouchEnd.bind(this);
            
            this.init();
        }
        
        init() {
            this.element.addEventListener('touchstart', this.onTouchStart, { passive: true });
            this.element.addEventListener('touchmove', this.onTouchMove, { passive: false });
            this.element.addEventListener('touchend', this.onTouchEnd, { passive: true });
        }
        
        onTouchStart(e) {
            this.touches = Array.from(e.touches);
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.touchStartTime = Date.now();
            
            if (e.touches.length === 2) {
                // Initialize pinch/zoom
                this.pinchStartDistance = this.getPinchDistance(e.touches);
                this.initialAngle = this.getRotationAngle(e.touches);
            } else if (e.touches.length === 1) {
                // Start long press timer
                this.longPressTimer = setTimeout(() => {
                    const event = new CustomEvent('longpress', {
                        detail: {
                            x: this.touchStartX,
                            y: this.touchStartY
                        }
                    });
                    this.element.dispatchEvent(event);
                    this.element.classList.add('long-press-active');
                }, this.options.longPressThreshold);
            }
            
            // Add active state for touch feedback
            if (e.target.classList.contains('touch-target')) {
                e.target.classList.add('touch-active');
                // Add ripple effect
                this.createRippleEffect(e);
            }
        }
        
        getPinchDistance(touches) {
            return Math.hypot(
                touches[1].clientX - touches[0].clientX,
                touches[1].clientY - touches[0].clientY
            );
        }
        
        getRotationAngle(touches) {
            return Math.atan2(
                touches[1].clientY - touches[0].clientY,
                touches[1].clientX - touches[0].clientX
            ) * 180 / Math.PI;
        }
        
        createRippleEffect(e) {
            const target = e.target;
            const rect = target.getBoundingClientRect();
            const ripple = document.createElement('span');
            const diameter = Math.max(rect.width, rect.height);
            const radius = diameter / 2;
            
            ripple.style.width = ripple.style.height = `${diameter}px`;
            ripple.style.left = `${e.touches[0].clientX - rect.left - radius}px`;
            ripple.style.top = `${e.touches[0].clientY - rect.top - radius}px`;
            ripple.className = 'ripple';
            
            target.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 1000);
        }
        
        onTouchMove(e) {
            // Clear long press timer if movement occurs
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }

            if (e.touches.length === 2) {
                // Handle pinch/zoom
                const currentDistance = this.getPinchDistance(e.touches);
                const scale = currentDistance / this.pinchStartDistance;
                
                if (Math.abs(1 - scale) > this.options.pinchThreshold) {
                    const event = new CustomEvent('pinch', {
                        detail: {
                            scale,
                            center: {
                                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                                y: (e.touches[0].clientY + e.touches[1].clientY) / 2
                            }
                        }
                    });
                    this.element.dispatchEvent(event);
                }
                
                // Handle rotation
                const currentAngle = this.getRotationAngle(e.touches);
                const rotation = currentAngle - this.initialAngle;
                
                if (Math.abs(rotation) > this.options.rotateThreshold) {
                    const event = new CustomEvent('rotate', {
                        detail: {
                            rotation,
                            center: {
                                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                                y: (e.touches[0].clientY + e.touches[1].clientY) / 2
                            }
                        }
                    });
                    this.element.dispatchEvent(event);
                }
            } else if (e.touches.length === 1) {
                const deltaX = this.touchStartX - e.touches[0].clientX;
                const deltaY = this.touchStartY - e.touches[0].clientY;
                
                // Emit drag event
                const event = new CustomEvent('drag', {
                    detail: {
                        deltaX,
                        deltaY,
                        x: e.touches[0].clientX,
                        y: e.touches[0].clientY
                    }
                });
                this.element.dispatchEvent(event);
                
                // Prevent vertical scroll if horizontal swipe is detected
                if (Math.abs(deltaX) > Math.abs(deltaY) && e.cancelable) {
                    e.preventDefault();
                }
            }
        }
        
        onTouchEnd(e) {
            this.touchEndX = e.changedTouches[0].clientX;
            this.touchEndY = e.changedTouches[0].clientY;
            
            // Remove active state
            document.querySelectorAll('.touch-active').forEach(el => {
                el.classList.remove('touch-active');
            });
            
            this.handleGesture();
        }
        
        handleGesture() {
            if (!this.touchEndX || !this.touchEndY) return;
            
            const deltaX = this.touchEndX - this.touchStartX;
            const deltaY = this.touchEndY - this.touchStartY;
            const deltaTime = Date.now() - this.touchStartTime;
            
            // iOS-specific gesture handling
            if (isIOS) {
                // Adjust thresholds for iOS sensitivity
                const iosSwipeThreshold = this.options.swipeThreshold * 0.8;
                const iosPinchThreshold = this.options.pinchThreshold * 1.2;
                
                // Handle iOS-specific gesture states
                if (deltaTime <= this.options.timeThreshold) {
                    // Quick tap handling for iOS
                    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
                        const event = new CustomEvent('tap', {
                            detail: {
                                x: this.touchEndX,
                                y: this.touchEndY
                            }
                        });
                        this.element.dispatchEvent(event);
                    }
                    
                    // iOS swipe handling with adjusted threshold
                    if (Math.abs(deltaX) >= iosSwipeThreshold) {
                        const event = new CustomEvent('swipe', {
                            detail: {
                                direction: deltaX > 0 ? 'right' : 'left',
                                deltaX,
                                deltaY,
                                deltaTime,
                                isIOS: true
                            }
                        });
                        this.element.dispatchEvent(event);
                    }
                }
            } else {
            
            // Check if it's a swipe
            if (deltaTime <= this.options.timeThreshold) {
                if (Math.abs(deltaX) >= this.options.swipeThreshold) {
                    const event = new CustomEvent('swipe', {
                        detail: {
                            direction: deltaX > 0 ? 'right' : 'left',
                            deltaX,
                            deltaY,
                            deltaTime
                        }
                    });
                    this.element.dispatchEvent(event);
                }
                
                if (Math.abs(deltaY) >= this.options.swipeThreshold) {
                    const event = new CustomEvent('swipe', {
                        detail: {
                            direction: deltaY > 0 ? 'down' : 'up',
                            deltaX,
                            deltaY,
                            deltaTime
                        }
                    });
                    this.element.dispatchEvent(event);
                }
            }
        }
    }
}

// Initialize event listeners and touch handler
document.addEventListener('DOMContentLoaded', function() {
    // Create touch handler instance
    var gestureHandler = new TouchGestureHandler(document.body);
    // Add touch gesture support to specific components
        // Add touch classes to interactive elements
        const touchTargets = document.querySelectorAll('.btn, .nav-link, .card, input[type="submit"]');
        touchTargets.forEach(target => {
            target.classList.add('touch-target');
        });

        // Add swipe support to carousel/slider elements
        const swipeableElements = document.querySelectorAll('.carousel, .slider');
        swipeableElements.forEach(element => {
            element.classList.add('swipeable');
            
            // Check if element has overflow
            const checkOverflow = () => {
                if (element.scrollWidth > element.clientWidth) {
                    element.classList.add('has-overflow');
                } else {
                    element.classList.remove('has-overflow');
                }
            };
            
            // Check on load and resize
            checkOverflow();
            window.addEventListener('resize', checkOverflow);
            
            // Handle swipe events
            element.addEventListener('swipe', (e) => {
                const { direction, deltaX } = e.detail;
                if (direction === 'left' || direction === 'right') {
                    element.scrollBy({
                        left: -deltaX,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Add pull-to-refresh functionality
        let pullStartY = 0;
        let pullMoveY = 0;
        const pullThreshold = 60;
        const pullIndicator = document.createElement('div');
        pullIndicator.className = 'pull-to-refresh';
        document.body.prepend(pullIndicator);

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                pullStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (pullStartY > 0) {
                pullMoveY = e.touches[0].clientY - pullStartY;
                if (pullMoveY > 0) {
                    pullIndicator.style.transform = `translateY(${Math.min(pullMoveY, pullThreshold)}px)`;
                    if (pullMoveY >= pullThreshold) {
                        pullIndicator.classList.add('ready');
                    } else {
                        pullIndicator.classList.remove('ready');
                    }
                }
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            if (pullMoveY >= pullThreshold) {
                // Trigger refresh
                window.location.reload();
            }
            pullStartY = 0;
            pullMoveY = 0;
            pullIndicator.style.transform = '';
            pullIndicator.classList.remove('ready');
        }, { passive: true });
    });
    
    // Prevent zoom on double tap for iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const header = document.querySelector('.header');
    
    // Create and append back-to-top button
    const backToTop = document.createElement('a');
    backToTop.href = '#';
    backToTop.className = 'back-to-top';
    backToTop.setAttribute('aria-label', 'Scroll to top');
    backToTop.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    document.body.appendChild(backToTop);

    // Show/hide back-to-top button
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    // Smooth scroll to top
    backToTop.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Toggle menu
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        // Prevent body scroll when menu is open
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!header.contains(e.target) && navMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Close menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
    }));

    // Page transitions
    const pageElements = document.querySelectorAll('.page-transition');
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    pageElements.forEach(element => {
        observer.observe(element);
    });

    // Lazy loading images
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    lazyImages.forEach(img => {
        img.classList.add('lazy-image');
        img.addEventListener('load', () => {
            img.classList.add('loaded');
        });
    });

    // Add ARIA labels to interactive elements
    document.querySelectorAll('button:not([aria-label])').forEach(button => {
        if (button.textContent.trim()) {
            button.setAttribute('aria-label', button.textContent.trim());
        }
    });

    // Focus trap for modals and menus
    const trapFocus = (element) => {
        const focusableElements = element.querySelectorAll(
            'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        lastFocusable.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        firstFocusable.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    };

    // Apply focus trap to mobile menu when active
    const mobileMenu = document.querySelector('.nav-menu');
    if (mobileMenu) {
        trapFocus(mobileMenu);
    }
;