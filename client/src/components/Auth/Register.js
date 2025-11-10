import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/api";

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register } = useAuth();

  const [view, setView] = useState("login"); // 'login' | 'roleSelect' | 'student' | 'organiser'
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    department: "",
    usn: "",
    semester: "",
    organisation: "",
  });

  // Handle Google OAuth registration
  useEffect(() => {
    const isGoogle = searchParams.get('google');
    const profileParam = searchParams.get('profile');
    
    if (isGoogle === 'true' && profileParam) {
      try {
        const profile = JSON.parse(decodeURIComponent(profileParam));
        setFormData(prev => ({
          ...prev,
          email: profile.email || "",
          name: profile.name || "",
        }));
        setView("roleSelect");
      } catch (err) {
        console.error("Error parsing Google profile:", err);
        setError("Failed to load Google profile data");
      }
    }
  }, [searchParams]);

  const departments = [
    "Computer Science",
    "Information Science",
    "Electronics and Communication",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5001/api/auth/google';
  };

  //  LOGIN HANDLER
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter email and password");
      return;
    }

    const result = await login(formData.email, formData.password);
    if (result.success) navigate("/");
    else setError(result.error || "Invalid credentials");
  };

  // REGISTER HANDLER
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const userRole = role || view;
    const isGoogle = searchParams.get('google') === 'true';

    if (!["student", "organiser"].includes(userRole)) {
      setError("Role must be student or organiser");
      return;
    }

    if (!formData.email.endsWith("@nie.ac.in")) {
      setError("Email must end with @nie.ac.in");
      return;
    }

    // For Google OAuth, password is not required
    if (!isGoogle) {
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    // Use Google OAuth registration endpoint if coming from Google
    if (isGoogle) {
      try {
        const profileParam = searchParams.get('profile');
        const profile = profileParam ? JSON.parse(decodeURIComponent(profileParam)) : {};
        
        const res = await API.post('/auth/google/register', {
          email: formData.email,
          name: formData.name,
          googleId: profile.googleId,
          role: userRole,
          department: formData.department,
          usn: formData.usn,
          semester: formData.semester,
        });

        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate(userRole === 'organiser' ? '/organiser' : '/');
      } catch (err) {
        setError(err.response?.data?.error || "Registration failed");
      }
    } else {
      const result = await register({
        ...formData,
        role: userRole,
        confirmPassword: formData.confirmPassword,
      });

      if (result.success) navigate("/");
      else setError(result.error || "Registration failed");
    }
  };

  // LOGIN VIEW
  if (view === "login") {
    return (
      <div className="container" style={{ maxWidth: "400px", marginTop: "3rem" }}>
        <div className="card">
          <h2 style={{ textAlign: "center" }}>Login</h2>
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
              Login
            </button>
          </form>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
              <span style={{ padding: '0 1rem', color: '#666' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
            </div>
            
            <button
              onClick={handleGoogleLogin}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <g fill="none" fillRule="evenodd">
                  <path d="M17.64 9.205c0-.637-.057-1.251-.164-1.841H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.55 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </g>
              </svg>
              Sign in with Google
            </button>
          </div>

          <p style={{ marginTop: "1rem", textAlign: "center" }}>
            New user?{" "}
            <button
              style={{
                background: "none",
                border: "none",
                color: "#007bff",
                textDecoration: "underline",
                cursor: "pointer",
              }}
              onClick={() => setView("roleSelect")}
            >
              Register now
            </button>
          </p>
        </div>
      </div>
    );
  }

  //  ROLE SELECTION VIEW
  if (view === "roleSelect") {
    return (
      <div className="container" style={{ maxWidth: "400px", marginTop: "3rem" }}>
        <div className="card" style={{ textAlign: "center" }}>
          <h2>Select Role</h2>
          <p>Choose how you want to register</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                setRole("student");
                setView("student");
              }}
            >
              Register as Student
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setRole("organiser");
                setView("organiser");
              }}
            >
              Register as Organiser
            </button>
          </div>
          <p style={{ marginTop: "1rem" }}>
            Already have an account?{" "}
            <button
              style={{
                background: "none",
                border: "none",
                color: "#007bff",
                textDecoration: "underline",
                cursor: "pointer",
              }}
              onClick={() => setView("login")}
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    );
  }

  //  STUDENT OR ORGANISER REGISTRATION FORM
  return (
    <div className="container" style={{ maxWidth: "400px", marginTop: "3rem" }}>
      <div className="card">
        <h2 style={{ textAlign: "center" }}>
          {role === "student" ? "Student Registration" : "Organiser Registration"}
        </h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Email (College Email Only)</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="student@nie.ac.in"
              required
            />
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          {role === "student" && (
            <>
              <div className="form-group">
                <label>USN</label>
                <input type="text" name="usn" value={formData.usn} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Department</label>
                <select name="department" value={formData.department} onChange={handleChange} required>
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Semester</label>
                <input
                  type="number"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  required
                  min="1"
                  max="8"
                />
              </div>
            </>
          )}

{role === "organiser" && (
  <>
    <div className="form-group">
      <label>Organisation Name</label>
      <input
        type="text"
        name="organisation"
        value={formData.organisation}
        onChange={handleChange}
        required
      />
    </div>

    <div className="form-group">
      <label>Department</label>
      <select
        name="department"
        value={formData.department}
        onChange={handleChange}
        required
      >
        <option value="">Select Department</option>
        {departments.map((dept) => (
          <option key={dept} value={dept}>
            {dept}
          </option>
        ))}
      </select>
    </div>
  </>
)}


          {/*  PASSWORD FIELD - Only show if not Google OAuth */}
          {!searchParams.get('google') && (
            <>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {/*  CONFIRM PASSWORD FIELD */}
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Register
          </button>

          <p style={{ marginTop: "1rem", textAlign: "center" }}>
            Already have an account?{" "}
            <button
              style={{
                background: "none",
                border: "none",
                color: "#007bff",
                textDecoration: "underline",
                cursor: "pointer",
              }}
              onClick={() => setView("login")}
            >
              Login here
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
