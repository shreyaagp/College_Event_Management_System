import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

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

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!["student", "organiser"].includes(role)) {
      setError("Please select a role first.");
      return;
    }

    if (!formData.email.endsWith("@nie.ac.in")) {
      setError("Email must end with @nie.ac.in");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const result = await register({ ...formData, role });
    if (result.success) navigate("/login");
    else setError(result.error || "Registration failed");
  };

  // If no role selected yet
  if (!role) {
    return (
      <div className="container" style={{ maxWidth: "400px", marginTop: "3rem" }}>
        <div className="card" style={{ textAlign: "center" }}>
          <h2>Select Role</h2>
          <p>Choose how you want to register</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <button className="btn btn-primary" onClick={() => setRole("student")}>
              Register as Student
            </button>
            <button className="btn btn-primary" onClick={() => setRole("organiser")}>
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
              onClick={() => navigate("/login")}
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Registration form for both roles
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
                <select name="department" value={formData.department} onChange={handleChange} required>
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

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>

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
              onClick={() => navigate("/login")}
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
