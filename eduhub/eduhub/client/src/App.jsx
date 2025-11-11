import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import MeetingRoom from './pages/MeetingRoom';
import CreateClass from './pages/CreateClass';
import CreateMeeting from './pages/CreateMeeting';
import ClassList from './pages/ClassList';
import ClassDetail from './pages/ClassDetail';
import MeetingList from './pages/MeetingList';
import JoinClass from './pages/JoinClass';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case 'student':
      return <StudentDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <Navigate to="/login" />;
  }
}

function AppContent() {
  const { user } = useAuth();

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardRouter />
            </PrivateRoute>
          }
        />

        <Route
          path="/classes"
          element={
            <PrivateRoute>
              <ClassList />
            </PrivateRoute>
          }
        />

        <Route
          path="/classes/join"
          element={
            <PrivateRoute roles={['student']}>
              <JoinClass />
            </PrivateRoute>
          }
        />

        <Route
          path="/classes/create"
          element={
            <PrivateRoute roles={['teacher']}>
              <CreateClass />
            </PrivateRoute>
          }
        />

        <Route
          path="/classes/:id"
          element={
            <PrivateRoute>
              <ClassDetail />
            </PrivateRoute>
          }
        />

        <Route
          path="/meetings"
          element={
            <PrivateRoute>
              <MeetingList />
            </PrivateRoute>
          }
        />

        <Route
          path="/meetings/create"
          element={
            <PrivateRoute roles={['teacher']}>
              <CreateMeeting />
            </PrivateRoute>
          }
        />

        <Route
          path="/meetings/:id"
          element={
            <PrivateRoute>
              <MeetingRoom />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#363636',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}
