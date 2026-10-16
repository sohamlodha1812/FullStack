// ============================================================
// EventEase — Admin Dashboard Script (admin.js)
// ============================================================
// Handles:
//   1. Admin login / logout
//   2. Loading dashboard stats
//   3. Loading and rendering registrations table
//   4. Live client-side search/filter
//   5. Sidebar navigation between sections
// ============================================================

// ── DOM References ───────────────────────────────────────────

// Login screen elements
const loginScreen   = document.getElementById("login-screen");
const loginForm     = document.getElementById("login-form");
const adminPassword = document.getElementById("admin-password");
const loginBtn      = document.getElementById("login-btn");
const loginText     = document.getElementById("login-text");
const loginSpinner  = document.getElementById("login-spinner");
const loginError    = document.getElementById("login-error");

// Dashboard elements
const dashboard     = document.getElementById("dashboard");
const dashLoading   = document.getElementById("dash-loading");
const dashError     = document.getElementById("dash-error");
const dashErrorMsg  = document.getElementById("dash-error-msg");

// Topbar / status
const dbStatus      = document.getElementById("db-status");
const pageTitle     = document.getElementById("page-title");

// Stats
const statTotal    = document.getElementById("stat-total");
const statEvents   = document.getElementById("stat-events");
const statPopular  = document.getElementById("stat-popular");
const eventBreakdown = document.getElementById("event-breakdown");

// Table elements
const tableLoading = document.getElementById("table-loading");
const tableEmpty   = document.getElementById("table-empty");
const regTable     = document.getElementById("reg-table");
const regTableBody = document.getElementById("reg-table-body");
const searchInput  = document.getElementById("search-input");
const searchCount  = document.getElementById("search-count");

// Navigation
const navOverview       = document.getElementById("nav-overview");
const navRegistrations  = document.getElementById("nav-registrations");
const sectionOverview   = document.getElementById("section-overview");
const sectionReg        = document.getElementById("section-registrations");

const logoutBtn         = document.getElementById("logout-btn");

// ── All loaded registrations (for client-side search) ────────
let allRegistrations = [];

// ============================================================
// LOGIN
// ============================================================
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideLoginError();
  setLoginLoading(true);

  const password = adminPassword.value;

  if (!password) {
    showLoginError("Please enter the admin password.");
    setLoginLoading(false);
    return;
  }

  try {
    const response = await fetch("/api/admin/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ password }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      showDashboard();
    } else {
      showLoginError(result.message || "Login failed. Please try again.");
    }
  } catch (err) {
    showLoginError("Cannot connect to server. Make sure the server is running.");
    console.error("Login error:", err);
  } finally {
    setLoginLoading(false);
  }
});

function setLoginLoading(loading) {
  loginBtn.disabled      = loading;
  loginText.textContent  = loading ? "Logging in…" : "Login";
  loginSpinner.hidden    = !loading;
}

function showLoginError(msg) {
  loginError.textContent = "⚠️ " + msg;
  loginError.hidden      = false;
}

function hideLoginError() {
  loginError.hidden      = true;
  loginError.textContent = "";
}

// ============================================================
// LOGOUT
// ============================================================
logoutBtn.addEventListener("click", async () => {
  if (!confirm("Are you sure you want to log out?")) return;

  try {
    await fetch("/api/admin/logout", { method: "POST" });
  } catch (err) {
    console.warn("Logout request failed, clearing UI anyway.", err);
  }

  // Always go back to login screen regardless of server response
  showLoginScreen();
});

// ============================================================
// SHOW/HIDE SCREENS
// ============================================================
function showDashboard() {
  loginScreen.hidden = true;
  dashboard.hidden   = false;
  loadDashboard();
}

function showLoginScreen() {
  dashboard.hidden   = true;
  loginScreen.hidden = false;
  loginForm.reset();
  hideLoginError();
}

// ============================================================
// SIDEBAR NAVIGATION
// ============================================================
function activateSection(sectionEl, navEl, title) {
  // Hide all sections
  sectionOverview.hidden = true;
  sectionReg.hidden      = true;

  // Remove active class from all nav links
  [navOverview, navRegistrations].forEach((n) => {
    n.classList.remove("sidebar__link--active");
  });

  // Show selected section
  sectionEl.hidden = false;
  navEl.classList.add("sidebar__link--active");
  pageTitle.textContent = title;
}

navOverview.addEventListener("click", (e) => {
  e.preventDefault();
  activateSection(sectionOverview, navOverview, "Dashboard Overview");
});

navRegistrations.addEventListener("click", (e) => {
  e.preventDefault();
  activateSection(sectionReg, navRegistrations, "All Registrations");
});

// ============================================================
// LOAD DASHBOARD (Stats + Registrations)
// ============================================================
async function loadDashboard() {
  // Show loading state
  dashLoading.hidden = false;
  dashError.hidden   = true;
  sectionOverview.hidden = true;
  sectionReg.hidden      = true;

  try {
    // Fetch stats and registrations in parallel for speed
    const [statsRes, regsRes] = await Promise.all([
      fetch("/api/admin/stats"),
      fetch("/api/registrations"),
    ]);

    // Handle 401 — session expired or not logged in
    if (statsRes.status === 401 || regsRes.status === 401) {
      showLoginScreen();
      return;
    }

    if (!statsRes.ok || !regsRes.ok) {
      throw new Error("Server returned an error response.");
    }

    const statsData = await statsRes.json();
    const regsData  = await regsRes.json();

    // Update DB status indicator
    setDbStatus(true);

    // Render overview
    renderStats(statsData.data);

    // Render registrations table
    allRegistrations = regsData.data || [];
    renderTable(allRegistrations);

    // Show overview by default
    dashLoading.hidden = true;
    activateSection(sectionOverview, navOverview, "Dashboard Overview");

  } catch (err) {
    dashLoading.hidden = false;
    dashLoading.hidden = true;
    dashError.hidden   = false;

    // Check if it's a DB issue
    if (err.message && err.message.includes("503")) {
      dashErrorMsg.textContent = "Database is unavailable. Please check your MongoDB connection.";
      setDbStatus(false);
    } else {
      dashErrorMsg.textContent = "Failed to load data. " + err.message;
    }

    console.error("Dashboard load error:", err);
  }
}

// ============================================================
// RENDER STATS
// ============================================================
function renderStats(data) {
  if (!data) return;

  const { totalRegistrations, byEvent } = data;

  // Update stat cards
  statTotal.textContent   = totalRegistrations || 0;
  statEvents.textContent  = byEvent ? byEvent.length : 0;
  statPopular.textContent = byEvent && byEvent[0] ? byEvent[0].eventTitle : "—";

  // Render event breakdown with mini bar charts
  if (!byEvent || byEvent.length === 0) {
    eventBreakdown.innerHTML = '<p class="empty-text">No registrations yet.</p>';
    return;
  }

  const maxCount = byEvent[0].count || 1; // First is highest (sorted by count desc)

  eventBreakdown.innerHTML = byEvent
    .map((item) => {
      const pct = Math.round((item.count / maxCount) * 100);
      return `
        <div class="event-row">
          <span class="event-row__name">${escapeHtml(item.eventTitle)}</span>
          <div class="event-row__bar-wrap" role="progressbar"
               aria-valuenow="${item.count}" aria-valuemin="0" aria-valuemax="${maxCount}"
               aria-label="${item.eventTitle}: ${item.count} registration${item.count !== 1 ? "s" : ""}">
            <div class="event-row__bar" style="width: ${pct}%;"></div>
          </div>
          <span class="event-row__count">${item.count}</span>
        </div>
      `;
    })
    .join("");
}

// ============================================================
// RENDER TABLE
// ============================================================
function renderTable(registrations) {
  // Hide all table states first
  tableLoading.hidden = true;
  tableEmpty.hidden   = true;
  regTable.hidden     = true;

  if (registrations.length === 0) {
    tableEmpty.hidden = false;
    updateSearchCount(0, 0);
    return;
  }

  regTableBody.innerHTML = registrations
    .map((reg, index) => {
      const date = new Date(reg.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      return `
        <tr data-name="${escapeHtml(reg.studentName.toLowerCase())}"
            data-email="${escapeHtml(reg.email.toLowerCase())}">
          <td class="td-number">${index + 1}</td>
          <td class="td-name">${escapeHtml(reg.studentName)}</td>
          <td class="td-email">${escapeHtml(reg.email)}</td>
          <td>${escapeHtml(reg.department)}</td>
          <td>${escapeHtml(reg.academicYear)}</td>
          <td><span class="td-event">${escapeHtml(reg.eventTitle)}</span></td>
          <td class="td-date">${date}</td>
        </tr>
      `;
    })
    .join("");

  regTable.hidden = false;
  updateSearchCount(registrations.length, registrations.length);
}

// ============================================================
// LIVE SEARCH / FILTER
// ============================================================
searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();
  const rows  = regTableBody.querySelectorAll("tr");

  let visible = 0;

  rows.forEach((row) => {
    const name  = row.dataset.name  || "";
    const email = row.dataset.email || "";
    const match = name.includes(query) || email.includes(query);

    row.classList.toggle("is-hidden", !match);
    if (match) visible++;
  });

  updateSearchCount(visible, allRegistrations.length);

  // Show empty state if nothing matches
  tableEmpty.hidden = visible > 0;
  regTable.hidden   = visible === 0;
  if (visible === 0 && allRegistrations.length > 0) {
    tableEmpty.hidden = false;
    tableEmpty.querySelector("p").textContent = `No results for "${searchInput.value}"`;
  }
});

function updateSearchCount(visible, total) {
  if (!searchCount) return;
  searchCount.textContent = total > 0 ? `${visible} of ${total} shown` : "";
}

// ============================================================
// DB STATUS INDICATOR
// ============================================================
function setDbStatus(connected) {
  dbStatus.textContent  = connected ? "✅ DB Connected" : "❌ DB Unavailable";
  dbStatus.className    = "db-status " + (connected ? "db-status--connected" : "db-status--error");
}

// ============================================================
// UTILITY: Escape HTML to prevent XSS
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
// ON LOAD — Check if already logged in (existing session)
// ============================================================
(async function checkSession() {
  try {
    // Quietly try a protected endpoint to see if session is still valid
    const res = await fetch("/api/admin/stats");
    if (res.ok) {
      // Session exists — go straight to dashboard
      showDashboard();
    }
    // Otherwise stay on login screen (default)
  } catch (err) {
    // Network error — stay on login screen
  }
})();
