(() => {
  const nav = document.querySelector("nav");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const updateNavBackground = (scrolled) => {
    if (!nav) return;

    nav.classList.remove(
      "shadow-soft",
      "bg-white/80",
      "bg-white/95",
      "dark:bg-slate-950/85",
      "dark:bg-slate-950/95"
    );

    if (scrolled) {
      nav.classList.add("shadow-soft", "bg-white/95", "dark:bg-slate-950/95");
    } else {
      nav.classList.add("bg-white/80", "dark:bg-slate-950/85");
    }
  };

  const applySystemTheme = () => {
    const isDark = systemThemeQuery.matches;
    document.documentElement.classList.toggle("dark", isDark);
    updateNavBackground(window.scrollY > 20);
  };

  const setMobileMenuOpen = (isOpen) => {
    if (!mobileMenu || !mobileMenuButton) return;
    mobileMenu.classList.toggle("hidden", !isOpen);
    mobileMenuButton.setAttribute("aria-expanded", String(isOpen));
    mobileMenuButton.setAttribute("aria-label", isOpen ? "Sluit menu" : "Open menu");
    document.body.classList.toggle("overflow-hidden", isOpen);
  };

  window.toggleMobileMenu = function toggleMobileMenu() {
    if (!mobileMenu) return;
    const isOpen = !mobileMenu.classList.contains("hidden");
    setMobileMenuOpen(!isOpen);
  };

  const setupThemeListeners = () => {
    applySystemTheme();

    if (typeof systemThemeQuery.addEventListener === "function") {
      systemThemeQuery.addEventListener("change", applySystemTheme);
    } else if (typeof systemThemeQuery.addListener === "function") {
      systemThemeQuery.addListener(applySystemTheme);
    }

    window.addEventListener("scroll", () => {
      updateNavBackground(window.scrollY > 20);
    });
  };

  const setupMenuListeners = () => {
    if (!mobileMenu || !mobileMenuButton) return;

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !mobileMenu.classList.contains("hidden")) {
        setMobileMenuOpen(false);
      }
    });

    document.addEventListener("click", (event) => {
      if (mobileMenu.classList.contains("hidden")) {
        return;
      }
      if (!mobileMenu.contains(event.target) && !mobileMenuButton.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    });

    setMobileMenuOpen(false);
  };

  const setupScrollColorReveal = () => {
    const scrollColorImages = document.querySelectorAll("[data-scroll-color-reveal]");
    if (!scrollColorImages.length) {
      return;
    }

    if ("IntersectionObserver" in window) {
      const colorRevealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }
            entry.target.classList.remove("grayscale");
            entry.target.classList.add("grayscale-0");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.35 }
      );

      scrollColorImages.forEach((image) => {
        colorRevealObserver.observe(image);
      });
    } else {
      scrollColorImages.forEach((image) => {
        image.classList.remove("grayscale");
        image.classList.add("grayscale-0");
      });
    }
  };

  const setupContactForm = () => {
    const contactForm = document.getElementById("contact-form");
    if (!contactForm) {
      return;
    }

    const statusElement = document.getElementById("contact-form-status");
    const subjectInput = document.getElementById("contact-form-subject");
    const nextInput = document.getElementById("contact-form-next");

    const intentLabels = {
      offerte: "Vrijblijvende offerte aanvragen",
      contact: "Contact opnemen",
    };

    const subjectLabels = {
      offerte: "Vrijblijvende offerteaanvraag via JVW website",
      contact: "Contactaanvraag via JVW website",
    };

    const searchParams = new URLSearchParams(window.location.search);
    const requestedIntent = searchParams.get("intent") || "contact";
    const normalizedIntent = intentLabels[requestedIntent] ? requestedIntent : "contact";
    const showSuccessMessage = searchParams.get("sent") === "1";

    if (showSuccessMessage && statusElement) {
      statusElement.classList.remove("hidden");
      statusElement.innerHTML =
        'Bedankt! Uw bericht is verzonden. Wij nemen zo snel mogelijk contact op. Geen bevestiging ontvangen? Mail direct naar <a href="mailto:info@jvwinfraservice.nl" class="underline hover:no-underline">info@jvwinfraservice.nl</a>.';
    }

    contactForm.addEventListener("submit", (event) => {
      if (!contactForm.reportValidity()) {
        event.preventDefault();
        return;
      }

      const subject = subjectLabels[normalizedIntent] || "Contact via JVW website";
      if (subjectInput) {
        subjectInput.value = subject;
      }

      if (nextInput) {
        const redirectUrl = new URL(window.location.href);
        redirectUrl.searchParams.set("sent", "1");
        redirectUrl.searchParams.delete("intent");
        nextInput.value = redirectUrl.toString();
      }

      if (statusElement) {
        statusElement.classList.remove("hidden");
        statusElement.textContent = `${intentLabels[normalizedIntent]}: bericht wordt verzonden...`;
      }
    });
  };

  const setupPhotoRotators = () => {
    const rotatorImages = document.querySelectorAll("[data-photo-rotator]");
    if (!rotatorImages.length) {
      return;
    }

    const parseJsonArray = (value) => {
      if (!value) return [];
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    rotatorImages.forEach((image, imageIndex) => {
      const photos = parseJsonArray(image.dataset.photos).filter(Boolean);
      if (photos.length <= 1) {
        return;
      }

      const alts = parseJsonArray(image.dataset.photoAlts);
      const intervalMs = Math.max(Number(image.dataset.photoInterval) || 5000, 2500);
      let currentIndex = 0;

      const preloadNext = (nextIndex) => {
        const nextSrc = photos[nextIndex];
        if (!nextSrc) return;
        const preloadImage = new Image();
        preloadImage.src = nextSrc;
      };

      preloadNext(1);

      window.setInterval(() => {
        const nextIndex = (currentIndex + 1) % photos.length;
        image.classList.add("is-fading");

        window.setTimeout(() => {
          image.src = photos[nextIndex];
          if (alts[nextIndex]) {
            image.alt = alts[nextIndex];
          }
          image.classList.remove("is-fading");
          currentIndex = nextIndex;
          preloadNext((nextIndex + 1) % photos.length);
        }, 180);
      }, intervalMs + imageIndex * 150);
    });
  };

  setupThemeListeners();
  setupMenuListeners();
  setupScrollColorReveal();
  setupContactForm();
  setupPhotoRotators();
})();
