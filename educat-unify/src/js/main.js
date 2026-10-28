/*
Template Name: educatunify
File Name: main.js
Author Name: ThemeVault
Author URI: https://www.themevault.net/
Version: 2.0

Dependency-free. Bootstrap's own bundle drives the navbar, tabs, carousel,
accordion and scrollspy; everything below replaces what jQuery and its plugins
used to do.
*/
(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Back to top — fades in past 100px, returns to the top */
    var toTop = document.getElementById("back-to-top");
    if (toTop) {
        var toggleToTop = function () { toTop.classList.toggle("is-visible", window.scrollY > 100); };
        toggleToTop();
        window.addEventListener("scroll", toggleToTop, { passive: true });
        toTop.addEventListener("click", function (e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        });
    }

    /* BS3 marked the active tab on the <li>; BS5 marks the <a>. Templates key CSS on li.active (flowerspetal, wrap-d-style) — keep both in step */
    /* BS3's tab plugin worked from any trigger; BS5's needs a .nav / .list-group / [role=tablist] ancestor or it silently does nothing
       (homeapart: eight grid columns switch the portfolio panes). Give such triggers their nearest .row as the tablist. */
    document.querySelectorAll('[data-bs-toggle="tab"], [data-bs-toggle="pill"]').forEach(function (t) {
        if (t.closest('.nav, .list-group, [role="tablist"]')) return;
        var host = t.closest(".row") || t.parentElement.parentElement; if (host && !host.getAttribute("role")) host.setAttribute("role", "tablist");
    });
    /* BS5's scrollspy marks the <a>.active and colours it at (0,3,0) — above a template's ".navbar-default .navbar-nav > li > a" (0,2,2), so
       the spied item went grey (homeapart's "About" on the tablet). BS3 marked the <li>; do the same and take the class off the <a>. */
    document.addEventListener("activate.bs.scrollspy", function (e) {
        var a = e.relatedTarget; if (!a || !a.closest) return;
        var ul = a.closest(".navbar-nav, .nav, ul"); if (ul) ul.querySelectorAll("li.active").forEach(function (li) { li.classList.remove("active"); });
        var li = a.closest("li"); if (li) li.classList.add("active");
        a.classList.remove("active");
    });
    document.addEventListener("shown.bs.tab", function (e) { var a = e.target, ul = a.closest('.nav, [role="tablist"]'); if (!ul) return; ul.querySelectorAll("li").forEach(function (li) { li.classList.remove("active"); }); ul.querySelectorAll("[data-bs-toggle]").forEach(function (t) { if (t !== a) t.classList.remove("active"); }); var li = a.closest("li"); if (li) li.classList.add("active"); });
    /* BS3 marked an open dropdown's parent with .open; BS5 uses .show. Templates
       key CSS on .open (wrap-d-style slides its cart panel in on it) — mirror it. */
    document.addEventListener("shown.bs.dropdown", function (e) { var p = e.target.closest(".dropdown, .btn-group, .dropup") || e.target.parentElement; if (p) p.classList.add("open"); });
    document.addEventListener("hidden.bs.dropdown", function (e) { var p = e.target.closest(".dropdown, .btn-group, .dropup") || e.target.parentElement; if (p) p.classList.remove("open"); });

    /* Tapping a link in the collapsed menu closes it. The dropdown-toggle
       exclusion matters: without it, adding a submenu later makes the whole
       menu retract the moment it is tapped. */
    var collapse = document.querySelector(".navbar-collapse");
    if (collapse) {
        collapse.addEventListener("click", function (e) {
            /* any destination: a .dropdown-item or a bare submenu <a href> too, never an href-less submenu opener */
            var link = e.target.closest("a[href]");
            if (!link || link.classList.contains("dropdown-toggle") || link.getAttribute("href") === "#") return;
            if (!collapse.classList.contains("show")) return;
            var inst = window.bootstrap && bootstrap.Collapse.getInstance(collapse);
            if (inst) inst.hide();
        });
    }

    /* Counters — replaces counterUp + waypoints. The real number stays in the
       markup until the moment it animates, so anyone without JS still sees it. */
    var counters = document.querySelectorAll(".counter");
    if (counters.length) {
        var runCounter = function (el) {
            var target = parseInt(String(el.dataset.target || el.textContent).replace(/\D/g, ""), 10);
            if (!isFinite(target)) return;
            if (reduceMotion) { el.textContent = String(target); return; }
            el.textContent = "0";
            var started = null;
            var step = function (now) {
                if (started === null) started = now;
                var progress = Math.min((now - started) / 1000, 1);
                el.textContent = String(Math.floor(progress * target));
                if (progress < 1) requestAnimationFrame(step); else el.textContent = String(target);
            };
            requestAnimationFrame(step);
        };
        if ("IntersectionObserver" in window) {
            var io = new IntersectionObserver(function (entries, obs) {
                entries.forEach(function (en) { if (en.isIntersecting) { runCounter(en.target); obs.unobserve(en.target); } });
            }, { threshold: 0.4 });
            counters.forEach(function (c) { c.dataset.target = c.textContent.trim(); io.observe(c); });
        } else counters.forEach(runCounter);
    }
    /* ------------------------------------------------------------------
       Carousels — replaces Owl Carousel (and jQuery with it). Shared block
       from web/scripts/upgrade-qa2/lib/js/carousel.js.

       Config travels on data-owl, lifted from v1's inline $.owlCarousel()
       call, e.g. data-owl='{"items":1,"dots":true,"loop":true,"autoplay":4000}':
         items / responsive   how many show at each MIN width ({"0":1,"768":2})
         nav, dots            arrows (navHtml for custom markup) / pager
         loop                 wrap around — with CLONES, as Owl does
         speed                transition in ms (Owl's 250 default)
         autoplay             interval in ms, or falsy for none
       The plugin's STYLESHEET (owl.carousel.css / owl.theme.default.css) is
       kept verbatim because it IS the slider's design — Owl built the
       stage/item DOM at runtime; this builds the same DOM.
       ------------------------------------------------------------------ */
    document.querySelectorAll("[data-owl]").forEach(function (root) {
        var cfg;
        try { cfg = JSON.parse(root.getAttribute("data-owl")); } catch (e) { return; }
        var slides = Array.prototype.filter.call(root.children, function (c) { return c.nodeType === 1; });
        if (!slides.length) return;
        var speed = reduceMotion ? 0 : (cfg.speed || 250);
        var loop = !!cfg.loop && slides.length > 1;

        var stage = document.createElement("div");
        stage.className = "owl-stage";
        var outer = document.createElement("div");
        outer.className = "owl-stage-outer";
        outer.appendChild(stage);

        var wrap = function (el, cloned) {
            /* a template that hand-wrote <div class="owl-item"> around each slide (wrap-d-style's thumbnails) is not wrapped twice */
            if (el.classList && el.classList.contains("owl-item")) { if (cloned) { el.classList.add("cloned"); el.setAttribute("aria-hidden", "true"); } return el; }
            var item = document.createElement("div");
            item.className = "owl-item" + (cloned ? " cloned" : "");
            if (cloned) item.setAttribute("aria-hidden", "true");
            item.appendChild(el);
            return item;
        };
        if (loop) slides.forEach(function (el) { stage.appendChild(wrap(el.cloneNode(true), true)); });
        slides.forEach(function (el) { stage.appendChild(wrap(el, false)); });
        if (loop) slides.forEach(function (el) { stage.appendChild(wrap(el.cloneNode(true), true)); });

        root.textContent = "";
        root.appendChild(outer);
        root.classList.add("owl-loaded", "owl-drag");

        var items = Array.prototype.slice.call(stage.children);
        var count = slides.length;
        var index = loop ? count : 0;
        var timer = null, animating = false;

        var nav = document.createElement("div"), navBtn = {};
        nav.className = "owl-nav" + (cfg.nav ? "" : " disabled");
        /* Owl 2 rendered the arrows as <div class="owl-prev"> (a template's CSS
           keys on `.owl-nav > div`, wrap-d-style on `div.owl2-prev`) and let
           navClass / navText rename and fill them. Same here: a <div
           role=button> when the template's CSS wants a div, its own class
           names, its own text — a11y kept with tabindex + Enter/Space. */
        ["prev", "next"].forEach(function (dir, i) {
            var b = document.createElement(cfg.navTag || "div");
            if (b.tagName === "BUTTON") b.type = "button"; else { b.setAttribute("role", "button"); b.tabIndex = 0; }
            b.className = (cfg.navClass && cfg.navClass[i]) || "owl-" + dir;
            b.setAttribute("aria-label", dir === "prev" ? "Previous slide" : "Next slide");
            var text = cfg.navText && cfg.navText[i];
            b.innerHTML = (cfg.navHtml && cfg.navHtml[dir]) || (typeof text === "string" ? text : '<i class="fas fa-angle-' + (dir === "prev" ? "left" : "right") + '" aria-hidden="true"></i>');
            var fire = function () { go(dir === "next" ? 1 : -1); restartAutoplay(); };
            b.addEventListener("click", function () { fire(); if (b.tagName !== "BUTTON") b.blur(); }); /* a focusable div keeps a template's :focus (hover) look after a mouse click — v1's divs were not focusable */
            b.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fire(); } });
            nav.appendChild(b); navBtn[dir] = b;
        });
        root.appendChild(nav);

        var dots = document.createElement("div");
        dots.className = (cfg.dotsClass || "owl-dots") + (cfg.dots ? "" : " disabled");
        if (cfg.dots) root.appendChild(dots); /* Owl built no pager at dots:false; a custom dotsClass would otherwise miss owl.theme's .owl-dots.disabled and show two stray dashes (wrap-d-style) */

        var perView = function () {
            var w = window.innerWidth, n = cfg.items || 1;
            Object.keys(cfg.responsive || {})
                .map(Number).sort(function (a, b) { return a - b; })
                .forEach(function (bp) { if (w >= bp) n = cfg.responsive[bp]; });
            return Math.max(1, Math.min(n, count));
        };
        var itemWidth = function () {
            var n = perView(), gap = cfg.margin || 0;
            return (root.clientWidth - gap * (n - 1)) / n;
        };
        var step = function () { return loop ? 1 : perView(); };
        var lastIndex = function () { return loop ? items.length - 1 : Math.max(0, count - perView()); };

        var setTransform = function (withTransition) {
            var gap = cfg.margin || 0;
            stage.style.transition = withTransition && speed ? "transform " + speed + "ms ease" : "none";
            stage.style.transform = "translateX(" + (-index * (itemWidth() + gap)) + "px)";
            var real = loop ? ((index - count) % count + count) % count : index;
            Array.prototype.forEach.call(dots.children, function (d, i) {
                d.classList.toggle("active", i === Math.floor(real / step()));
            });
            items.forEach(function (it, i) { it.classList.toggle("active", i >= index && i < index + perView()); });
            /* Owl marked the arrow that can go no further .disabled (owl.carousel.css fades it); a template's own CSS keys on it too */
            if (!loop) { if (navBtn.prev) navBtn.prev.classList.toggle("disabled", index <= 0); if (navBtn.next) navBtn.next.classList.toggle("disabled", index >= lastIndex()); }
        };

        var guard = null;
        var go = function (d) {
            if (animating) return;
            var target = index + d * step();
            if (!loop) target = Math.max(0, Math.min(lastIndex(), target));
            if (target === index) return;
            index = target;
            animating = speed > 0;
            setTransform(true);
            if (!animating) { settleLoop(); return; }
            clearTimeout(guard);
            guard = setTimeout(settleLoop, speed + 100);
        };
        var settleLoop = function () {
            clearTimeout(guard);
            animating = false;
            if (!loop) return;
            if (index >= 2 * count) { index -= count; setTransform(false); }
            else if (index < count) { index += count; setTransform(false); }
        };
        stage.addEventListener("transitionend", function (e) { if (e.target === stage) settleLoop(); });

        var layout = function () {
            if (!root.clientWidth) return;
            var width = itemWidth(), gap = cfg.margin || 0;
            items.forEach(function (it) {
                it.style.width = width + "px";
                it.style.marginRight = gap + "px";
            });
            stage.style.width = (width + gap) * items.length + "px";
            if (!loop && index > lastIndex()) index = lastIndex();
            nav.classList.toggle("disabled", !cfg.nav || count <= perView());
            dots.textContent = "";
            var pages = Math.max(1, Math.ceil(count / step()));
            for (var i = 0; i < pages; i++) {
                (function (i) {
                    var d = document.createElement("button");
                    d.type = "button";
                    d.className = cfg.dotClass || "owl-dot";
                    d.setAttribute("aria-label", "Go to slide " + (i + 1));
                    d.appendChild(document.createElement("span"));
                    d.addEventListener("click", function () { index = (loop ? count : 0) + i * step(); setTransform(true); restartAutoplay(); });
                    dots.appendChild(d);
                })(i);
            }
            setTransform(false);
        };

        var restartAutoplay = function () {
            if (!cfg.autoplay || reduceMotion) return;
            clearInterval(timer);
            timer = setInterval(function () { go(1); }, cfg.autoplay);
        };
        root.addEventListener("mouseenter", function () { clearInterval(timer); });
        root.addEventListener("mouseleave", restartAutoplay);
        restartAutoplay();

        var startX = null;
        var onDown = function (x) { startX = x; };
        var onUp = function (x) {
            if (startX === null) return;
            var dx = x - startX;
            startX = null;
            if (Math.abs(dx) < 40) return;
            go(dx < 0 ? 1 : -1);
            restartAutoplay();
        };
        root.addEventListener("touchstart", function (e) { onDown(e.touches[0].clientX); }, { passive: true });
        root.addEventListener("touchend", function (e) { onUp(e.changedTouches[0].clientX); }, { passive: true });

        layout();
        if ("ResizeObserver" in window) {
            var lastW = root.clientWidth;
            new ResizeObserver(function () {
                if (root.clientWidth === lastW) return;
                lastW = root.clientWidth;
                layout();
            }).observe(root);
        } else {
            var t;
            window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(layout, 150); }, { passive: true });
        }
    });

    /* Scroll reveal — replaces wow.js / the inline scroll_animate: any
       [data-reveal] (or v1's .anim / .wow) gets .on / .animated once it is a
       quarter of the viewport in. Reduced-motion users get it immediately. */
    var reveal = document.querySelectorAll("[data-reveal], .anim, .wow");
    if (reveal.length) {
        var mark = function (el) { el.classList.add("on"); el.classList.add("animated"); el.classList.add("is-visible"); };
        if (reduceMotion || !("IntersectionObserver" in window)) { reveal.forEach(mark); }
        else {
            var ro = new IntersectionObserver(function (entries) { entries.forEach(function (e) { if (e.isIntersecting) { mark(e.target); ro.unobserve(e.target); } }); }, { rootMargin: "0px 0px -25% 0px" });
            reveal.forEach(function (el) { ro.observe(el); });
        }
    }

    /* A static template posts nowhere, so rather than pretend, validate and
       say so plainly. */
    var form = document.querySelector("form.tv-contact-form"); /* form. — a template's own wrapper <div class="tv-contact-form"> (cunsultix contact.html) is not a form */
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (!form.checkValidity()) { form.classList.add("was-validated"); return; }
            var note = form.querySelector(".tv-form-note");
            if (note) { note.hidden = false; note.focus(); }
            form.reset(); form.classList.remove("was-validated");
        });
    }
})();

/* Footer year */
(function () { var y = document.getElementById("tv-year"); if (y) y.textContent = String(new Date().getFullYear()); })();

/* No transitions on first paint, and no :hover-driven menus until the visitor moves: a browser can paint the new page with the cursor
   already resting on a nav item, so a hover-opened mega menu or cart panel shows for a moment and then animates shut
   (wrap-d-style, owner note 16). tv-preload drops transitions; tv-nohover keeps hover menus closed until the first real input. */
(function () {
    var body = document.body; body.classList.add("tv-nohover");
    var go = function () { requestAnimationFrame(function () { body.classList.remove("tv-preload"); }); };
    if (document.readyState === "complete") go(); else window.addEventListener("load", go);
    var release = function () { body.classList.remove("tv-nohover"); ["mousemove", "touchstart", "keydown", "wheel"].forEach(function (t) { window.removeEventListener(t, release); }); };
    ["mousemove", "touchstart", "keydown", "wheel"].forEach(function (t) { window.addEventListener(t, release, { passive: true }); });
})();

/* ED-DESIGN START */
/* Educatunify 2.0 — design behaviours. Every one starts from a data attribute or a class, so a band can be absent,
   repeated or injected later. Replaces v1's js/script.js handlers and the inline blocks after its footer. */
(function () {
    var desk = window.matchMedia("(min-width: 1200px)");

    /* Band photos: style="--photo:url(images/x.jpg)" resolves against css/ in Chrome, so make it absolute and only then
       let the CSS use it (.has-photo) */
    document.querySelectorAll("[style*='--photo']").forEach(function (el) {
        var m = /--photo:\s*url\(["']?([^"')]+)["']?\)/.exec(el.getAttribute("style"));
        if (!m) return;
        el.style.setProperty("--photo", 'url("' + new URL(m[1], document.baseURI).href + '")');
        el.classList.add("has-photo");
    });

    /* Sticky header: v1 added a class to .navbar-default once the page scrolled; the header shrinks and gains a shadow */
    document.querySelectorAll("[data-sticky]").forEach(function (h) {
        var on = function () { h.classList.toggle("is-stuck", window.scrollY > 40); };
        on(); window.addEventListener("scroll", on, { passive: true });
    });

    /* Header search: v1's .search icon opened the search box; Esc or a second tap closes it */
    document.querySelectorAll(".search[aria-controls]").forEach(function (btn) {
        var box = document.getElementById(btn.getAttribute("aria-controls"));
        if (!box) return;
        var set = function (open) {
            box.hidden = !open; btn.setAttribute("aria-expanded", open ? "true" : "false");
            if (open) { var q = box.querySelector("input"); if (q) q.focus(); }
        };
        btn.addEventListener("click", function () { set(box.hidden); });
        box.addEventListener("keydown", function (e) { if (e.key === "Escape") { set(false); btn.focus(); } });
    });

    /* v1 opened .dropdown menus on hover. On a desktop pointer the same, through Bootstrap so clicks and keys stay in step */
    if (window.bootstrap && window.matchMedia("(hover: hover)").matches) {
        document.querySelectorAll(".ed-menu .dropdown").forEach(function (li) {
            var t = li.querySelector('[data-bs-toggle="dropdown"]');
            if (!t) return;
            var dd = bootstrap.Dropdown.getOrCreateInstance(t), timer;
            li.addEventListener("mouseenter", function () { if (!desk.matches) return; clearTimeout(timer); dd.show(); });
            li.addEventListener("mouseleave", function () { if (!desk.matches) return; timer = setTimeout(function () { dd.hide(); }, 120); });
        });
    }

    /* Countdown: v1's inline initializeClock('clockdiv', now + 15 days). data-countdown = days from the first visit,
       remembered so a reload does not restart it; an ISO date works too */
    document.querySelectorAll("[data-countdown]").forEach(function (box) {
        var v = box.getAttribute("data-countdown"), end;
        if (/^\d+$/.test(v)) {
            var key = "ed-countdown-" + (box.id || "x");
            try { end = parseInt(localStorage.getItem(key), 10); } catch (e) {}
            if (!end || end < Date.now()) { end = Date.now() + parseInt(v, 10) * 864e5; try { localStorage.setItem(key, String(end)); } catch (e) {} }
        } else end = Date.parse(v);
        var put = function (cls, n) { var el = box.querySelector("." + cls); if (el) el.textContent = n < 10 ? "0" + n : String(n); };
        var tick = function () {
            var t = Math.max(0, end - Date.now()), d = Math.floor(t / 864e5);
            put("months", Math.floor(d / 30)); put("days", d % 30);
            put("hours", Math.floor(t / 36e5) % 24); put("minutes", Math.floor(t / 6e4) % 60); put("seconds", Math.floor(t / 1e3) % 60);
            if (t > 0) setTimeout(tick, 1000);
        };
        tick();
    });

    /* Forms: a static template posts nowhere, so each named form validates, says what would happen next, and resets.
       The message names the email the real site sends (email-*.html in this folder). */
    var SAID = {
        newsletter: "Thanks, you are on the list. A welcome email is on its way.",
        register: "Thanks for registering. Your login and start date will arrive by email within one working day.",
        contact: "Thanks, your message has been sent. We reply within one working day.",
        apply: "Application received. We have emailed you a reference number and will reply within ten working days.",
        event: "Your seat is booked. A confirmation with the venue and time has been emailed to you.",
        enquiry: "Thanks for your enquiry. The course leader will email you within two working days.",
        comment: "Thanks, your comment has been sent. It will appear here once a moderator has approved it."
    };
    document.querySelectorAll("form[data-ed-form]").forEach(function (form) {
        var note = form.querySelector(".tv-form-note");
        var clear = function (e) { if (e.target.classList) e.target.classList.remove("is-invalid"); };
        form.addEventListener("input", clear); form.addEventListener("change", clear);
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var bad = [].filter.call(form.elements, function (f) { return f.willValidate && !f.checkValidity(); });
            [].forEach.call(form.elements, function (f) { if (f.classList) f.classList.toggle("is-invalid", bad.indexOf(f) > -1); });
            if (bad.length) { if (note) { note.textContent = "Please check the highlighted field" + (bad.length > 1 ? "s" : "") + "."; note.classList.add("is-error"); } bad[0].focus(); return; }
            if (note) { note.textContent = SAID[form.getAttribute("data-ed-form")] || "Thanks, that has been sent."; note.classList.remove("is-error"); }
            form.reset();
        });
    });

    /* Campus map (Wayfinding view): pointing at a place lights its pin, and a pin lights its place */
    document.querySelectorAll("[data-campus-map]").forEach(function (map) {
        var band = map.closest("section") || document;
        var light = function (key, on) {
            map.querySelectorAll("[data-pin]").forEach(function (p) { p.classList.toggle("is-lit", on && p.getAttribute("data-pin") === key); });
            band.querySelectorAll(".ed-place[data-key]").forEach(function (p) { p.classList.toggle("is-lit", on && p.getAttribute("data-key") === key); });
        };
        band.querySelectorAll(".ed-place[data-key], [data-pin]").forEach(function (el) {
            var key = el.getAttribute("data-key") || el.getAttribute("data-pin");
            ["mouseenter", "focusin"].forEach(function (t) { el.addEventListener(t, function () { light(key, true); }); });
            ["mouseleave", "focusout"].forEach(function (t) { el.addEventListener(t, function () { light(key, false); }); });
        });
    });
})();
/* ED-DESIGN END */
