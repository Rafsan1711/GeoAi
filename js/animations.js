// animations.js - Animation Controller

class AnimationController {
    constructor() {
        this.particlesCreated = false;
    }

    /**
     * Initialize all animations
     */
    init() {
        this.createParticles();
        this.addButtonRipples();
        this.addSVGGradient();
        console.log('🎨 Animations initialized');
    }

    /**
     * Create floating particles
     */
    createParticles() {
        if (this.particlesCreated || !CONFIG.UI.ENABLE_ANIMATIONS) return;
        
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;

        const particleCount = CONFIG.UI.PARTICLE_COUNT;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const size = Math.random() * 4 + 2;
            const duration = Math.random() * 20 + 15;
            const delay = Math.random() * 5;

            particle.style.cssText = `
                position: absolute;
                left: ${x}%;
                top: ${y}%;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, rgba(99, 102, 241, 0.6), transparent);
                border-radius: 50%;
                animation: particleFloat ${duration}s ease-in-out infinite;
                animation-delay: ${delay}s;
                pointer-events: none;
            `;

            particlesContainer.appendChild(particle);
        }

        this.particlesCreated = true;
    }

    /**
     * Add ripple effect to buttons
     */
    addButtonRipples() {
        document.querySelectorAll('.btn, .answer-btn, .category-card').forEach(element => {
            element.addEventListener('click', (e) => {
                this.createRipple(element, e);
            });
        });
    }

    /**
     * Create ripple effect
     */
    createRipple(element, event) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.4);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
            z-index: 10;
        `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }

    /**
     * Create confetti effect
     */
    createConfetti() {
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
        const confettiCount = CONFIG.UI.CONFETTI_COUNT;

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const x = Math.random() * window.innerWidth;
            const duration = Math.random() * 3 + 2;
            const delay = Math.random() * 0.5;
            const rotation = Math.random() * 360;

            confetti.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: -20px;
                width: 10px;
                height: 10px;
                background: ${color};
                opacity: 0.9;
                animation: confettiFall ${duration}s linear ${delay}s forwards;
                pointer-events: none;
                z-index: 9999;
                transform: rotate(${rotation}deg);
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            `;

            document.body.appendChild(confetti);

            setTimeout(() => confetti.remove(), (duration + delay) * 1000);
        }
    }

    /**
     * Add SVG gradient for confidence circle
     */
    addSVGGradient() {
        const svgs = document.querySelectorAll('.confidence-circle-svg');
        
        svgs.forEach(svg => {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            gradient.setAttribute('id', 'gradient');
            gradient.setAttribute('x1', '0%');
            gradient.setAttribute('y1', '0%');
            gradient.setAttribute('x2', '100%');
            gradient.setAttribute('y2', '100%');

            const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop1.setAttribute('offset', '0%');
            stop1.setAttribute('stop-color', '#6366f1');

            const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop2.setAttribute('offset', '100%');
            stop2.setAttribute('stop-color', '#8b5cf6');

            gradient.appendChild(stop1);
            gradient.appendChild(stop2);
            defs.appendChild(gradient);
            svg.appendChild(defs);
        });
    }

    /**
     * Shake animation
     */
    shake(element) {
        element.classList.add('animate-shake');
        setTimeout(() => {
            element.classList.remove('animate-shake');
        }, 500);
    }

    /**
     * Pulse animation
     */
    pulse(element) {
        element.classList.add('animate-pulse');
        setTimeout(() => {
            element.classList.remove('animate-pulse');
        }, 1000);
    }

    /**
     * Number counting animation
     */
    animateNumber(element, start, end, duration = 1000) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.round(current);
        }, 16);
    }

    /**
     * Fade in animation
     */
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.transition = `opacity ${duration}ms`;
            element.style.opacity = '1';
        }, 10);
    }

    /**
     * Fade out animation
     */
    fadeOut(element, duration = 300) {
        element.style.transition = `opacity ${duration}ms`;
        element.style.opacity = '0';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, duration);
    }

    /**
     * Slide in from left
     */
    slideInLeft(element, duration = 500) {
        element.style.transform = 'translateX(-100%)';
        element.style.opacity = '0';
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.transition = `all ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
            element.style.transform = 'translateX(0)';
            element.style.opacity = '1';
        }, 10);
    }

    /**
     * Slide in from right
     */
    slideInRight(element, duration = 500) {
        element.style.transform = 'translateX(100%)';
        element.style.opacity = '0';
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.transition = `all ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
            element.style.transform = 'translateX(0)';
            element.style.opacity = '1';
        }, 10);
    }

    /**
     * Bounce animation
     */
    bounce(element) {
        element.classList.add('animate-bounce');
        setTimeout(() => {
            element.classList.remove('animate-bounce');
        }, 1000);
    }

    /**
     * Scale up animation
     */
    scaleUp(element, duration = 300) {
        element.style.transform = 'scale(0)';
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.transition = `transform ${duration}ms cubic-bezier(0.68, -0.55, 0.265, 1.55)`;
            element.style.transform = 'scale(1)';
        }, 10);
    }

    /**
     * Rotate animation
     */
    rotate(element, degrees = 360, duration = 500) {
        element.style.transition = `transform ${duration}ms ease-in-out`;
        element.style.transform = `rotate(${degrees}deg)`;
        
        setTimeout(() => {
            element.style.transform = 'rotate(0deg)';
        }, duration);
    }
}

// Create global animation controller instance
const animationController = new AnimationController();
