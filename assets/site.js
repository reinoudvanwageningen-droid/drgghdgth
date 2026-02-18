(() => {
  const nav = document.querySelector("nav");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const contactIntentStorageKey = "jvw_contact_intent";

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

  const setupContactIntentTracking = () => {
    const contactAnchors = document.querySelectorAll('a[href="#contact"], a[href="index.html#contact"]');
    if (!contactAnchors.length) {
      return;
    }

    contactAnchors.forEach((anchor) => {
      anchor.addEventListener("click", () => {
        const selectedIntent = anchor.getAttribute("data-contact-intent") || "contact";
        try {
          window.sessionStorage.setItem(contactIntentStorageKey, selectedIntent);
        } catch (error) {
          // Ignore storage issues in strict/private browser modes.
        }
      });
    });
  };

  const setupContactForm = () => {
    const contactForm = document.getElementById("contact-form");
    if (!contactForm) {
      return;
    }

    const requestTypeField = document.getElementById("contact-request-type");
    const statusElement = document.getElementById("contact-form-status");

    const requestTypeLabels = {
      offerte: "Vrijblijvende offerte aanvragen",
      contact: "Contact opnemen",
      advies: "Informatie of advies",
      terugbellen: "Terugbelverzoek",
    };

    const subjectLabels = {
      offerte: "Vrijblijvende offerteaanvraag via JVW website",
      contact: "Contactaanvraag via JVW website",
      advies: "Vraag om informatie of advies via JVW website",
      terugbellen: "Terugbelverzoek via JVW website",
    };

    const applyStoredIntent = () => {
      if (!requestTypeField || window.location.hash !== "#contact") {
        return;
      }

      let storedIntent = "";
      try {
        storedIntent = window.sessionStorage.getItem(contactIntentStorageKey) || "";
      } catch (error) {
        storedIntent = "";
      }

      if (!storedIntent) {
        return;
      }

      if (requestTypeLabels[storedIntent]) {
        requestTypeField.value = storedIntent;
      }
    };

    applyStoredIntent();
    window.addEventListener("hashchange", applyStoredIntent);

    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!contactForm.reportValidity()) {
        return;
      }

      const formData = new FormData(contactForm);
      const getValue = (name) => (formData.get(name) || "").toString().trim();

      const requestTypeValue = getValue("request_type");
      const requestTypeLabel = requestTypeLabels[requestTypeValue] || requestTypeValue || "-";
      const subject = subjectLabels[requestTypeValue] || "Aanvraag via JVW website";

      const bodyLines = [
        "Nieuwe aanvraag via jvwinfraservice.nl",
        "",
        `Onderwerp: ${requestTypeLabel}`,
        `Expertise: ${getValue("service") || "-"}`,
        `Naam: ${getValue("name") || "-"}`,
        `Bedrijfsnaam: ${getValue("company") || "-"}`,
        `E-mailadres: ${getValue("email") || "-"}`,
        `Telefoonnummer: ${getValue("phone") || "-"}`,
        `Type opdrachtgever: ${getValue("client_type") || "-"}`,
        `Voorkeur contact: ${getValue("contact_preference") || "-"}`,
        `Projectlocatie: ${getValue("project_location") || "-"}`,
        `Gewenste start: ${getValue("desired_start") || "-"}`,
        "",
        "Vraag / toelichting:",
        getValue("message") || "-",
      ];

      const mailtoAddress = contactForm.getAttribute("data-mail-to") || "info@jvwinfraservice.nl";
      const mailtoUrl = `mailto:${mailtoAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

      window.location.href = mailtoUrl;

      if (statusElement) {
        statusElement.classList.remove("hidden");
        statusElement.innerHTML =
          'Uw e-mailprogramma wordt geopend. Lukt dat niet? Mail direct naar <a href="mailto:info@jvwinfraservice.nl" class="underline hover:no-underline">info@jvwinfraservice.nl</a>.';
      }
    });
  };

  setupThemeListeners();
  setupMenuListeners();
  setupScrollColorReveal();
  setupContactIntentTracking();
  setupContactForm();
})();
