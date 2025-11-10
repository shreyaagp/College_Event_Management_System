import React, { useEffect } from "react";

import "./About.css";

const About = () => {
  useEffect(() => {
    document.title = "About - College Event Management";
  }, []);

  const toggleFeature = (e) => {
    e.currentTarget.classList.toggle("active");
  };

  const scrollToEvents = () => {
    window.location.href = "/events";
  };

  return (
    <div className="about-page">
      

      <section className="hero" id="about">
        <div className="hero-content">
          <h1>About Our College Event Management System</h1>
          <p>
            The College Event Management System is a one-stop digital platform
            designed to simplify the way students and organisers plan, manage,
            and participate in college events. From registration to feedback —
            everything happens seamlessly online, ensuring a smooth and
            transparent event experience for everyone.
          </p>
          <button className="btn-primary" onClick={scrollToEvents}>
            Explore Events
          </button>
        </div>
      </section>

      <div className="container">
        <h2>Key Features</h2>
        <ul className="feature-list">
          <li onClick={toggleFeature}>
            <span className="feature-icon">📝</span>
            Digital Event Registration
            <div className="accordion-content">
              Register instantly for any event with a user-friendly form and
              receive confirmation emails.
            </div>
          </li>

          <li onClick={toggleFeature}>
            <span className="feature-icon">📅</span>
            Centralized Event Calendar
            <div className="accordion-content">
              View all upcoming events in a clear calendar view, so you never
              miss out.
            </div>
          </li>

          <li onClick={toggleFeature}>
            <span className="feature-icon">🔒</span>
            Role-based Access
            <div className="accordion-content">
              Different privileges and views for students, faculty, and admins
              ensure secure access.
            </div>
          </li>

          <li onClick={toggleFeature}>
            <span className="feature-icon">📱</span>
            QR Code Entry System
            <div className="accordion-content">
              Easy check-ins via QR scanning to enhance convenience and reduce
              wait times.
            </div>
          </li>

          <li onClick={toggleFeature}>
            <span className="feature-icon">🗳️</span>
            Event Voting
            <div className="accordion-content">
              Vote on event ideas and favorites to shape your college’s event
              calendar.
            </div>
          </li>

          <li onClick={toggleFeature}>
            <span className="feature-icon">💬</span>
            Feedback & Reviews
            <div className="accordion-content">
              Leave comments and reviews to help improve future events and
              experiences.
            </div>
          </li>
        </ul>
      </div>

      <footer>
        “Organize smart. Participate better. Celebrate together.” ✨
      </footer>
    </div>
  );
};

export default About;
