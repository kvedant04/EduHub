import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, Award, TrendingUp, Clock, CheckCircle, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { Link, useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [classesRes, meetingsRes] = await Promise.all([
        API.get('/classes'),
        API.get('/meetings')
      ]);
      setClasses(classesRes.data.classes);
      setMeetings(meetingsRes.data.meetings);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { icon: BookOpen, label: 'Enrolled Classes', value: classes.length, color: 'bg-blue-500' },
    { icon: Calendar, label: 'Upcoming Meetings', value: meetings.filter(m => m.status === 'scheduled').length, color: 'bg-green-500' },
    { icon: Award, label: 'XP Points', value: user?.xp || 0, color: 'bg-purple-500' },
    { icon: TrendingUp, label: 'Level', value: user?.level || 1, color: 'bg-orange-500' }
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-between items-center"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
            <p className="text-gray-600 mt-2">Here's what's happening with your learning today</p>
          </div>
          <button
            onClick={() => navigate('/classes/join')}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Join Class</span>
          </button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="text-white" size={24} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">My Classes</h2>
              <Link to="/classes" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {classes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No classes enrolled yet</p>
                  <button
                    onClick={() => navigate('/classes/join')}
                    className="btn btn-primary"
                  >
                    Join Your First Class
                  </button>
                </div>
              ) : (
                classes.slice(0, 5).map((cls) => (
                  <Link
                    key={cls._id}
                    to={`/classes/${cls._id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{cls.title}</h3>
                        <p className="text-sm text-gray-600">{cls.teacher?.name}</p>
                      </div>
                      <div className="text-sm text-gray-500">{cls.students?.length} students</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Upcoming Meetings</h2>
              <Link to="/meetings" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {meetings.filter(m => m.status === 'scheduled').length === 0 ? (
                <p className="text-gray-500 text-center py-8">No upcoming meetings</p>
              ) : (
                meetings.filter(m => m.status === 'scheduled').slice(0, 5).map((meeting) => (
                  <div
                    key={meeting._id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{meeting.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{meeting.class?.title}</p>
                        <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
                          <Clock size={14} />
                          <span>{new Date(meeting.scheduledAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <Link
                        to={`/meetings/${meeting._id}`}
                        className="btn btn-primary text-sm"
                      >
                        Join
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card mt-8"
        >
          <h2 className="text-xl font-bold mb-6">Progress Overview</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Level {user?.level} Progress</span>
                <span>{user?.xp % 100}/100 XP</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(user?.xp % 100)}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
