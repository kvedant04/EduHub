import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Plus, Clock, Video, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

export default function MeetingList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await API.get('/meetings');
      setMeetings(response.data.meetings);
    } catch (error) {
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'live':
        return 'bg-green-100 text-green-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
              <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
              <p className="text-gray-600 mt-2">
                {user.role === 'teacher' 
                  ? 'Manage your scheduled meetings'
                  : 'View your upcoming meetings'}
              </p>
            </div>
            {user.role === 'teacher' && (
              <button
                onClick={() => navigate('/meetings/create')}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Schedule Meeting</span>
              </button>
            )}
          </div>

          {meetings.length === 0 ? (
            <div className="card text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No meetings scheduled
              </h3>
              <p className="text-gray-600 mb-6">
                {user.role === 'teacher'
                  ? 'Schedule your first meeting to get started'
                  : 'No upcoming meetings at the moment'}
              </p>
              {user.role === 'teacher' && (
                <button
                  onClick={() => navigate('/meetings/create')}
                  className="btn btn-primary"
                >
                  Schedule Meeting
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <motion.div
                  key={meeting._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="bg-purple-500 p-3 rounded-lg">
                        <Video className="text-white" size={24} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {meeting.title}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                            {meeting.status}
                          </span>
                        </div>
                        
                        {meeting.description && (
                          <p className="text-gray-600 mb-3">{meeting.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar size={16} className="mr-2" />
                            {new Date(meeting.scheduledAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Clock size={16} className="mr-2" />
                            {new Date(meeting.scheduledAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                          <div>
                            Duration: {meeting.duration} min
                          </div>
                        </div>
                        
                        {meeting.class && (
                          <div className="mt-2 text-sm text-gray-500">
                            Class: {meeting.class.title}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      {meeting.status === 'scheduled' && (
                        <button
                          onClick={() => navigate(`/meetings/${meeting._id}`)}
                          className="btn btn-primary"
                        >
                          Start Meeting
                        </button>
                      )}
                      {meeting.status === 'live' && (
                        <button
                          onClick={() => navigate(`/meetings/${meeting._id}`)}
                          className="btn btn-success"
                        >
                          Join Meeting
                        </button>
                      )}
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
