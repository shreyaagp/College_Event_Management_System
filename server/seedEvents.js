// server/seedEvents.js
const db = require('./init');

// Seed fake events
function seedEvents() {
  const dbInstance = db.getDb();
  
  const fakeEvents = [
    {
      title: 'Tech Innovation Summit 2024',
      description: 'Join us for an exciting tech summit featuring talks on AI, Machine Learning, and emerging technologies. Network with industry leaders and students.',
      department: 'Computer Science',
      date: '2025-12-20',
      time: '10:00',
      location: 'Main Auditorium',
      max_participants: 200,
      created_by: 1,
      image: null
    },
    {
      title: 'Hackathon Challenge',
      description: '24-hour coding challenge. Build innovative solutions and win exciting prizes. Food and refreshments provided.',
      department: 'Information Science',
      date: '2025-12-22',
      time: '09:00',
      location: 'Computer Lab 1',
      max_participants: 50,
      created_by: 1,
      image: null
    },
    {
      title: 'Career Development Workshop',
      description: 'Learn resume building, interview skills, and career planning from industry experts.',
      department: 'Computer Science',
      date: '2025-12-18',
      time: '14:00',
      location: 'Conference Hall',
      max_participants: 100,
      created_by: 1,
      image: null
    },
    {
      title: 'Cultural Fest 2024',
      description: 'Annual cultural festival with music, dance, food stalls, and competitions. Open to all students.',
      department: 'Electronics and Communication',
      date: '2025-12-25',
      time: '16:00',
      location: 'College Grounds',
      max_participants: 500,
      created_by: 1,
      image: null
    },
    {
      title: 'Robotics Workshop',
      description: 'Hands-on workshop on building and programming robots. All materials provided.',
      department: 'Electronics and Communication',
      date: '2024-12-19',
      time: '11:00',
      location: 'Electronics Lab',
      max_participants: 30,
      created_by: 1,
      image: null
    }
  ];

  fakeEvents.forEach(event => {
    dbInstance.run(
      `INSERT OR IGNORE INTO events (title, description, department, date, time, location, max_participants, created_by, image, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [event.title, event.description, event.department, event.date, event.time, event.location, event.max_participants, event.created_by, event.image, 'active'],
      (err) => {
        if (err) console.error('Error seeding event:', err);
        else console.log(`✅ Seeded event: ${event.title}`);
      }
    );
  });
}

// Run if called directly
if (require.main === module) {
  seedEvents();
}

module.exports = { seedEvents };