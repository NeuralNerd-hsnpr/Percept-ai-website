/* Shared behaviour: navigation, smooth scrolling, job accordion, footer year. */
(function () {
    'use strict';

    // --- Mobile navigation -------------------------------------------------
    var mobileMenu = document.getElementById('mobileMenu');
    var navLinks = document.getElementById('navLinks');

    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', function () {
            var open = navLinks.classList.toggle('active');
            mobileMenu.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navLinks.classList.remove('active');
                mobileMenu.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // --- Navbar shadow on scroll ------------------------------------------
    var navbar = document.getElementById('navbar');
    if (navbar) {
        var onScroll = function () {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    // --- Smooth scrolling for same-page anchors ---------------------------
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (event) {
            var id = this.getAttribute('href').slice(1);
            if (!id) { return; }
            var target = document.getElementById(id);
            if (target) {
                event.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.replaceState(null, '', '#' + id);
            }
        });
    });

    // --- Job accordion (careers page) -------------------------------------
    function toggleJob(header) {
        var card = header.parentElement;
        var content = card.querySelector('.job-content');
        var toggle = header.querySelector('.job-toggle');
        if (!content) { return; }

        document.querySelectorAll('.job-content.open').forEach(function (other) {
            if (other !== content) {
                other.classList.remove('open');
                var otherHeader = other.parentElement.querySelector('.job-header');
                var otherToggle = other.parentElement.querySelector('.job-toggle');
                if (otherHeader) { otherHeader.setAttribute('aria-expanded', 'false'); }
                if (otherToggle) { otherToggle.classList.remove('active'); }
            }
        });

        var open = content.classList.toggle('open');
        header.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (toggle) { toggle.classList.toggle('active', open); }
    }

    document.querySelectorAll('.job-header').forEach(function (header) {
        header.addEventListener('click', function () { toggleJob(header); });
        header.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleJob(header);
            }
        });
    });

    // --- Footer year -------------------------------------------------------
    document.querySelectorAll('[data-year]').forEach(function (el) {
        el.textContent = String(new Date().getFullYear());
    });
}());
