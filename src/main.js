const menuButton = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector("#mobile-menu");
const siteHeader = document.querySelector(".site-header");

const heroSection = document.querySelector(".hero");

if (heroSection) {
  const heroTargets = [...heroSection.querySelectorAll(".hero-reveal")];
  const heroActions = heroSection.querySelector(".hero-actions");
  const motionPreference = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  let heroObserver = null;
  let heroRevealFrame = 0;

  function revealHeroImmediately() {
    heroTargets.forEach((target) => {
      target.classList.add("is-revealed");
    });

    heroSection.classList.remove("hero-reveal-ready");
    heroSection.classList.add("hero-reveal-skip-motion");
    heroObserver?.disconnect();

    if (heroRevealFrame) {
      cancelAnimationFrame(heroRevealFrame);
      heroRevealFrame = 0;
    }
  }

  function heroIsInViewport() {
    const bounds = heroSection.getBoundingClientRect();
    return bounds.bottom > 0 && bounds.top < window.innerHeight;
  }

  function startHeroReveal() {
    const hasOtherAnchor =
      window.location.hash && window.location.hash !== "#home";

    if (
      motionPreference.matches ||
      !("IntersectionObserver" in window) ||
      !heroIsInViewport() ||
      hasOtherAnchor
    ) {
      revealHeroImmediately();
      return;
    }

    try {
      heroObserver = new IntersectionObserver(
        (entries) => {
          if (heroSection.classList.contains("hero-reveal-skip-motion")) {
            return;
          }

          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add("is-revealed");
            heroObserver.unobserve(entry.target);
          });

          if (
            heroTargets.every((target) =>
              target.classList.contains("is-revealed"),
            )
          ) {
            heroObserver.disconnect();
          }
        },
        { threshold: 0 },
      );

      heroSection.classList.add("hero-reveal-ready");
      heroTargets.forEach((target) => window.getComputedStyle(target).opacity);

      // Let the hidden starting styles reach a paint before observing targets.
      heroRevealFrame = requestAnimationFrame(() => {
        heroRevealFrame = 0;

        if (
          motionPreference.matches ||
          !heroIsInViewport() ||
          (window.location.hash && window.location.hash !== "#home")
        ) {
          revealHeroImmediately();
          return;
        }

        heroTargets.forEach((target) => heroObserver.observe(target));
      });
    } catch {
      revealHeroImmediately();
    }
  }

  heroActions?.addEventListener("focusin", revealHeroImmediately);

  window.addEventListener("hashchange", () => {
    if (window.location.hash !== "#home") {
      revealHeroImmediately();
    }
  });

  window.addEventListener("pageshow", () => {
    if (
      !heroIsInViewport() ||
      (window.location.hash && window.location.hash !== "#home")
    ) {
      revealHeroImmediately();
    }
  });

  motionPreference.addEventListener("change", (event) => {
    if (event.matches) {
      revealHeroImmediately();
    }
  });

  startHeroReveal();
}

if (siteHeader) {
  const updateHeaderState = () => {
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 40);
  };

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });
  window.addEventListener("pageshow", updateHeaderState);
}

const logoStrip = document.querySelector(".logo-strip");

if (logoStrip) {
  const viewport = logoStrip.querySelector(".logo-strip__viewport");
  const track = logoStrip.querySelector(".logo-strip__track");
  const originalSequence = logoStrip.querySelector(".logo-strip__sequence");
  const toggle = logoStrip.querySelector(".logo-strip__toggle");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hoverSupported = window.matchMedia("(hover: hover) and (pointer: fine)");
  let userPaused = false;
  let pointerHover = false;
  let focusWithin = false;
  let stripVisible = false;
  let visibilityObserver = null;
  let resizeObserver = null;

  function syncLogoMotion() {
    const paused =
      userPaused || pointerHover || focusWithin || !stripVisible || document.hidden;

    logoStrip.classList.toggle("is-paused", paused);
    toggle.textContent = userPaused ? "Play logos" : "Pause logos";
    toggle.setAttribute("aria-pressed", String(userPaused));
    toggle.setAttribute(
      "aria-label",
      userPaused ? "Play logo animation" : "Pause logo animation",
    );
  }

  function updateLoopCopies() {
    const sequenceWidth = originalSequence.getBoundingClientRect().width;
    const viewportWidth = viewport.clientWidth;

    if (!sequenceWidth || !viewportWidth) return;

    const requiredCopies = Math.max(2, Math.ceil(viewportWidth / sequenceWidth) + 1);

    while (track.children.length < requiredCopies) {
      const copy = originalSequence.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      copy.inert = true;
      copy
        .querySelectorAll("a, button, input, select, textarea, [tabindex]")
        .forEach((item) => item.setAttribute("tabindex", "-1"));
      track.append(copy);
    }

    while (track.children.length > requiredCopies) {
      track.lastElementChild.remove();
    }

    // The measured sequence includes its trailing gap, closing the loop seam.
    track.style.setProperty("--logo-scroll-distance", `-${sequenceWidth}px`);
  }

  function stopLogoLoop() {
    visibilityObserver?.disconnect();
    resizeObserver?.disconnect();
    visibilityObserver = null;
    resizeObserver = null;
    window.removeEventListener("resize", updateLoopCopies);
    track
      .querySelectorAll('.logo-strip__sequence[aria-hidden="true"]')
      .forEach((copy) => copy.remove());
    track.style.removeProperty("--logo-scroll-distance");
    logoStrip.classList.remove("is-animated", "is-paused");
    toggle.hidden = true;
    pointerHover = false;
    focusWithin = false;
    stripVisible = false;
  }

  function startLogoLoop() {
    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      stopLogoLoop();
      return;
    }

    try {
      logoStrip.classList.add("is-animated");
      updateLoopCopies();

      if (track.children.length < 2) {
        stopLogoLoop();
        return;
      }

      toggle.hidden = false;
      visibilityObserver = new IntersectionObserver(([entry]) => {
        stripVisible = entry.isIntersecting;
        syncLogoMotion();
      });
      visibilityObserver.observe(logoStrip);

      if ("ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(updateLoopCopies);
        resizeObserver.observe(viewport);
      } else {
        window.addEventListener("resize", updateLoopCopies, { passive: true });
      }

      syncLogoMotion();
    } catch {
      stopLogoLoop();
    }
  }

  toggle.addEventListener("click", () => {
    userPaused = !userPaused;
    syncLogoMotion();
  });

  logoStrip.addEventListener("pointerenter", (event) => {
    if (!hoverSupported.matches || event.pointerType === "touch") return;
    pointerHover = true;
    syncLogoMotion();
  });

  logoStrip.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "touch") return;
    pointerHover = false;
    syncLogoMotion();
  });

  logoStrip.addEventListener("focusin", () => {
    focusWithin = true;
    syncLogoMotion();
  });

  logoStrip.addEventListener("focusout", (event) => {
    if (!logoStrip.contains(event.relatedTarget)) {
      focusWithin = false;
      syncLogoMotion();
    }
  });

  document.addEventListener("visibilitychange", syncLogoMotion);
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) {
      stopLogoLoop();
    } else {
      startLogoLoop();
    }
  });

  if (reducedMotion.matches) {
    stopLogoLoop();
  } else {
    startLogoLoop();
  }
}

const aboutSection = document.querySelector("#about");

if (aboutSection) {
  const revealTargets = [...aboutSection.querySelectorAll(".about-reveal")];
  const motionPreference = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  let aboutObserver = null;

  function revealAboutImmediately() {
    revealTargets.forEach((target) => {
      target.classList.add("is-revealed");
    });

    aboutSection.classList.remove("about-reveal-ready");
    aboutSection.classList.add("about-reveal-skip-motion");
    aboutObserver?.disconnect();
  }

  function startAboutObserver() {
    if (
      motionPreference.matches ||
      !("IntersectionObserver" in window)
    ) {
      revealAboutImmediately();
      return;
    }

    try {
      aboutObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add("is-revealed");
            aboutObserver.unobserve(entry.target);
          });

          if (
            revealTargets.every((target) =>
              target.classList.contains("is-revealed"),
            )
          ) {
            aboutObserver.disconnect();
          }
        },
        {
          threshold: 0,
          rootMargin: "0px 0px -40px 0px",
        },
      );

      const viewportHeight = window.innerHeight;
      const pendingTargets = [];

      revealTargets.forEach((target) => {
        const bounds = target.getBoundingClientRect();
        const alreadyVisible =
          bounds.bottom > 0 && bounds.top < viewportHeight;

        if (alreadyVisible) {
          target.classList.add("is-revealed");
        } else {
          pendingTargets.push(target);
        }
      });

      if (pendingTargets.length === 0) {
        aboutObserver.disconnect();
        return;
      }

      pendingTargets.forEach((target) => aboutObserver.observe(target));
      aboutSection.classList.add("about-reveal-ready");
    } catch {
      revealAboutImmediately();
    }
  }

  aboutSection.addEventListener("focusin", revealAboutImmediately);

  document.addEventListener("click", (event) => {
    const eventTarget = event.target;
    if (!(eventTarget instanceof Element)) return;

    if (eventTarget.closest('a[href="#about"]')) {
      revealAboutImmediately();
    }
  });

  window.addEventListener("hashchange", () => {
    if (window.location.hash === "#about") {
      revealAboutImmediately();
    }
  });

  motionPreference.addEventListener("change", (event) => {
    if (event.matches) {
      revealAboutImmediately();
    }
  });

  if (window.location.hash === "#about") {
    revealAboutImmediately();
  } else {
    startAboutObserver();
  }
}

const servicesSection = document.querySelector("#services");

if (servicesSection) {
  const serviceCards = [...servicesSection.querySelectorAll(".services-reveal")];
  const motionPreference = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  let servicesObserver = null;

  function revealServicesImmediately() {
    serviceCards.forEach((card) => {
      card.classList.add("is-revealed");
    });

    servicesSection.classList.remove("services-reveal-ready");
    servicesSection.classList.add("services-reveal-skip-motion");
    servicesObserver?.disconnect();
  }

  function startServicesObserver() {
    if (
      motionPreference.matches ||
      !("IntersectionObserver" in window)
    ) {
      revealServicesImmediately();
      return;
    }

    try {
      servicesObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add("is-revealed");
            servicesObserver.unobserve(entry.target);
          });

          if (
            serviceCards.every((card) =>
              card.classList.contains("is-revealed"),
            )
          ) {
            servicesObserver.disconnect();
          }
        },
        {
          threshold: 0,
          rootMargin: "0px 0px -40px 0px",
        },
      );

      const viewportHeight = window.innerHeight;
      const pendingCards = [];

      serviceCards.forEach((card) => {
        const bounds = card.getBoundingClientRect();
        const alreadyVisible =
          bounds.bottom > 0 && bounds.top < viewportHeight;

        if (alreadyVisible) {
          card.classList.add("is-revealed");
        } else {
          pendingCards.push(card);
        }
      });

      if (pendingCards.length === 0) {
        servicesObserver.disconnect();
        return;
      }

      pendingCards.forEach((card) => servicesObserver.observe(card));
      servicesSection.classList.add("services-reveal-ready");
    } catch {
      revealServicesImmediately();
    }
  }

  servicesSection.addEventListener("focusin", revealServicesImmediately);

  document.addEventListener("click", (event) => {
    const eventTarget = event.target;
    if (!(eventTarget instanceof Element)) return;

    if (eventTarget.closest('a[href="#services"]')) {
      revealServicesImmediately();
    }
  });

  window.addEventListener("hashchange", () => {
    if (window.location.hash === "#services") {
      revealServicesImmediately();
    }
  });

  motionPreference.addEventListener("change", (event) => {
    if (event.matches) {
      revealServicesImmediately();
    }
  });

  if (window.location.hash === "#services") {
    revealServicesImmediately();
  } else {
    startServicesObserver();
  }
}

if (menuButton && mobileMenu) {
  const menuLinks = mobileMenu.querySelectorAll("a");
  const desktopBreakpoint = window.matchMedia("(min-width: 80rem)");

  function setMenuOpen(isOpen, returnFocus = false) {
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu",
    );
    mobileMenu.hidden = !isOpen;

    if (isOpen) {
      menuLinks[0]?.focus();
    } else if (returnFocus) {
      menuButton.focus();
    }
  }

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    setMenuOpen(!isOpen);
  });

  mobileMenu.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      setMenuOpen(false, true);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !mobileMenu.hidden) {
      setMenuOpen(false, true);
    }
  });

  document.addEventListener("click", (event) => {
    if (
      !mobileMenu.hidden &&
      !mobileMenu.contains(event.target) &&
      !menuButton.contains(event.target)
    ) {
      setMenuOpen(false);
    }
  });

  desktopBreakpoint.addEventListener("change", (event) => {
    if (event.matches) {
      setMenuOpen(false);
    }
  });
}

const searchForm = document.querySelector("#property-search-form");

if (searchForm) {
  const minPrice = searchForm.querySelector("#search-min-price");
  const maxPrice = searchForm.querySelector("#search-max-price");
  const minError = searchForm.querySelector("#min-price-error");
  const maxError = searchForm.querySelector("#max-price-error");
  const status = searchForm.querySelector("#search-status");

  function validatePrices() {
    let minMessage = "";
    let maxMessage = "";

    if (minPrice.value !== "" && Number(minPrice.value) < 0) {
      minMessage = "Enter a minimum price of 0 or more.";
    }
    if (maxPrice.value !== "" && Number(maxPrice.value) < 0) {
      maxMessage = "Enter a maximum price of 0 or more.";
    }
    if (
      !minMessage &&
      !maxMessage &&
      minPrice.value !== "" &&
      maxPrice.value !== "" &&
      Number(minPrice.value) > Number(maxPrice.value)
    ) {
      maxMessage = "Maximum price must be at least the minimum price.";
    }

    minPrice.setCustomValidity(minMessage);
    maxPrice.setCustomValidity(maxMessage);
    minError.textContent = minMessage;
    maxError.textContent = maxMessage;
    minPrice.setAttribute("aria-invalid", String(Boolean(minMessage)));
    maxPrice.setAttribute("aria-invalid", String(Boolean(maxMessage)));

    return !minMessage && !maxMessage;
  }

  minPrice.addEventListener("input", validatePrices);
  maxPrice.addEventListener("input", validatePrices);

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    status.textContent = "";

    if (!validatePrices()) {
      (minPrice.validationMessage ? minPrice : maxPrice).reportValidity();
      return;
    }

    status.textContent =
      "Live property search is not connected yet. Its destination is awaiting verification.";
  });
}

const galleryGrid = document.querySelector(".gallery-grid");
const galleryDialog = document.querySelector("#gallery-lightbox");
const gallerySection = document.querySelector("#gallery");

if (gallerySection && galleryGrid) {
  const galleryTiles = [...galleryGrid.querySelectorAll(".gallery-tile")];
  const motionPreference = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  const mobileLayout = window.matchMedia("(max-width: 639px)");
  let galleryObserver = null;

  function revealGalleryImmediately() {
    galleryTiles.forEach((tile) => {
      tile.classList.add("is-revealed");
    });

    gallerySection.classList.remove("gallery-reveal-ready");
    gallerySection.classList.add("gallery-reveal-skip-motion");
    galleryObserver?.disconnect();
  }

  function startGalleryObserver() {
    if (
      motionPreference.matches ||
      !("IntersectionObserver" in window)
    ) {
      revealGalleryImmediately();
      return;
    }

    try {
      galleryObserver = new IntersectionObserver(
        (entries) => {
          if (gallerySection.classList.contains("gallery-reveal-skip-motion")) {
            return;
          }

          const enteringTiles = entries
            .filter((entry) => entry.isIntersecting)
            .sort(
              (first, second) =>
                galleryTiles.indexOf(first.target) -
                galleryTiles.indexOf(second.target),
            );

          enteringTiles.forEach((entry, index) => {
            const delay = mobileLayout.matches
              ? 0
              : Math.min(index * 60, 180);

            entry.target.style.setProperty(
              "--gallery-reveal-delay",
              `${delay}ms`,
            );
            entry.target.classList.add("is-revealed");
            galleryObserver.unobserve(entry.target);
          });

          if (
            galleryTiles.every((tile) =>
              tile.classList.contains("is-revealed"),
            )
          ) {
            galleryObserver.disconnect();
          }
        },
        {
          threshold: 0,
          rootMargin: "0px 0px -40px 0px",
        },
      );

      const viewportHeight = window.innerHeight;
      const pendingTiles = [];

      galleryTiles.forEach((tile) => {
        const bounds = tile.getBoundingClientRect();
        const alreadyVisible =
          bounds.bottom > 0 && bounds.top < viewportHeight;

        if (alreadyVisible) {
          tile.classList.add("is-revealed");
        } else {
          pendingTiles.push(tile);
        }
      });

      if (pendingTiles.length === 0) {
        galleryObserver.disconnect();
        return;
      }

      pendingTiles.forEach((tile) => galleryObserver.observe(tile));
      gallerySection.classList.add("gallery-reveal-ready");
    } catch {
      revealGalleryImmediately();
    }
  }

  galleryGrid.addEventListener("focusin", (event) => {
    const eventTarget = event.target;
    if (
      eventTarget instanceof Element &&
      eventTarget.closest(".gallery-tile")?.matches(":focus-visible")
    ) {
      revealGalleryImmediately();
    }
  });

  document.addEventListener("click", (event) => {
    const eventTarget = event.target;
    if (!(eventTarget instanceof Element)) return;

    if (eventTarget.closest('a[href="#gallery"]')) {
      revealGalleryImmediately();
    }
  });

  window.addEventListener("hashchange", () => {
    if (window.location.hash === "#gallery") {
      revealGalleryImmediately();
    }
  });

  motionPreference.addEventListener("change", (event) => {
    if (event.matches) {
      revealGalleryImmediately();
    }
  });

  if (window.location.hash === "#gallery") {
    revealGalleryImmediately();
  } else {
    startGalleryObserver();
  }
}

if (galleryGrid && galleryDialog) {
  const thumbnails = [...galleryGrid.querySelectorAll(".gallery-tile")];
  const lightboxImage = document.querySelector("#gallery-lightbox-image");
  const count = document.querySelector("#gallery-count");
  const previousButton = document.querySelector("#gallery-previous");
  const nextButton = document.querySelector("#gallery-next");
  const closeButton = document.querySelector("#gallery-close");

  let currentIndex = 0;
  let openingButton = null;
  let previousBodyOverflow = "";

  function showPhoto(index) {
    currentIndex = (index + thumbnails.length) % thumbnails.length;
    const thumbnail = thumbnails[currentIndex].querySelector("img");

    lightboxImage.src = thumbnail.currentSrc || thumbnail.src;
    lightboxImage.alt = thumbnail.alt;
    count.textContent = `${currentIndex + 1} of ${thumbnails.length}`;
  }

  thumbnails.forEach((button, index) => {
    button.addEventListener("click", () => {
      openingButton = button;
      showPhoto(index);
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      galleryDialog.showModal();
      closeButton.focus();
    });
  });

  previousButton.addEventListener("click", () => showPhoto(currentIndex - 1));
  nextButton.addEventListener("click", () => showPhoto(currentIndex + 1));
  closeButton.addEventListener("click", () => galleryDialog.close());

  galleryDialog.addEventListener("click", (event) => {
    if (event.target === galleryDialog) {
      galleryDialog.close();
    }
  });

  galleryDialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPhoto(currentIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showPhoto(currentIndex + 1);
    }
    // Escape closes a modal dialog natively.
  });

  galleryDialog.addEventListener("close", () => {
    document.body.style.overflow = previousBodyOverflow;
    openingButton?.focus();
  });
}

const contactForm = document.querySelector("#contact-form");

if (contactForm) {
  const contactStatus = document.querySelector("#contact-status");

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    contactStatus.textContent =
      "Your message was not sent. Form delivery is not connected yet.";
  });
}

