# 🎓 EduHub - Virtual Classroom & Meeting Hub

A complete Learning Management System (LMS) built with the MERN stack featuring real-time video meetings, interactive classrooms, assignments, and role-based dashboards.

## ✨ Features

### 🎯 Core Features
- **Role-Based Authentication** - Student, Teacher, and Admin roles with JWT
- **Real-Time Communication** - Socket.io powered chat and notifications
- **Live Meeting Rooms** - Virtual classrooms with host controls
- **Class Management** - Create, join, and manage classes
- **Assignment System** - Create, submit, and grade assignments
- **XP/Level System** - Gamified learning progress tracking
- **Attendance Tracking** - Automatic attendance in meetings
- **Analytics Dashboard** - Performance metrics and insights

### 👨‍🎓 Student Features
- Enroll in classes with class codes
- Join live meetings and virtual classrooms
- Submit assignments and view grades
- Real-time chat with teachers and peers
- Track progress with XP and levels
- View attendance and performance analytics
- Receive notifications for assignments, meetings, and grades

### 👨‍🏫 Teacher Features
- Create and manage classes
- Schedule and host live meetings
- Create assignments and quizzes
- Grade submissions (auto/manual)
- Post announcements and share materials
- Host controls (waiting room, remove users, disable chat)
- View class performance and analytics
- Manage attendance automatically

### 👨‍💼 Admin Features
- Manage all users (students, teachers, admins)
- Verify teacher accounts
- Monitor system analytics
- View usage reports and statistics
- Remove inappropriate content or users
- Access system logs

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - WebSocket server
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Cookie Parser** - Cookie handling

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd eduhub
```

### 2. Backend Setup
```bash
cd server
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# MONGODB_URI=mongodb://localhost:27017/lms
# JWT_SECRET=your_secret_key
# PORT=5000
# CLIENT_URL=http://localhost:5173

# Start the server
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install

# Create .env file
cp .env.example .env

# Edit .env
# VITE_API_URL=http://localhost:5000/api

# Start the development server
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## 🚀 Usage

### First Time Setup
1. Visit http://localhost:5173
2. Click "Get Started" or "Register"
3. Choose your role (Student, Teacher, or Admin)
4. Fill in registration details
5. Login and access your role-specific dashboard

### For Students
1. Join classes using class codes
2. View enrolled classes on dashboard
3. Attend scheduled meetings
4. Submit assignments before due dates
5. Track your XP and level progress

### For Teachers
1. Create classes from dashboard
2. Schedule meetings for your classes
3. Create assignments and quizzes
4. Host live meetings with full controls
5. Grade submissions and provide feedback
6. View class analytics

### For Admins
1. Access admin dashboard
2. Verify pending teacher accounts
3. Monitor system statistics
4. Manage users (view, verify, delete)
5. View system-wide analytics

## 🎨 UI/UX Features

- **Modern Design** - Clean, professional interface with Tailwind CSS
- **Smooth Animations** - Framer Motion powered transitions
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Dark/Light Theme** - Theme toggle support
- **Toast Notifications** - Real-time feedback for actions
- **Loading States** - Smooth loading indicators
- **Error Handling** - User-friendly error messages

## 🔐 Security Features

- JWT token-based authentication
- Secure HTTP-only cookies
- Password hashing with bcrypt
- Role-based access control
- Protected API routes
- Input validation
- XSS protection

## 📡 Real-Time Features

- Live chat in meetings
- Real-time notifications
- Instant meeting updates
- Hand raise and reactions
- Participant status updates
- Waiting room management
- Screen share indicators

## 🗂️ Project Structure

```
eduhub/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React Context (Auth, Notifications)
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utilities (API, Socket)
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── index.html
│   └── package.json
│
└── server/                # Node.js Backend
    ├── controllers/       # Route controllers
    ├── middleware/        # Auth & validation
    ├── models/            # Mongoose models
    ├── routes/            # API routes
    ├── socket/            # Socket.io handlers
    ├── server.js          # Entry point
    └── package.json
```

## 🔧 Configuration

### MongoDB Atlas Setup
1. Create account at mongodb.com/atlas
2. Create a new cluster
3. Get connection string
4. Update MONGODB_URI in server/.env

### Environment Variables

**Server (.env)**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lms
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Client (.env)**
```env
VITE_API_URL=http://localhost:5000/api
```

## 📝 API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- POST `/api/auth/logout` - Logout user
- GET `/api/auth/me` - Get current user

### Classes
- GET `/api/classes` - Get all classes
- POST `/api/classes` - Create class (Teacher)
- GET `/api/classes/:id` - Get class details
- POST `/api/classes/:id/join` - Join class (Student)
- POST `/api/classes/:id/announcement` - Post announcement (Teacher)

### Meetings
- GET `/api/meetings` - Get meetings
- POST `/api/meetings` - Create meeting (Teacher)
- GET `/api/meetings/:id` - Get meeting details
- PUT `/api/meetings/:id/status` - Update meeting status

### Assignments
- GET `/api/assignments/class/:classId` - Get class assignments
- POST `/api/assignments` - Create assignment (Teacher)
- POST `/api/assignments/:id/submit` - Submit assignment (Student)
- PUT `/api/assignments/:id/grade/:submissionId` - Grade submission (Teacher)

### Users
- GET `/api/users` - Get all users (Admin)
- PUT `/api/users/profile` - Update profile
- PUT `/api/users/verify/:id` - Verify teacher (Admin)
- DELETE `/api/users/:id` - Delete user (Admin)

### Notifications
- GET `/api/notifications` - Get user notifications
- PUT `/api/notifications/:id/read` - Mark as read
- PUT `/api/notifications/read-all` - Mark all as read

### Analytics
- GET `/api/analytics/admin` - Admin analytics
- GET `/api/analytics/teacher/:classId` - Teacher class analytics

## 🎮 Socket.io Events

### Client → Server
- `join-meeting` - Join a meeting room
- `send-message` - Send chat message
- `raise-hand` - Raise hand in meeting
- `react` - Send emoji reaction
- `admit-user` - Admit user from waiting room (Teacher)
- `remove-user` - Remove user from meeting (Teacher)
- `toggle-chat` - Enable/disable chat (Teacher)

### Server → Client
- `notification` - New notification
- `new-message` - New chat message
- `user-joined` - User joined meeting
- `user-waiting` - User in waiting room
- `hand-raised` - User raised hand
- `reaction` - User sent reaction
- `removed-from-meeting` - User was removed
- `chat-toggled` - Chat enabled/disabled

## 🚢 Deployment

### Backend (Heroku/Railway)
1. Push code to GitHub
2. Connect to hosting platform
3. Set environment variables
4. Deploy

### Frontend (Vercel/Netlify)
1. Push code to GitHub
2. Connect to Vercel/Netlify
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variables
6. Deploy

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Built with ❤️ for modern education

## 🙏 Acknowledgments

- React team for the amazing library
- Tailwind CSS for the utility-first CSS framework
- Socket.io for real-time communication
- MongoDB for the flexible database
- All open-source contributors

---

**Note**: This is a complete, production-ready LMS application. Make sure to update security keys and configurations before deploying to production.
