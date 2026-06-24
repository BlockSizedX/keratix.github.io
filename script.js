(function () {
  "use strict";

  /* ---------------------------------------------------------
     Theme toggle (persists via localStorage)
  --------------------------------------------------------- */
  var root = document.documentElement;
  var themeToggle = document.getElementById("themeToggle");
  var STORAGE_KEY = "keratix-theme";

  function applyTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
      if (themeToggle) themeToggle.setAttribute("aria-pressed", "true");
    } else {
      root.removeAttribute("data-theme");
      if (themeToggle) themeToggle.setAttribute("aria-pressed", "false");
    }
  }

  function getPreferredTheme() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "dark" || saved === "light") return saved;
    } catch (e) {
      /* localStorage unavailable — fall back silently */
    }
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  }

  applyTheme(getPreferredTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var isDark = root.getAttribute("data-theme") === "dark";
      var next = isDark ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {
        /* ignore storage errors */
      }
    });
  }

  /* ---------------------------------------------------------
     Nav: solid background after scroll + mobile menu
  --------------------------------------------------------- */
  var nav = document.getElementById("nav");
  var navLinks = document.getElementById("navLinks");
  var navBurger = document.getElementById("navBurger");

  function onScrollNav() {
    if (window.scrollY > 12) {
      nav.classList.add("is-scrolled");
    } else {
      nav.classList.remove("is-scrolled");
    }
  }
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  if (navBurger && navLinks) {
    navBurger.addEventListener("click", function () {
      var isOpen = navLinks.classList.toggle("is-open");
      navBurger.setAttribute("aria-expanded", isOpen ? "true" : "false");
      navBurger.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });

    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("is-open");
        navBurger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------------------------------------------------
     Scroll reveal for sections + cards
  --------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------------------------------------------------------
     Draw the "strand" line through the process steps
     once that section enters view
  --------------------------------------------------------- */
  var steps = document.querySelector(".steps");
  if (steps && "IntersectionObserver" in window) {
    var stepsObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            steps.classList.add("is-drawn");
            stepsObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    stepsObserver.observe(steps);
  } else if (steps) {
    steps.classList.add("is-drawn");
  }

  /* ---------------------------------------------------------
     Cartoon hair strands: gentle scroll-linked parallax
     (idle sway handled purely by CSS keyframes)
  --------------------------------------------------------- */
  var hairStrands = document.querySelectorAll(".hstrand");
  var hero = document.getElementById("hero");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ticking = false;

  function updateParallax() {
    ticking = false;
    if (!hero) return;
    var rect = hero.getBoundingClientRect();
    var heroHeight = rect.height || window.innerHeight;
    // Progress through the hero: 0 at top of viewport, 1 once scrolled past
    var progress = Math.min(Math.max(-rect.top / heroHeight, 0), 1);

    hairStrands.forEach(function (strand, i) {
      var speed = 30 + i * 18; // depth — different strands drift at different rates
      var offset = progress * speed;
      strand.style.transform = "translateY(" + offset.toFixed(1) + "px)";
    });
  }

  function requestParallaxUpdate() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateParallax);
    }
  }

  if (hairStrands.length && !reduceMotion) {
    window.addEventListener("scroll", requestParallaxUpdate, { passive: true });
    window.addEventListener("resize", requestParallaxUpdate);
    updateParallax();
  }

  /* ---------------------------------------------------------
     Contact form — front-end only, no backend wired up
  --------------------------------------------------------- */
  var form = document.getElementById("contactForm");
  var status = document.getElementById("formStatus");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("name");
      var email = document.getElementById("email");
      var message = document.getElementById("message");

      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        status.textContent = "Please fill in every field before sending.";
        status.style.color = "#C8973C";
        return;
      }

      status.textContent = "Thanks, " + name.value.trim().split(" ")[0] + " — we'll be in touch shortly.";
      status.style.color = "";
      form.reset();
    });
  }

  /* ---------------------------------------------------------
     Our Team — load + render cards from members.json
  --------------------------------------------------------- */
  var teamGrid = document.getElementById("teamGrid");
  if (teamGrid) {
    fetch("members.json")
      .then(function (res) {
        if (!res.ok) throw new Error("members.json not found");
        return res.json();
      })
      .then(function (members) {
        teamGrid.innerHTML = members
          .map(function (m) {
            return (
              '<article class="team-card reveal is-visible">' +
              '<img class="team-card__img" src="' + m.image + '" alt="' + m.name + '">' +
              '<h3 class="team-card__name">' + m.name + '</h3>' +
              '<span class="team-card__role">' + m.position + '</span>' +
              '<a class="team-card__phone" href="tel:' + m.phone + '">' + m.phone + '</a>' +
              '</article>'
            );
          })
          .join("");
      })
      .catch(function () {
        teamGrid.innerHTML = '<p class="team-grid__loading">Couldn\'t load team data.</p>';
      });
  }
})();
