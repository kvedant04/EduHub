import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Users, Calendar, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

export default function ClassDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState({ title: '', content: '' });
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchClassData();
  }, [id]);

  const fetchClassData = async () => {
    try {
      const response = await API.get(`/classes/${id}`);
      setClassData(response.data.class);
    } catch (error) {
      toast.error('Failed to load class details');
      navigate('/classes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/classes/${id}/announcement`, announcement);
      toast.success('Announcement posted!');
      setAnnouncement({ title: '', content: '' });
      setShowAnnouncementForm(false);
      fetchClassData();
    } catch (error) {
      toast.error('Failed to post announcement');
    }
  };

  const handleAddStudent = async () => {
    if (!addEmail.trim()) return;
    try {
      setAdding(true);
      await API.post(`/classes/${id}/students`, { email: addEmail.trim() });
      toast.success('Student added');
      setAddEmail('');
      fetchClassData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to add student');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Remove this student from class?')) return;
    try {
      await API.delete(`/classes/${id}/students/${studentId}`);
      toast.success('Student removed');
      fetchClassData();
    } catch (error) {
      toast.error('Failed to remove student');
    }
  };

  const handleDeleteClass = async () => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await API.delete(`/classes/${id}`);
        toast.success('Class deleted successfully');
        navigate('/classes');
      } catch (error) {
        toast.error('Failed to delete class');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!classData) return null;

  const isTeacher = user.role === 'teacher' && classData.teacher._id === user.id;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => navigate('/classes')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Classes
          </button>

          <div className="card mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="bg-primary-500 p-4 rounded-lg">
                  <BookOpen className="text-white" size={32} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {classData.title}
                  </h1>
                  <p className="text-lg text-gray-600 mb-2">{classData.subject}</p>
                  {classData.description && (
                    <p className="text-gray-500">{classData.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Users size={16} className="mr-2" />
                      {classData.students?.length || 0} students
                    </div>
                    {classData.schedule && (
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-2" />
                        {classData.schedule}
                      </div>
                    )}
                    <div>
                      Code: <span className="font-mono font-semibold">{classData.code}</span>
                    </div>
                  </div>
                </div>
              </div>
              {isTeacher && (
                <button
                  onClick={handleDeleteClass}
                  className="btn btn-danger flex items-center space-x-2"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Announcements</h2>
                  {isTeacher && (
                    <button
                      onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                      className="btn btn-primary btn-sm flex items-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>New</span>
                    </button>
                  )}
                </div>

                {showAnnouncementForm && (
                  <form onSubmit={handleAddAnnouncement} className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      placeholder="Announcement title"
                      value={announcement.title}
                      onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                      required
                      className="input mb-3"
                    />
                    <textarea
                      placeholder="Announcement content"
                      value={announcement.content}
                      onChange={(e) => setAnnouncement({ ...announcement, content: e.target.value })}
                      required
                      rows={3}
                      className="input mb-3"
                    />
                    <div className="flex space-x-2">
                      <button type="submit" className="btn btn-primary btn-sm">
                        Post
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAnnouncementForm(false)}
                        className="btn btn-secondary btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  {classData.announcements?.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No announcements yet</p>
                  ) : (
                    classData.announcements?.map((ann, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">{ann.title}</h3>
                        <p className="text-gray-600 mb-2">{ann.content}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(ann.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-bold mb-4">Teacher</h2>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {classData.teacher.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{classData.teacher.name}</p>
                    <p className="text-sm text-gray-600">{classData.teacher.email}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-bold mb-4">Students</h2>
                {isTeacher && (
                  <div className="mb-4 flex items-center space-x-2">
                    <input
                      type="email"
                      placeholder="Student email"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      className="input flex-1"
                    />
                    <button
                      onClick={handleAddStudent}
                      disabled={adding}
                      className="btn btn-primary btn-sm"
                    >
                      Add
                    </button>
                  </div>
                )}
                <div className="space-y-3">
                  {classData.students?.length === 0 ? (
                    <p className="text-gray-500 text-sm">No students enrolled yet</p>
                  ) : (
                    classData.students?.map((student) => (
                      <div key={student._id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{student.name}</p>
                          <p className="text-xs text-gray-600">{student.email}</p>
                        </div>
                        </div>
                        {isTeacher && (
                          <button
                            onClick={() => handleRemoveStudent(student._id)}
                            className="text-red-600 hover:text-red-700"
                            title="Remove from class"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
