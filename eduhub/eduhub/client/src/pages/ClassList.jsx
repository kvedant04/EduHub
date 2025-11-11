import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

export default function ClassList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await API.get('/classes');
      setClasses(response.data.classes);
    } catch (error) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                {user.role === 'teacher' ? 'My Classes' : 'Enrolled Classes'}
              </h1>
              <p className="text-gray-600 mt-2">
                {user.role === 'teacher' 
                  ? 'Manage your classes and students'
                  : 'View your enrolled classes'}
              </p>
            </div>
            {user.role === 'teacher' ? (
              <button
                onClick={() => navigate('/classes/create')}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Create Class</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/classes/join')}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Join Class</span>
              </button>
            )}
          </div>

          {classes.length === 0 ? (
            <div className="card text-center py-12">
              <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No classes yet
              </h3>
              <p className="text-gray-600 mb-6">
                {user.role === 'teacher'
                  ? 'Create your first class to get started'
                  : 'Join a class using a class code'}
              </p>
              {user.role === 'teacher' ? (
                <button
                  onClick={() => navigate('/classes/create')}
                  className="btn btn-primary"
                >
                  Create Class
                </button>
              ) : (
                <button
                  onClick={() => navigate('/classes/join')}
                  className="btn btn-primary"
                >
                  Join a Class
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((cls) => (
                <motion.div
                  key={cls._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="card cursor-pointer"
                  onClick={() => navigate(`/classes/${cls._id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-primary-500 p-3 rounded-lg">
                      <BookOpen className="text-white" size={24} />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      cls.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {cls.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {cls.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{cls.subject}</p>
                  
                  {cls.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {cls.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center text-gray-600">
                      <Users size={16} className="mr-2" />
                      <span className="text-sm">{cls.students?.length || 0} students</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Code: <span className="font-mono font-semibold">{cls.code}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
