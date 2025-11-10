import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [department, setDepartment] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // 'desc' = recent to oldest
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const searchRef = useRef(null);

  const departments = [
    "Computer Science",
    "Information Science",
    "Electronics and Communication",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
  ];

  // Debounce search input
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);

    searchRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500); // 500ms debounce

    return () => clearTimeout(searchRef.current);
  }, [searchTerm]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await API.get("/events", {
        params: {
          department: department || undefined,
          sort: sortOrder,
          search: debouncedSearch || undefined,
        },
      });
      setEvents(res.data?.data || []);
    } catch (err) {
      setError("Failed to load events. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Refetch whenever filters, sort, or debounced search changes
  useEffect(() => {
    fetchEvents();
  }, [department, sortOrder, debouncedSearch]);

  if (loading) return <p>Loading events...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="container" style={{ marginTop: "2rem" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>All Events</h2>

      {/* FILTER, SORT & SEARCH */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}>
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: "5px", border: "1px solid #ccc", minWidth: "200px" }}
        />

        <select value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="desc">Recent to Oldest</option>
          <option value="asc">Oldest to Recent</option>
        </select>
      </div>

      {events.length === 0 ? (
        <p style={{ textAlign: "center" }}>No events found.</p>
      ) : (
        <div
          className="events-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {events.map((event) => (
            <div
              key={event.id}
              className="event-card"
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "0",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                overflow: "hidden",
              }}
            >
              {event.image && (
                <img
                  src={`http://localhost:5001${event.image}`}
                  alt={event.title}
                  style={{
                    width: "100%",
                    height: "200px",
                    objectFit: "cover",
                    display: "block",
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              )}
              <div style={{ padding: "1.5rem" }}>
                <span
                  className="department"
                  style={{
                    display: "inline-block",
                    padding: "0.25rem 0.75rem",
                    background: "#007bff",
                    color: "white",
                    borderRadius: "4px",
                    fontSize: "0.85rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  {event.department}
                </span>
                <h3 style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>{event.title}</h3>
                {event.description && (
                  <p style={{ color: "#666", marginBottom: "1rem", fontSize: "0.9rem" }}>
                    {event.description.substring(0, 100)}
                    {event.description.length > 100 ? "..." : ""}
                  </p>
                )}
                <p style={{ marginBottom: "0.5rem" }}>
                  <strong>📅 Date:</strong> {new Date(event.date).toLocaleDateString()}
                </p>
                <p style={{ marginBottom: "0.5rem" }}>
                  <strong>🕐 Time:</strong> {event.time}
                </p>
                {event.location && (
                  <p style={{ marginBottom: "0.5rem" }}>
                    <strong>📍 Location:</strong> {event.location}
                  </p>
                )}
                <p style={{ marginBottom: "1rem", color: "#666" }}>
                  <strong>👥 Participants:</strong> {event.registered_count || 0}
                  {event.max_participants && ` / ${event.max_participants} max`}
                </p>
                <Link to={`/events/${event.id}`}>
                  <button className="btn btn-primary" style={{ width: "100%" }}>
                    View Details
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;