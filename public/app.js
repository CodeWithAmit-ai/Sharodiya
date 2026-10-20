
// Update the footer year
const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// Load real Puja entries from the backend
async function loadHomepageGallery() {
  const galleryGrid = document.getElementById("gallery-grid");
  const galleryNotice = document.getElementById("gallery-notice");

  if (!galleryGrid) return;

  galleryGrid.replaceChildren();

  const loadingMessage = document.createElement("p");
  loadingMessage.className = "gallery-notice";
  loadingMessage.textContent = "Loading Puja photographs...";
  galleryGrid.appendChild(loadingMessage);

  try {
    const response = await fetch("/api/pujas");
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error("Unable to load the Puja gallery.");
    }

    galleryGrid.replaceChildren();

    if (!result.data || result.data.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "gallery-notice";
      emptyMessage.textContent =
        "No Puja photographs have been added yet.";

      galleryGrid.appendChild(emptyMessage);

      if (galleryNotice) {
        galleryNotice.textContent =
          "Please check back soon for new photographs.";
      }

      return;
    }

    result.data.forEach((puja, index) => {
      const card = document.createElement("article");
      card.className = "gallery-card";

      // Photograph
      const image = document.createElement("img");
      image.className = "gallery-photo";
      image.alt = puja.title || "Durga Puja photograph";
      image.loading = "lazy";

      image.addEventListener("error", () => {
        image.alt = "Photograph unavailable";
        image.classList.add("gallery-photo-error");
      }, { once: true });

      image.src = puja.imageUrl;

      // Photo details
      const info = document.createElement("div");
      info.className = "card-info";

      const textContainer = document.createElement("div");

      const title = document.createElement("h3");
      title.textContent = puja.title || "Durga Puja";

      const location = document.createElement("p");
      location.textContent = puja.location || "Bengal";

      const year = document.createElement("p");
      year.textContent = String(puja.year || "");

      textContainer.append(title, location, year);

      const number = document.createElement("span");
      number.className = "card-arrow";
      number.textContent = "↗";
      number.setAttribute("aria-hidden", "true");


info.append(textContainer, number);
card.append(image, info);

// Get Directions link (shown only when a Maps URL exists)
if (puja.googleMapsUrl) {
  const directionsLink = document.createElement("a");
  directionsLink.className = "directions-link";
  directionsLink.textContent = "Get Directions ↗";
  directionsLink.href = puja.googleMapsUrl;
  directionsLink.target = "_blank";
  directionsLink.rel = "noopener noreferrer";
  directionsLink.setAttribute(
    "aria-label",
    `Get directions to ${puja.title || "this Puja"}`
  );

  card.appendChild(directionsLink);
}

galleryGrid.appendChild(card);

    });

    if (galleryNotice) {
      galleryNotice.textContent =
        `${result.data.length} Puja photograph${result.data.length === 1 ? "" : "s"} in the gallery.`;
    }
  } catch (error) {
    console.error("Homepage gallery error:", error);

    galleryGrid.replaceChildren();

    const errorMessage = document.createElement("p");
    errorMessage.className = "gallery-notice";
    errorMessage.textContent =
      "Unable to load photographs. Please refresh and try again.";

    galleryGrid.appendChild(errorMessage);
  }
}

loadHomepageGallery();
