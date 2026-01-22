// Wait for GSAP to load
document.addEventListener("DOMContentLoaded", () => {
    if (typeof gsap === 'undefined') {
        console.warn("GSAP not loaded");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // 1. Custom Cursor Logic
    const cursor = document.querySelector('.cursor');
    if (cursor) {
        document.addEventListener('mousemove', (e) => {
            gsap.to(cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.1,
                ease: "power2.out"
            });
        });
    }

    // 2. Hero Animation (Load sequence)
    const tl = gsap.timeline();

    tl.from('header h1', {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power4.out",
        delay: 0.5
    })
        .from('.code-badge', {
            y: -20,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
        }, "-=0.8")
        .from('.hero-sub', {
            y: 20,
            opacity: 0,
            duration: 0.8
        }, "-=0.6")
        .from('.scroll-indicator', {
            opacity: 0,
            duration: 1
        }, "-=0.4");


    // 3. Scroll Animations for Sections
    const sections = document.querySelectorAll('section');

    sections.forEach(section => {
        gsap.from(section.children, {
            scrollTrigger: {
                trigger: section,
                start: "top 80%", // When top of section hits 80% of viewport height
                end: "top 50%",
                toggleActions: "play none none reverse"
            },
            y: 50,
            opacity: 0,
            duration: 1,
            stagger: 0.2, // Animate children one by one
            ease: "power3.out"
        });
    });


});
