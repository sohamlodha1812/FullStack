// ─────────────────────────────────────────────
// adminAuth middleware
// Checks whether the current request comes from a logged-in admin.
// Usage: add `adminAuth` before any route you want to protect.
//
// Example:
//   app.get('/api/registrations', adminAuth, async (req, res) => { ... });
// ─────────────────────────────────────────────

function adminAuth(req, res, next) {
  // req.session.isAdmin is set to true by POST /api/admin/login
  if (req.session && req.session.isAdmin === true) {
    return next(); // Admin is logged in — allow the request
  }

  // Not authenticated — return 401 Unauthorized
  return res.status(401).json({
    success: false,
    message: "Unauthorised. Please log in to the admin dashboard.",
  });
}

module.exports = adminAuth;
