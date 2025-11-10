import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const CalendarView = () => {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayEvents, setDayEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterDayEvents();
  }, [selectedDate, events]);

  //   Fetch events from backend
  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/events?status=active');
      setEvents(response.data.data || response.data); // Adjust for your API shape
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  //  Filter events by selected date
  const filterDayEvents = () => {
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayEventsFiltered = events.filter(event => event.date === selectedDateStr);
    setDayEvents(dayEventsFiltered);
  };

  //  Add indicator under days that have events
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = format(date, 'yyyy-MM-dd');
      const eventCount = events.filter(e => e.date === dateStr).length;
      if (eventCount > 0) {
        return (
          <div style={{
            position: 'absolute',
            bottom: '2px',
            width: '100%',
            textAlign: 'center',
            fontSize: '10px',
            color: '#667eea',
            fontWeight: 'bold'
          }}>
            {eventCount} event{eventCount > 1 ? 's' : ''}
          </div>
        );
      }
    }
    return null;
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = format(date, 'yyyy-MM-dd');
      const hasEvents = events.some(e => e.date === dateStr);
      if (hasEvents) return 'has-events';
    }
    return null;
  };

  if (loading) return <div className="loading">Loading calendar...</div>;

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>📅 Event Calendar</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Calendar Section */}
        <div className="calendar-container">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileContent={tileContent}
            tileClassName={tileClassName}
          />
          <style>{`
            .react-calendar {
              width: 100%;
              border: none;
              font-family: inherit;
            }
            .react-calendar__tile.has-events {
              background-color: #f0f7ff;
              border-radius: 8px;
            }
            .react-calendar__tile--active {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .react-calendar__tile--active:enabled:hover {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
          `}</style>
        </div>

        {/* Events Section */}
        <div>
          <h2 style={{ marginBottom: '1rem' }}>
            Events on {format(selectedDate, 'MMMM dd, yyyy')}
          </h2>

          {dayEvents.length === 0 ? (
            <div className="card">
              <p>No events scheduled for this date.</p>
            </div>
          ) : (
            <div>
              {dayEvents.map(event => (
                <div
                  key={event.id}
                  className="event-card"
                  style={{
                    marginBottom: '1.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {/*  Event Image */}
                  {event.image && (
                    <img
                      src={`http://localhost:5001${event.image}`}
                      alt={event.title}
                      style={{
                        width: '100%',
                        height: '180px',
                        objectFit: 'cover'
                      }}
                    />
                  )}

                  <div style={{ padding: '1rem' }}>
                    <span
                      className="department"
                      style={{
                        display: 'inline-block',
                        fontSize: '0.85rem',
                        background: '#eef2ff',
                        color: '#4c51bf',
                        borderRadius: '5px',
                        padding: '0.2rem 0.5rem',
                        marginBottom: '0.5rem'
                      }}
                    >
                      {event.department}
                    </span>
                    <h3>{event.title}</h3>
                    <div className="date-time">🕐 {event.time}</div>
                    {event.location && (
                      <div className="location">📍 {event.location}</div>
                    )}
                    <div
                      style={{
                        marginTop: '0.5rem',
                        fontSize: '0.9rem',
                        color: '#666'
                      }}
                    >
                      👥 {event.registered_count || 0} registered
                    </div>
                    <Link to={`/events/${event.id}`}>
                      <button
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          marginTop: '1rem',
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          padding: '0.6rem',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        View Details
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
