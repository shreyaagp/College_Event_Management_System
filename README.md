# College Event Management System

A comprehensive event management system for colleges with QR code attendance, voting on proposed events, and Google OAuth authentication.

## Features

- ✅ **Google OAuth Authentication** - Sign up and sign in with Google
- ✅ **QR Code Attendance** - Students get QR codes, organizers scan them to mark attendance
- ✅ **Event Proposals & Voting** - Organizers propose events, students vote on them
- ✅ **Role-based Access** - Separate dashboards for students and organizers
- ✅ **Event Management** - Create, manage, and track events
- ✅ **Feedback System** - Collect feedback from participants

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Cloud Console account (for OAuth)

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Configure OAuth consent screen:
   - User Type: External
   - Application name: College Event Management
   - Authorized redirect URIs: `http://localhost:5001/api/auth/google/callback`
6. Copy the Client ID and Client Secret

### 3. Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=5001
JWT_SECRET=your-secret-key-change-in-production
SESSION_SECRET=your-session-secret-change-in-production
CLIENT_URL=http://localhost:3001
COLLEGE_EMAIL_DOMAIN=@nie.ac.in

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4. Run the Application

```bash
# From root directory
npm run dev

# Or run separately:
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5001

## Usage

### For Students

1. **Register/Login**: Use your college email (@nie.ac.in) or Google OAuth
2. **Browse Events**: View all available events
3. **Register for Events**: Register for events you want to attend
4. **Get QR Code**: Each registration generates a unique QR code
5. **Vote on Proposals**: Vote on events proposed by organizers
6. **View Registrations**: See all your registrations and QR codes

### For Organizers

1. **Register/Login**: Use your college email or Google OAuth
2. **Create Events**: Create new events with details
3. **Manage Events**: View and manage your events
4. **Scan QR Codes**: Scan student QR codes to mark attendance
5. **Propose Events**: Propose new events for student voting
6. **View Votes**: See vote counts on proposed events
7. **View Participants**: See list of registered participants

## QR Code Flow

1. Student registers for an event → Gets a unique QR code
2. Student shows QR code at event
3. Organizer scans QR code using the scan page
4. System marks student as attended
5. Attendance is updated in real-time

## Voting System

1. Organizers propose events with title, description, and department
2. Students can upvote or downvote proposed events
3. Organizers can see vote counts to decide which events to create
4. Students can change or remove their votes

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/verify-token` - Verify JWT token

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create event (organizer only)
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event (organizer only)
- `DELETE /api/events/:id` - Delete event (organizer only)

### Registrations
- `POST /api/registrations` - Register for event (student only)
- `GET /api/registrations/my-registrations` - Get user's registrations
- `POST /api/registrations/checkin` - Check in using QR code
- `DELETE /api/registrations/:id` - Cancel registration

### QR Codes
- `GET /api/qrcode/:registration_id` - Get QR code for registration

### Voting
- `POST /api/votes/propose` - Propose event (organizer only)
- `GET /api/votes/proposed` - Get all proposed events
- `POST /api/votes/vote` - Vote on proposed event (student only)
- `GET /api/votes/my-vote/:proposed_event_id` - Get user's vote

### Scanning
- `POST /api/scan-qr` - Scan QR code and mark attendance (organizer only)

## Database Schema

The system uses SQLite database with the following tables:
- `users` - User accounts
- `events` - Event information
- `registrations` - Event registrations with QR codes
- `proposed_events` - Proposed events for voting
- `votes` - Student votes on proposed events
- `notifications` - User notifications

## Security Notes

- All passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Only college email addresses are allowed
- Role-based access control for all routes
- QR codes are unique UUIDs per registration

## Troubleshooting

### Google OAuth not working
- Check that redirect URI matches exactly in Google Console
- Verify CLIENT_ID and CLIENT_SECRET are correct
- Ensure Google+ API is enabled

### QR code scanning issues
- Make sure camera permissions are granted
- Check that QR code contains valid registration data
- Verify organizer has permission for the event

### Database errors
- Delete `server/events.db` to reset database
- Restart the server to reinitialize tables

## License

ISC
