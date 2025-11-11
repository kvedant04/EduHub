import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';
import API from '../utils/api';
import toast from 'react-hot-toast';

export default function JoinClass() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [classCode, setClassCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await API.post(`/classes/join/${classCode}`);
      toast.success('Successfully joined the class!');
      navigate('/classes');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </button>

          <div className="card">
            <div className="flex items-center mb-6">
              <div className="bg-primary-500 p-3 rounded-lg mr-4">
                <BookOpen className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Join a Class</h1>
                <p className="text-gray-600">Enter the class code to enroll</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Code *
                </label>
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  required
                  className="input text-center text-2xl font-mono tracking-widest"
                  placeholder="ABC123"
                  maxLength={6}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Ask your teacher for the 6-character class code
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading || classCode.length !== 6}
                  className="btn btn-primary flex-1"
                >
                  {loading ? 'Joining...' : 'Join Class'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
