// ============================================================
// EventEase — Frontend Script (script.js)
// ============================================================
// This file handles:
//   1. Fetching and rendering events from the backend API
//   2. Opening the registration modal when a student clicks Register
//   3. Validating the form on the client side
//   4. Submitting the registration to the backend via Fetch API
//   5. Showing success / error messages
//   6. Mobile hamburger menu toggle
// ============================================================

// ── Category configuration ──────────────────────────────────
// Maps category name → display emoji, CSS colour variables
const CATEGORY_CONFIG = {
  Technology:  { emoji: "💻", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  Workshop:    { emoji: "🛠️", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  Competition: { emoji: "🏆", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  Seminar:     { emoji: "🎤", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  Cultural:    { emoji: "🎭", color: "#ec4899", bg: "rgba(236,72,153,0.1)" },
};

// Default config for unknown categories
const DEFAULT_CATEGORY = { emoji: "📌", color: "#6366f1", bg: "rgba(99,102,241,0.1)" };

// ── DOM Element References ───────────────────────────────────
const eventsGrid     = document.getElementById("events-grid");
const eventsLoading  = document.getElementById("events-loading");
const eventsError    = document.getElementById("events-error");
const eventsErrorMsg = document.getElementById("events-error-msg");

const modalOverlay   = document.getElementById("modal-overlay");
const modalClose     = document.getElementById("modal-close");
const modalEventInfo = document.getElementById("modal-event-info");

const regForm        = document.getElementById("reg-form");
const formEventId    = document.getElementById("form-event-id");
const formName       = document.getElementById("form-name");
const formEmail      = document.getElementById("form-email");
const formDept       = document.getElementById("form-department");
const formYear       = document.getElementById("form-year");
const formMessage    = document.getElementById("form-message");
const submitBtn      = document.getElementById("submit-btn");
const submitText     = document.getElementById("submit-text");
const submitSpinner  = document.getElementById("submit-spinner");

const hamburgerBtn   = document.getElementById("hamburger-btn");
const mobileMenu     = document.getElementById("mobile-menu");

// ============================================================
// HAMBURGER MENU
// ============================================================
hamburgerBtn.addEventListener("click", () => {
  const isOpen = !mobileMenu.hidden;
  mobileMenu.hidden = isOpen;
  hamburgerBtn.setAttribute("aria-expanded", String(!isOpen));
});

// Close mobile menu when a link is clicked
mobileMenu.querySelectorAll(".mobile-link").forEach((link) => {
  link.addEventListener("click", () => {
    mobileMenu.hidden = true;
    hamburgerBtn.setAttribute("aria-expanded", "false");
  });
});

// ============================================================
// FETCH & RENDER EVENTS
// ============================================================

/**
 * Formats a date string (YYYY-MM-DD) into a readable format.
 * e.g., "2026-11-15" → "Sat, 15 Nov 2026"
 */
function formatDate(dateStr) {
  const date = new Date(dateStr + "T00:00:00"); // Avoid timezone shift
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Creates the HTML for one event card.
 * @param {Object} event - Event data from the API
 * @returns {HTMLElement} - The card DOM element
 */
function createEventCard(event) {
  const config = CATEGORY_CONFIG[event.category] || DEFAULT_CATEGORY;

  const card = document.createElement("article");
  card.className = "event-card";
  card.setAttribute("role", "listitem");
  card.setAttribute("aria-label", `Event: ${event.title}`);

  card.innerHTML = `
    <div class="event-card__stripe" style="background: ${config.color};"></div>
    <div class="event-card__body">
      <span class="event-card__category"
            style="color:${config.color}; background:${config.bg};"
            aria-label="Category: ${event.category}">
        <span aria-hidden="true">${config.emoji}</span>
        ${event.category}
      </span>

      <h3 class="event-card__title">${escapeHtml(event.title)}</h3>

      <div class="event-card__meta">
        <div class="event-card__meta-item">
          <span class="event-card__meta-icon" aria-hidden="true">📅</span>
          <span>${formatDate(event.date)}</span>
        </div>
        <div class="event-card__meta-item">
          <span class="event-card__meta-icon" aria-hidden="true">🕐</span>
          <span>${escapeHtml(event.time)}</span>
        </div>
        <div class="event-card__meta-item">
          <span class="event-card__meta-icon" aria-hidden="true">📍</span>
          <span>${escapeHtml(event.venue)}</span>
        </div>
      </div>

      <p class="event-card__description">${escapeHtml(event.description)}</p>
    </div>

    <div class="event-card__footer">
      <button
        class="event-card__register-btn"
        data-event-id="${escapeHtml(event.id)}"
        data-event-title="${escapeHtml(event.title)}"
        aria-label="Register for ${escapeHtml(event.title)}"
      >
        <span aria-hidden="true">✍️</span>
        Register Now
      </button>
    </div>
  `;

  // Attach register button handler
  const btn = card.querySelector(".event-card__register-btn");
  btn.addEventListener("click", () => openModal(event));

  return card;
}

/**
 * Loads events from the API and renders them into the grid.
 * Called on page load and on retry.
 */
async function loadEvents() {
  // Reset state
  eventsLoading.hidden = false;
  eventsError.hidden   = true;
  eventsGrid.innerHTML = "";

  try {
    const response = await fetch("/api/events");

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const result = await response.json();
    const events = result.data || [];

    eventsLoading.hidden = true;

    if (events.length === 0) {
      eventsGrid.innerHTML = `
        <div class="error-state" style="grid-column:1/-1">
          <span class="error-icon">📭</span>
          <h3>No events yet</h3>
          <p>Check back soon — new events are coming!</p>
        </div>`;
      return;
    }

    events.forEach((event) => {
      eventsGrid.appendChild(createEventCard(event));
    });
  } catch (err) {
    eventsLoading.hidden = true;
    eventsError.hidden   = false;
    eventsErrorMsg.textContent =
      "Unable to connect to the server. Please make sure the server is running and try again.";
    console.error("Failed to load events:", err);
  }
}

// ============================================================
// REGISTRATION MODAL
// ============================================================

/**
 * Opens the modal and pre-fills it with the selected event's details.
 * @param {Object} event - The event the student wants to register for
 */
function openModal(event) {
  // Clear previous form state
  resetForm();

  // Fill in the selected event
  formEventId.value = event.id;
  modalEventInfo.textContent = `📌 Registering for: ${event.title}`;

  // Show modal
  modalOverlay.hidden = false;
  document.body.style.overflow = "hidden"; // Prevent background scroll

  // Focus the first input for accessibility
  formName.focus();
}

/** Closes the modal and restores scroll. */
function closeModal() {
  modalOverlay.hidden = true;
  document.body.style.overflow = "";
  resetForm();
}

/** Clears all form fields, errors, and messages. */
function resetForm() {
  regForm.reset();
  clearFieldErrors();
  hideFormMessage();
  setSubmitLoading(false);
}

// Close when clicking the × button
modalClose.addEventListener("click", closeModal);

// Close when clicking the dark overlay behind the modal
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

// Close on Escape key (accessibility)
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalOverlay.hidden) closeModal();
});

// ============================================================
// FORM VALIDATION (CLIENT-SIDE)
// ============================================================

/**
 * Validates a single field and shows/hides its error message.
 * @returns {boolean} true if valid
 */
function validateField(input, errorId, validateFn) {
  const error = document.getElementById(errorId);
  const message = validateFn(input.value.trim());

  if (message) {
    input.classList.add("is-invalid");
    error.textContent = message;
    return false;
  } else {
    input.classList.remove("is-invalid");
    error.textContent = "";
    return true;
  }
}

/** Validates all form fields. @returns {boolean} true if all valid */
function validateForm() {
  const nameValid = validateField(formName, "name-error", (v) => {
    if (!v) return "Full name is required.";
    if (v.length < 2) return "Name must be at least 2 characters.";
    if (v.length > 100) return "Name is too long.";
    return "";
  });

  const emailValid = validateField(formEmail, "email-error", (v) => {
    if (!v) return "Email address is required.";
    if (!/^\S+@\S+\.\S+$/.test(v)) return "Please enter a valid email address.";
    return "";
  });

  const deptValid = validateField(formDept, "dept-error", (v) => {
    if (!v) return "Department is required.";
    return "";
  });

  const yearValid = validateField(formYear, "year-error", (v) => {
    if (!v) return "Please select your academic year.";
    return "";
  });

  return nameValid && emailValid && deptValid && yearValid;
}

function clearFieldErrors() {
  [formName, formEmail, formDept, formYear].forEach((input) => {
    input.classList.remove("is-invalid");
  });
  ["name-error", "email-error", "dept-error", "year-error"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
}

// ============================================================
// SUBMIT LOADING STATE
// ============================================================
function setSubmitLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitText.textContent = isLoading ? "Submitting…" : "Register Now";
  submitSpinner.hidden = !isLoading;
}

// ============================================================
// FORM MESSAGES
// ============================================================
function showFormMessage(message, type) {
  formMessage.textContent = message;
  formMessage.className = `form-message is-${type}`; // is-success or is-error
  formMessage.hidden = false;

  // Scroll message into view if off-screen
  formMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideFormMessage() {
  formMessage.hidden = true;
  formMessage.textContent = "";
  formMessage.className = "form-message";
}

// ============================================================
// FORM SUBMISSION
// ============================================================
regForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // Don't reload the page
  hideFormMessage();

  // Client-side validation first
  if (!validateForm()) return;

  setSubmitLoading(true);

  const payload = {
    studentName:  formName.value.trim(),
    email:        formEmail.value.trim(),
    department:   formDept.value.trim(),
    academicYear: formYear.value,
    eventId:      formEventId.value,
  };

  try {
    const response = await fetch("/api/registrations", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // ── SUCCESS ──────────────────────────────────────────
      showFormMessage("🎉 " + result.message, "success");
      regForm.reset();
      clearFieldErrors();

      // Auto-close modal after 3 seconds on success
      setTimeout(() => closeModal(), 3000);
    } else {
      // ── SERVER ERROR (validation, duplicate, etc.) ───────
      showFormMessage("❌ " + (result.message || "Something went wrong."), "error");
    }
  } catch (err) {
    // ── NETWORK ERROR ──────────────────────────────────────
    showFormMessage(
      "❌ Could not connect to the server. Please check your connection and try again.",
      "error"
    );
    console.error("Registration fetch error:", err);
  } finally {
    setSubmitLoading(false);
  }
});

// ============================================================
// UTILITY: Escape HTML to prevent XSS
// Always escape user-generated or API content before inserting into HTML
// ============================================================
function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================
// INITIALISE on page load
// ============================================================
loadEvents();
