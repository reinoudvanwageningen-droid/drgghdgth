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

  const setupExpertiseGalleries = () => {
    const galleryFrames = document.querySelectorAll("[data-photo-rotator-frame]");
    if (!galleryFrames.length) {
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

    const galleryStates = [];

    const closeAllGalleries = (exceptFrame = null) => {
      galleryStates.forEach(({ frame, setOpenState }) => {
        if (frame !== exceptFrame) {
          setOpenState(false);
        }
      });
    };

    galleryFrames.forEach((frame, frameIndex) => {
      const mainImage = frame.querySelector("[data-photo-rotator]");
      const toggleButton = frame.querySelector("[data-gallery-toggle]");
      const thumbnailStrip = frame.querySelector("[data-gallery-strip]");
      const counter = frame.querySelector("[data-photo-rotator-counter]");

      if (!mainImage || !toggleButton || !thumbnailStrip) {
        return;
      }

      const photos = parseJsonArray(mainImage.dataset.photos).filter(Boolean);
      if (!photos.length) {
        return;
      }

      const alts = parseJsonArray(mainImage.dataset.photoAlts);
      let currentIndex = 0;

      const thumbnailStripId = `expertise-gallery-strip-${frameIndex + 1}`;
      thumbnailStrip.id = thumbnailStripId;
      toggleButton.setAttribute("aria-controls", thumbnailStripId);

      const updateCounter = () => {
        if (!counter) return;
        counter.textContent = `${currentIndex + 1}/${photos.length}`;
      };

      const updateActiveThumbnails = () => {
        const thumbs = thumbnailStrip.querySelectorAll("[data-gallery-thumb]");
        thumbs.forEach((thumb, thumbIndex) => {
          const isActive = thumbIndex === currentIndex;
          thumb.classList.toggle("is-active", isActive);
          thumb.setAttribute("aria-pressed", String(isActive));
        });
      };

      const setCurrentPhoto = (nextIndex) => {
        if (nextIndex < 0 || nextIndex >= photos.length || nextIndex === currentIndex) {
          return;
        }

        mainImage.classList.add("is-fading");
        window.setTimeout(() => {
          mainImage.src = photos[nextIndex];
          if (alts[nextIndex]) {
            mainImage.alt = alts[nextIndex];
          }
          mainImage.classList.remove("is-fading");
        }, 130);

        currentIndex = nextIndex;
        updateCounter();
        updateActiveThumbnails();
      };

      thumbnailStrip.innerHTML = "";
      photos.forEach((photoSrc, photoIndex) => {
        const thumbButton = document.createElement("button");
        thumbButton.type = "button";
        thumbButton.className = "expertise-gallery-thumb";
        thumbButton.dataset.galleryThumb = String(photoIndex);
        thumbButton.setAttribute("aria-label", `Toon foto ${photoIndex + 1} van ${photos.length}`);

        const thumbImage = document.createElement("img");
        thumbImage.src = photoSrc;
        thumbImage.alt = alts[photoIndex] || `Detailfoto ${photoIndex + 1}`;
        thumbImage.loading = "lazy";
        thumbImage.decoding = "async";
        thumbImage.className = "expertise-gallery-thumb-image";
        thumbButton.appendChild(thumbImage);

        thumbButton.addEventListener("click", () => {
          setCurrentPhoto(photoIndex);
        });

        thumbnailStrip.appendChild(thumbButton);
      });

      const setOpenState = (isOpen) => {
        thumbnailStrip.classList.toggle("hidden", !isOpen);
        toggleButton.setAttribute("aria-expanded", String(isOpen));
        toggleButton.textContent = isOpen ? "Sluit foto's" : "Bekijk foto's";
      };

      if (mainImage.getAttribute("src") !== photos[0]) {
        mainImage.setAttribute("src", photos[0]);
      }
      if (alts[0]) {
        mainImage.setAttribute("alt", alts[0]);
      }

      if (photos.length <= 1) {
        toggleButton.classList.add("hidden");
      } else {
        toggleButton.addEventListener("click", () => {
          const shouldOpen = thumbnailStrip.classList.contains("hidden");
          closeAllGalleries(shouldOpen ? frame : null);
          setOpenState(shouldOpen);
        });
      }

      updateCounter();
      updateActiveThumbnails();
      setOpenState(false);

      galleryStates.push({ frame, setOpenState });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeAllGalleries();
      }
    });
  };

  setupThemeListeners();
  setupMenuListeners();
  setupScrollColorReveal();
  setupContactForm();
  setupExpertiseGalleries();
})();
