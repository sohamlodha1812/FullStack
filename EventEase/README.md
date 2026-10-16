# 🎓 EventEase — College Event Registration System

A minimal, modern, full-stack web application where college students can browse upcoming events and register online.

> **Student Mini Project** | Node.js · Express · MongoDB · HTML · CSS · Vanilla JS

---

## 📁 Project Structure

```
EventEase/
├── public/                  # All frontend files (served statically)
│   ├── index.html           # Main student-facing page
│   ├── style.css            # Styles for the main page
│   ├── script.js            # Frontend JS (events, registration modal)
│   ├── admin.html           # Admin dashboard page
│   ├── admin.css            # Admin dashboard styles
│   └── admin.js             # Admin dashboard JS (login, stats, table)
├── models/
│   └── Registration.js      # Mongoose schema + compound unique index
├── middleware/
│   └── adminAuth.js         # Session-based admin route protection
├── server.js                # Main Express server (all routes + DB)
├── .env                     # ⚠️ Your secrets — never commit this!
├── .env.example             # Safe template showing required variables
├── .gitignore               # Excludes node_modules, .env, etc.
├── package.json
└── README.md
```

---

## ⚙️ Setup Instructions

### Step 1 — Install Dependencies

```bash
npm install
```

### Step 2 — Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
copy .env.example .env
```

Edit `.env`:

```env
PORT=3000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/eventease
ADMIN_PASSWORD=choose_a_strong_password
SESSION_SECRET=a_very_long_random_string_here
```

### Step 3 — Start the Server

```bash
node server.js
```

Or with auto-reload (install nodemon first: `npm install -g nodemon`):

```bash
nodemon server.js
```

### Step 4 — Open in Browser

- **Student page:** http://localhost:3000
- **Admin dashboard:** http://localhost:3000/admin.html

---

## 🌐 Configuring MongoDB Atlas (Free Cloud Database)

1. Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas) and sign up free.
2. Create a new **Free Cluster** (M0 tier).
3. In **Database Access**, create a user with a username and password.
4. In **Network Access**, add `0.0.0.0/0` (allow all) for development.
5. Click **Connect → Drivers** and copy the connection string.
6. Replace `<username>` and `<password>` in the string.
7. Set it as `MONGO_URI` in your `.env` file.

**Example connection string:**
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/eventease?retryWrites=true&w=majority
```

---

## 🔌 API Reference

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| `GET`  | `/api/events` | None | Get all events |
| `POST` | `/api/registrations` | None | Register a student |
| `GET`  | `/api/registrations` | Admin | Get all registrations |
| `POST` | `/api/admin/login` | None | Admin login |
| `POST` | `/api/admin/logout` | None | Admin logout |
| `GET`  | `/api/admin/stats` | Admin | Get registration statistics |
| `GET`  | `/api/health` | None | Server health check |

---

## 🧪 Testing the API

You can test using PowerShell or any REST client (Postman, Thunder Client):

```powershell
# 1. Health check
Invoke-RestMethod http://localhost:3000/api/health

# 2. Get all events
Invoke-RestMethod http://localhost:3000/api/events

# 3. Register a student
$body = @{ studentName="Priya Sharma"; email="priya@college.edu"; department="Computer Science"; academicYear="2nd Year"; eventId="evt001" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri http://localhost:3000/api/registrations -Body $body -ContentType "application/json"

# 4. Try duplicate (should return 409 Conflict)
Invoke-RestMethod -Method POST -Uri http://localhost:3000/api/registrations -Body $body -ContentType "application/json"

# 5. Try unauthenticated admin access (should return 401)
Invoke-RestMethod http://localhost:3000/api/registrations

# 6. Admin login
$login = @{ password="your_admin_password" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri http://localhost:3000/api/admin/login -Body $login -ContentType "application/json" -SessionVariable adminSession

# 7. Get stats (authenticated)
Invoke-RestMethod -Uri http://localhost:3000/api/admin/stats -WebSession $adminSession
```

---

## 🔐 Security Notes

| Feature | Implementation |
|---|---|
| Email normalisation | Stored lowercase; `mongoose` `lowercase: true` |
| Duplicate prevention | MongoDB compound unique index `{email, eventId}` |
| Admin protection | `express-session` + `connect-mongo` store |
| Session cookie | `httpOnly: true`, `sameSite: lax` |
| No secrets in code | All secrets in `.env` via `dotenv` |
| Schema validation | Mongoose validators + server-side checks |
| Error responses | Generic messages, no stack traces exposed |

> ⚠️ **Admin authentication is educational-grade only.** A production system would use bcrypt-hashed passwords, proper user accounts, and HTTPS.

---

## 🎤 College Viva Explanation

**Q: What is EventEase?**
> EventEase is a full-stack web application that lets college students browse upcoming events and register online. It has a public-facing student page and a password-protected admin dashboard.

**Q: What technologies did you use?**
> Frontend: HTML5, CSS3, Vanilla JavaScript. Backend: Node.js with Express.js. Database: MongoDB with Mongoose ORM. Sessions: express-session with connect-mongo.

**Q: How does registration work?**
> The student clicks "Register" on an event card → a modal opens → they fill the form → JavaScript validates it → a POST request goes to `/api/registrations` → the server validates again → saves to MongoDB → returns a success message.

**Q: How do you prevent duplicate registrations?**
> We create a compound unique index on `{ email, eventId }` in MongoDB. Even if two requests arrive at the same time, the database itself enforces uniqueness and returns an error code `11000`, which we catch and return as a user-friendly message.

**Q: How is the admin protected?**
> The admin submits a password → the server compares it to the `ADMIN_PASSWORD` in `.env` → if correct, sets `req.session.isAdmin = true` → subsequent requests carry a session cookie → the `adminAuth` middleware checks `req.session.isAdmin` before allowing access to protected routes.

**Q: Where are credentials stored?**
> In a `.env` file that is never committed to Git (listed in `.gitignore`). The server loads them with `require("dotenv").config()`.

---

## 📋 Events Included

| ID | Title | Category | Date |
|---|---|---|---|
| evt001 | TechFest 2026 | Technology | Nov 15, 2026 |
| evt002 | AI & ML Workshop | Workshop | Nov 22, 2026 |
| evt003 | Coding Competition | Competition | Dec 5, 2026 |
| evt004 | Entrepreneurship Seminar | Seminar | Dec 10, 2026 |
| evt005 | Cultural Night | Cultural | Dec 20, 2026 |
| evt006 | Web Development Workshop | Workshop | Jan 8, 2027 |

---

## 🚀 Running Commands Summary

```bash
# Install packages
npm install

# Start server
node server.js

# Start with auto-reload (requires nodemon)
nodemon server.js
```

---

*Built as a college mini-project. Not intended for production use.*
