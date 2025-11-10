const db = require('../init');
const cron = require('node-cron');

// Send reminders 24 hours before event
const scheduleReminders = () => {
  // Run every hour
  cron.schedule('0 * * * *', () => {
    const dbInstance = db.getDb();
    
    // Find events happening in 24 hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    dbInstance.all(
      `SELECT e.id, e.title, e.date, e.time, r.user_id, u.email, u.name
       FROM events e
       JOIN registrations r ON e.id = r.event_id
       JOIN users u ON r.user_id = u.id
       WHERE e.date = ? AND e.status = 'active' AND r.checked_in = 0
       AND NOT EXISTS (
         SELECT 1 FROM notifications n 
         WHERE n.user_id = r.user_id 
         AND n.event_id = e.id 
         AND n.type = 'reminder'
       )`,
      [tomorrowStr],
      (err, rows) => {
        if (err) {
          console.error('Error checking reminders:', err);
          return;
        }
        
        rows.forEach(row => {
          // Create reminder notification
          dbInstance.run(
            'INSERT INTO notifications (user_id, event_id, message, type) VALUES (?, ?, ?, ?)',
            [
              row.user_id,
              row.id,
              `Reminder: ${row.title} is tomorrow at ${row.time}. Don't forget to attend!`,
              'reminder'
            ],
            (err) => {
              if (err) {
                console.error('Error creating reminder:', err);
              } else {
                console.log(`Reminder sent to user ${row.user_id} for event ${row.title}`);
              }
            }
          );
        });
      }
    );
  });
};

// Send reminders 1 hour before event
const scheduleHourlyReminders = () => {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    const dbInstance = db.getDb();
    
    // Find events happening in the next hour
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    const todayStr = now.toISOString().split('T')[0];
    const hourLaterStr = oneHourLater.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const nextHour = oneHourLater.getHours();
    
    let query, params;
    if (todayStr === hourLaterStr) {
      // Same day, check time range
      query = `SELECT e.id, e.title, e.date, e.time, r.user_id, u.email, u.name
               FROM events e
               JOIN registrations r ON e.id = r.event_id
               JOIN users u ON r.user_id = u.id
               WHERE e.date = ? AND e.status = 'active' AND r.checked_in = 0
               AND CAST(SUBSTR(e.time, 1, 2) AS INTEGER) BETWEEN ? AND ?
               AND NOT EXISTS (
                 SELECT 1 FROM notifications n 
                 WHERE n.user_id = r.user_id 
                 AND n.event_id = e.id 
                 AND n.type = 'reminder_hour'
               )`;
      params = [todayStr, currentHour, nextHour];
    } else {
      // Different day, just check if it's today and hour matches
      query = `SELECT e.id, e.title, e.date, e.time, r.user_id, u.email, u.name
               FROM events e
               JOIN registrations r ON e.id = r.event_id
               JOIN users u ON r.user_id = u.id
               WHERE e.date = ? AND e.status = 'active' AND r.checked_in = 0
               AND CAST(SUBSTR(e.time, 1, 2) AS INTEGER) = ?
               AND NOT EXISTS (
                 SELECT 1 FROM notifications n 
                 WHERE n.user_id = r.user_id 
                 AND n.event_id = e.id 
                 AND n.type = 'reminder_hour'
               )`;
      params = [todayStr, nextHour];
    }
    
    dbInstance.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error checking hourly reminders:', err);
        return;
      }
      
      rows.forEach(row => {
        dbInstance.run(
          'INSERT INTO notifications (user_id, event_id, message, type) VALUES (?, ?, ?, ?)',
          [
            row.user_id,
            row.id,
            `Reminder: ${row.title} starts in 1 hour at ${row.time}!`,
            'reminder_hour'
          ],
          (err) => {
            if (err) {
              console.error('Error creating hourly reminder:', err);
            } else {
              console.log(`Hourly reminder sent to user ${row.user_id} for event ${row.title}`);
            }
          }
        );
      });
    });
  });
};

const init = () => {
  scheduleReminders();
  scheduleHourlyReminders();
  console.log('Reminder service initialized');
};

module.exports = { init };

