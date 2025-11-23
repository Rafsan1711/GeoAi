// animations.js - Visual effects and animations

class Animations {
    constructor() {
        this.particlesCreated = false;
    }

    /**
     * Create floating particles in background
     */
    createParticles() {
        if (this.particlesCreated) return;
        
        const particlesContainer = document.getElementById('particles');
        const particleCount = 30;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random position
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
                background: radial-gradient(circle, rgba(59, 130, 246, 0.6), transparent);
                border-radius: 50%;
                animation: float ${duration}s ease-in-out infinite;
                animation-delay: ${delay}s;
                pointer-events: none;
            `;

            particlesContainer.appendChild(particle);
        }

        // Add float animation if not exists
        if (!document.getElementById('particle-float-style')) {
            const style = document.createElement('style');
            style.id = 'particle-float-style';
            style.textContent = `
                @keyframes float {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                        opacity: 0.3;
                    }
                    25% {
                        transform: translate(20px, -20px) scale(1.2);
                        opacity: 0.6;
                    }
                    50% {
                        transform: translate(-20px, -40px) scale(0.8);
                        opacity: 0.4;
                    }
                    75% {
                        transform: translate(10px, -20px) scale(1.1);
                        opacity: 0.5;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        this.particlesCreated = true;
    }

    /**
     * Add ripple effect on button click
     */
    addRippleEffect(element, event) {
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
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }

    /**
     * Shake animation for incorrect guess (optional feature)
     */
    shake(element) {
        element.style.animation = 'shake 0.5s';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }

    /**
     * Fade transition between screens
     */
    fadeTransition(fromElement, toElement, duration = 300) {
        fromElement.style.transition = `opacity ${duration}ms`;
        fromElement.style.opacity = '0';

        setTimeout(() => {
            fromElement.classList.remove('active');
            fromElement.style.opacity = '1';
            
            toElement.classList.add('active');
            toElement.style.opacity = '0';
            
            setTimeout(() => {
                toElement.style.transition = `opacity ${duration}ms`;
                toElement.style.opacity = '1';
            }, 50);
        }, duration);
    }

    /**
     * Pulse animation for important elements
     */
    pulse(element, duration = 1000) {
        element.style.animation = `pulse ${duration}ms`;
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    }

    /**
     * Typewriter effect for text
     */
    typewriter(element, text, speed = 50) {
        element.textContent = '';
        let i = 0;

        const type = () => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        };

        type();
    }

    /**
     * Confetti effect for correct guess
     */
    createConfetti() {
        const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe', '#10b981', '#f59e0b'];
        const confettiCount = 50;

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const x = Math.random() * window.innerWidth;
            const duration = Math.random() * 3 + 2;
            const delay = Math.random() * 0.5;

            confetti.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: -10px;
                width: 10px;
                height: 10px;
                background: ${color};
                opacity: 0.8;
                animation: fall ${duration}s linear ${delay}s forwards;
                pointer-events: none;
                z-index: 9999;
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            `;

            document.body.appendChild(confetti);

            setTimeout(() => confetti.remove(), (duration + delay) * 1000);
        }

        // Add fall animation
        if (!document.getElementById('confetti-fall-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-fall-style';
            style.textContent = `
                @keyframes fall {
                    to {
                        transform: translateY(100vh) rotate(360deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Glow effect on hover
     */
    addGlowEffect(element) {
        element.addEventListener('mouseenter', () => {
            element.style.filter = 'brightness(1.2)';
            element.style.transition = 'filter 0.3s';
        });

        element.addEventListener('mouseleave', () => {
            element.style.filter = 'brightness(1)';
        });
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
     * Add shake keyframes if not exists
     */
    addShakeKeyframes() {
        if (!document.getElementById('shake-keyframes')) {
            const style = document.createElement('style');
            style.id = 'shake-keyframes';
            style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
                    20%, 40%, 60%, 80% { transform: translateX(10px); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Initialize all animations
     */
    init() {
        this.createParticles();
        this.addShakeKeyframes();

        // Add ripple to all buttons
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.addRippleEffect(button, e);
            });
        });

        // Add glow to category cards
        document.querySelectorAll('.category-card').forEach(card => {
            this.addGlowEffect(card);
        });

        // Add ripple style
        if (!document.getElementById('ripple-style')) {
            const style = document.createElement('style');
            style.id = 'ripple-style';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Create global animations instance
const animations = new Animations();