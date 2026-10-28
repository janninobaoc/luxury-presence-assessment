const menuButton = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector("#mobile-menu");
const siteHeader = document.querySelector(".site-header");

if (siteHeader) {
  const updateHeaderState = () => {
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 40);
  };

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });
  window.addEventListener("pageshow", updateHeaderState);
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
  // const status = searchForm.querySelector("#search-status");

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

  // searchForm.addEventListener("submit", (event) => {
  //   event.preventDefault();
  //   status.textContent = "";

  //   if (!validatePrices()) {
  //     (minPrice.validationMessage ? minPrice : maxPrice).reportValidity();
  //     return;
  //   }

  //   status.textContent =
  //     "Live property search is not connected yet. Its destination is awaiting verification.";
  // });
}

const galleryGrid = document.querySelector(".gallery-grid");
const galleryDialog = document.querySelector("#gallery-lightbox");

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