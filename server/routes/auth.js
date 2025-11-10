const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { getDb } = require("../init");
const { validateCollegeEmail, authenticate } = require("../middleware/auth");

const router = express.Router();
const db = getDb();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Store password reset tokens temporarily in memory
const passwordResetTokens = new Map();

// =================== GOOGLE OAUTH SETUP ===================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5001/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0]?.value;
        if (!email) return done(new Error("No email found in Google profile"));

        if (!validateCollegeEmail(email)) {
          return done(null, false, { message: "Only college email addresses are allowed" });
        }

        db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
          if (err) return done(err);
          if (user) return done(null, user);
          return done(null, false, {
            message: "Please complete registration first",
            profile: {
              email,
              name: profile.displayName,
              googleId: profile.id,
              picture: profile.photos[0]?.value,
            },
          });
        });
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => done(err, user));
});

// =================== GOOGLE OAUTH ROUTES ===================
// Kick off Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth callback
router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err) return next(err);

    // Existing user -> issue JWT and redirect back to client
    if (user) {
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      const userPayload = { id: user.id, email: user.email, role: user.role, name: user.name, department: user.department, usn: user.usn, semester: user.semester };
      const redirectUrl = `${CLIENT_URL}/auth/google/callback?token=${encodeURIComponent(
        token
      )}&user=${encodeURIComponent(JSON.stringify(userPayload))}`;
      return res.redirect(redirectUrl);
    }

    // Not registered yet -> redirect to registration with prefilled profile
    if (info && info.profile) {
      const redirectUrl = `${CLIENT_URL}/register?google=true&profile=${encodeURIComponent(
        JSON.stringify(info.profile)
      )}`;
      return res.redirect(redirectUrl);
    }

    // Fallback
    return res.redirect(`${CLIENT_URL}/login?error=google_auth_failed`);
  })(req, res, next);
});

// Complete registration for Google users
router.post("/google/register", (req, res) => {
  const { role, name, email, googleId, department, usn, semester } = req.body;

  if (!role || !["student", "organiser"].includes(role)) {
    return res.status(400).json({ error: "Role must be student or organiser" });
  }
  if (!email || !name) {
    return res.status(400).json({ error: "Name and email are required" });
  }
  if (!validateCollegeEmail(email)) {
    const domain = process.env.COLLEGE_EMAIL_DOMAIN || "@nie.ac.in";
    return res.status(400).json({ error: `Only ${domain} email addresses are allowed` });
  }
  if (role === "organiser" && !department) {
    return res.status(400).json({ error: "Department is required for organisers" });
  }
  if (role === "student" && (!usn || !semester)) {
    return res.status(400).json({ error: "USN and semester are required for students" });
  }

  // Create user without password; password column can be NULL
  const values = [role, name, email, null, department || null, usn || null, semester || null];

  db.run(
    "INSERT INTO users (role, name, email, password, department, usn, semester) VALUES (?, ?, ?, ?, ?, ?, ?)",
    values,
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) return res.status(400).json({ error: "Email already registered" });
        return res.status(500).json({ error: err.message });
      }
      const token = jwt.sign({ id: this.lastID, email, role }, JWT_SECRET, { expiresIn: "7d" });
      res.status(201).json({
        message: "Registration successful 🎉",
        token,
        user: { id: this.lastID, email, role, name, department, usn, semester },
      });
    }
  );
});

// =================== REGISTER ===================
router.post("/register", async (req, res) => {
  try {
    const { role, name, email, password, confirmPassword, department, usn, semester } = req.body;

    if (!role || !["student", "organiser"].includes(role))
      return res.status(400).json({ error: "Role must be student or organiser" });

    if (!email || !password || !confirmPassword)
      return res.status(400).json({ error: "Email, password, and confirm password are required" });

    if (password !== confirmPassword)
      return res.status(400).json({ error: "Passwords do not match" });

    if (!validateCollegeEmail(email)) {
      const domain = process.env.COLLEGE_EMAIL_DOMAIN || "@nie.ac.in";
      return res.status(400).json({ error: `Only ${domain} email addresses are allowed` });
    }

    if (role === "organiser" && (!department || !name))
      return res.status(400).json({ error: "Name and department are required for organisers" });

    if (role === "student" && (!name || !usn || !semester))
      return res.status(400).json({ error: "Name, USN, and semester are required for students" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const values = [role, name, email, hashedPassword, department || null, usn || null, semester || null];

    db.run(
      "INSERT INTO users (role, name, email, password, department, usn, semester) VALUES (?, ?, ?, ?, ?, ?, ?)",
      values,
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE")) return res.status(400).json({ error: "Email already registered" });
          return res.status(500).json({ error: err.message });
        }

        const token = jwt.sign({ id: this.lastID, email, role }, JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({
          message: "Registration successful 🎉",
          token,
          user: { id: this.lastID, email, role, name, department, usn, semester },
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =================== LOGIN ===================
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!user) return res.status(400).json({ error: "User not found" });

    if (!user.password) return res.status(400).json({ error: "This account uses Google Sign-In only" });

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    const { password: _, ...userData } = user;
    res.json({ user: userData, token });
  });
});

// =================== FORGOT PASSWORD (with email) ===================
router.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  db.get("SELECT id FROM users WHERE email = ?", [email], (err, user) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (!user) return res.status(404).json({ message: "No account found with that email" });

    const token = crypto.randomBytes(32).toString("hex");
    passwordResetTokens.set(token, { userId: user.id, expires: Date.now() + 15 * 60 * 1000 });
    const resetLink = `${CLIENT_URL}/reset-password/${token}`;

    // Setup Gmail transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"College Events" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family:sans-serif;line-height:1.5">
          <h2>Password Reset Request</h2>
          <p>Click the button below to reset your password. This link expires in 15 minutes.</p>
          <a href="${resetLink}" style="display:inline-block;padding:10px 20px;background:#4CAF50;color:white;text-decoration:none;border-radius:5px;">Reset Password</a>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("❌ Email send error:", error);
        return res.status(500).json({ message: "Failed to send email" });
      }
      console.log("✅ Password reset email sent:", info.response);
      res.json({ message: "Reset link sent to your email" });
    });
  });
});

// =================== RESET PASSWORD ===================
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  const data = passwordResetTokens.get(token);
  if (!data) return res.status(400).json({ message: "Invalid or expired token" });

  if (Date.now() > data.expires) {
    passwordResetTokens.delete(token);
    return res.status(400).json({ message: "Token expired" });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  db.run("UPDATE users SET password = ? WHERE id = ?", [hashed, data.userId], (err) => {
    if (err) return res.status(500).json({ message: "Error updating password" });
    passwordResetTokens.delete(token);
    res.json({ message: "Password reset successful ✅" });
  });
});

// =================== VERIFY TOKEN (for session restore) ===================
router.get("/verify-token", authenticate, (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router;
