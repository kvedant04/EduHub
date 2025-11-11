import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import API from '../utils/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, usersRes] = await Promise.all([
        API.get('/analytics/admin'),
        API.get('/users')
      ]);
      setAnalytics(analyticsRes.data.analytics);
      setUsers(usersRes.data.users);
      setPendingTeachers(usersRes.data.users.filter(u => u.role === 'teacher' && !u.isVerified));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyTeacher = async (userId) => {
    try {
      await API.put(`/users/verify/${userId}`);
      toast.success('Teacher verified successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to verify teacher');
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await API.delete(`/users/${userId}`);
      toast.success('User deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const stats = [
    { icon: Users, label: 'Total Users', value: analytics?.totalUsers || 0, color: 'bg-blue-500' },
    { icon: Users, label: 'Students', value: analytics?.totalStudents || 0, color: 'bg-green-500' },
    { icon: Users, label: 'Teachers', value: analytics?.totalTeachers || 0, color: 'bg-purple-500' },
    { icon: BookOpen, label: 'Total Classes', value: analytics?.totalClasses || 0, color: 'bg-orange-500' },
    { icon: Calendar, label: 'Total Meetings', value: analytics?.totalMeetings || 0, color: 'bg-pink-500' },
    { icon: AlertCircle, label: 'Pending Verifications', value: analytics?.pendingVerifications || 0, color: 'bg-red-500' }
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
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">System overview and management</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

        {pendingTeachers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card mb-8"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
              <AlertCircle className="text-orange-500" />
              <span>Pending Teacher Verifications</span>
            </h2>
            <div className="space-y-4">
              {pendingTeachers.map((teacher) => (
                <div
                  key={teacher._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold">{teacher.name}</h3>
                    <p className="text-sm text-gray-600">{teacher.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Registered: {new Date(teacher.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => verifyTeacher(teacher._id)}
                      className="btn btn-primary flex items-center space-x-1"
                    >
                      <CheckCircle size={16} />
                      <span>Verify</span>
                    </button>
                    <button
                      onClick={() => deleteUser(teacher._id)}
                      className="btn bg-red-500 text-white hover:bg-red-600 flex items-center space-x-1"
                    >
                      <XCircle size={16} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-6">All Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Joined</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{user.name}</td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs capitalize">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {user.isVerified ? (
                        <span className="text-green-600 flex items-center space-x-1">
                          <CheckCircle size={16} />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="text-orange-600 flex items-center space-x-1">
                          <AlertCircle size={16} />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => deleteUser(user._id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
