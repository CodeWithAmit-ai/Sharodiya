
const loginView = document.getElementById("login-view");
const dashboardView = document.getElementById("dashboard-view");

const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const loginButton = document.getElementById("login-button");

const logoutButton = document.getElementById("logout-button");
const galleryList = document.getElementById("gallery-list");
const uploadForm = document.getElementById("upload-form");

// Show the admin dashboard
function showDashboard() {
  loginView.hidden = true;
  dashboardView.hidden = false;
}

// Show the login page
function showLogin() {
  dashboardView.hidden = true;
  loginView.hidden = false;
}

// Check whether an admin session already exists
async function checkAdminSession() {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "same-origin"
    });

    if (response.ok) {
      showDashboard();
      await loadGallery();
    } else {
      showLogin();
    }
  } catch (error) {
    showLogin();

    loginMessage.textContent =
      "Cannot connect to the server. Please start Sharodiya.";
  }
}

// Handle admin login
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  loginMessage.textContent = "";
  loginButton.disabled = true;
  loginButton.textContent = "Signing in...";

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "same-origin",
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      loginMessage.textContent =
        result.message || "Invalid username or password.";
      return;
    }

    loginForm.reset();
    showDashboard();
    await loadGallery();
  } catch (error) {
    loginMessage.textContent =
      "Unable to connect. Check that the server is running.";
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Sign In";
  }
});

// Load gallery entries from MongoDB
async function loadGallery() {
  galleryList.replaceChildren();

  const loadingMessage = document.createElement("p");
  loadingMessage.textContent = "Loading gallery...";
  galleryList.appendChild(loadingMessage);

  try {
    const response = await fetch("/api/pujas", {
      credentials: "same-origin"
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error("Gallery could not be loaded.");
    }

    galleryList.replaceChildren();

    if (!result.data || result.data.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.textContent =
        "No gallery entries yet. Add your first Puja soon!";

      galleryList.appendChild(emptyMessage);
      return;
    }

    result.data.forEach((puja) => {
      const card = document.createElement("article");
      card.className = "admin-gallery-card";

      // Create image
      const image = document.createElement("img");

      image.alt = puja.title || "Puja photograph";
      image.loading = "lazy";
      image.style.display = "block";
      image.style.width = "100%";
      image.style.maxWidth = "320px";
      image.style.height = "220px";
      image.style.objectFit = "cover";
      image.style.borderRadius = "10px";
      image.style.backgroundColor = "#f5e8dc";

      // Display a message if the image cannot be loaded
      image.addEventListener("error", () => {
        image.style.display = "none";

        const errorText = document.createElement("p");
        errorText.textContent =
          "Image could not be loaded. Please check the Cloudinary URL.";

        errorText.style.color = "#b42318";
        errorText.className = "image-error";

        card.prepend(errorText);
      }, { once: true });

      // Assign the image URL returned by the backend
      if (typeof puja.imageUrl === "string" && puja.imageUrl.trim()) {
        image.src = puja.imageUrl;
      } else {
        image.dispatchEvent(new Event("error"));
      }

      // Create title
      const title = document.createElement("h3");
      title.textContent = puja.title || "Untitled Puja";

      // Create location
      const location = document.createElement("p");
      location.textContent = `Location: ${puja.location || "Not specified"}`;

      // Create year
      const year = document.createElement("p");
      year.textContent = `Year: ${puja.year || "Not specified"}`;

const deleteButton = document.createElement("button");
deleteButton.type = "button";
deleteButton.textContent = "Delete";
deleteButton.className = "delete-puja-button";

deleteButton.addEventListener("click", async () => {
  const confirmed = confirm(
    `Are you sure you want to delete "${puja.title}" and its photograph?`
  );

  if (!confirmed) return;

  deleteButton.disabled = true;
  deleteButton.textContent = "Deleting...";

  try {
    const response = await fetch(
      `/api/uploads/${encodeURIComponent(puja._id)}`,
      {
        method: "DELETE",
        credentials: "same-origin"
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Deletion failed.");
    }

    await loadGallery();
  } catch (error) {
    alert(error.message || "Unable to delete this Puja entry.");
    deleteButton.disabled = false;
    deleteButton.textContent = "Delete";
  }
});

card.append(image, title, location, year, deleteButton);
galleryList.appendChild(card);
    });
  } catch (error) {
    galleryList.replaceChildren();

    const errorMessage = document.createElement("p");
    errorMessage.textContent =
      "Unable to load the gallery. Please refresh and try again.";

    galleryList.appendChild(errorMessage);
    console.error("Gallery loading error:", error);
  }
}

// Handle admin logout
logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;

  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin"
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      alert(result.message || "Unable to log out.");
      return;
    }

    showLogin();
    loginMessage.textContent = "";
  } catch (error) {
    alert("Unable to connect to the server.");
  } finally {
    logoutButton.disabled = false;
  }
});

// Upload status message
let uploadMessage = null;

if (uploadForm) {
  uploadMessage = document.createElement("p");
  uploadMessage.setAttribute("role", "status");
  uploadMessage.setAttribute("aria-live", "polite");

  uploadForm.appendChild(uploadMessage);

  // Handle Puja photograph upload
  uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    uploadMessage.textContent = "";

    const submitButton = uploadForm.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    const fileInput = uploadForm.querySelector('input[type="file"]');
    const imageFile = fileInput?.files?.[0];

    if (!imageFile) {
      uploadMessage.textContent = "Please select a photograph.";
      return;
    }

    // Check the image type in the browser before uploading
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(imageFile.type)) {
      uploadMessage.textContent =
        "Please select a JPG, PNG, or WebP image.";
      return;
    }

    // Match the backend's 5 MB file size limit
    if (imageFile.size > 5 * 1024 * 1024) {
      uploadMessage.textContent =
        "The image must be smaller than 5 MB.";
      return;
    }

    // Build form data
    const formData = new FormData(uploadForm);

    // Ensure the file field is named "image" for the backend
    formData.delete("image");

    if (fileInput.name && fileInput.name !== "image") {
      formData.delete(fileInput.name);
    }

    formData.append("image", imageFile);

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Uploading...";
    }

    try {
      const response = await fetch("/api/uploads", {
        method: "POST",
        credentials: "same-origin",
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        uploadMessage.textContent =
          result.message || "Upload failed. Please try again.";
        return;
      }

      uploadMessage.textContent =
        "Puja entry uploaded successfully!";

      uploadForm.reset();

      // Refresh the gallery after a successful upload
      await loadGallery();
    } catch (error) {
      uploadMessage.textContent =
        "Unable to connect to the server. Please try again.";

      console.error("Upload error:", error);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Upload Puja";
      }
    }
  });
}

// Run when the page opens
checkAdminSession();
