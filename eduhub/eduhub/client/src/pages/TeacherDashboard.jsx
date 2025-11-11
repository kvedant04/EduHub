import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, Calendar, BarChart, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { Link, useNavigate } from 'react-router-dom';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const totalStudents = classes.reduce((acc, cls) => acc + (cls.students?.length || 0), 0);

  const stats = [
    { icon: BookOpen, label: 'Total Classes', value: classes.length, color: 'bg-blue-500' },
    { icon: Users, label: 'Total Students', value: totalStudents, color: 'bg-green-500' },
    { icon: Calendar, label: 'Scheduled Meetings', value: meetings.filter(m => m.status === 'scheduled').length, color: 'bg-purple-500' },
    { icon: BarChart, label: 'Active Classes', value: classes.filter(c => c.isActive).length, color: 'bg-orange-500' }
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
            <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your classes and meetings</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/classes/create')}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Create Class</span>
            </button>
            <button
              onClick={() => navigate('/meetings/create')}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Schedule Meeting</span>
            </button>
          </div>
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
                  <p className="text-gray-500 mb-4">No classes created yet</p>
                  <button
                    onClick={() => navigate('/classes/create')}
                    className="btn btn-primary"
                  >
                    Create Your First Class
                  </button>
                </div>
              ) : (
                classes.map((cls) => (
                  <Link
                    key={cls._id}
                    to={`/classes/${cls._id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{cls.title}</h3>
                        <p className="text-sm text-gray-600">{cls.subject}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{cls.students?.length} students</div>
                        <div className="text-xs text-gray-500">Code: {cls.code}</div>
                      </div>
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
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No meetings scheduled</p>
                  <button
                    onClick={() => navigate('/meetings/create')}
                    className="btn btn-primary"
                  >
                    Schedule a Meeting
                  </button>
                </div>
              ) : (
                meetings.filter(m => m.status === 'scheduled').map((meeting) => (
                  <div
                    key={meeting._id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{meeting.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{meeting.class?.title}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {new Date(meeting.scheduledAt).toLocaleString()}
                        </p>
                      </div>
                      <Link
                        to={`/meetings/${meeting._id}`}
                        className="btn btn-primary text-sm"
                      >
                        Start
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
