import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Video, Users, Award, ArrowRight } from 'lucide-react';

export default function Landing() {
  const features = [
    { icon: BookOpen, title: 'Interactive Classes', desc: 'Engage in live virtual classrooms' },
    { icon: Video, title: 'HD Video Meetings', desc: 'Crystal clear video conferencing' },
    { icon: Users, title: 'Collaborative Learning', desc: 'Real-time chat and collaboration' },
    { icon: Award, title: 'Track Progress', desc: 'XP system and performance analytics' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">L</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            EduHub
          </span>
        </div>
        <div className="space-x-4">
          <Link to="/login" className="btn btn-secondary">
            Login
          </Link>
          <Link to="/register" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-600 bg-clip-text text-transparent">
            Virtual Classroom & Meeting Hub
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A complete Learning Management System for modern education. Connect, learn, and grow together.
          </p>
          <Link to="/register" className="btn btn-primary text-lg px-8 py-3 inline-flex items-center space-x-2">
            <span>Start Learning Today</span>
            <ArrowRight size={20} />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              className="card hover:shadow-lg transition-shadow"
            >
              <feature.icon className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20 text-center"
        >
          <h2 className="text-3xl font-bold mb-12">Choose Your Role</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {['Student', 'Teacher', 'Admin'].map((role, index) => (
              <motion.div
                key={role}
                whileHover={{ scale: 1.05 }}
                className="card hover:shadow-xl transition-all cursor-pointer"
              >
                <h3 className="text-2xl font-bold mb-4 text-primary-600">{role}</h3>
                <p className="text-gray-600 mb-6">
                  {role === 'Student' && 'Join classes, attend meetings, submit assignments'}
                  {role === 'Teacher' && 'Create classes, host meetings, manage students'}
                  {role === 'Admin' && 'Manage users, monitor system, view analytics'}
                </p>
                <Link to="/register" state={{ role: role.toLowerCase() }} className="btn btn-primary w-full">
                  Register as {role}
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2024 EduHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
