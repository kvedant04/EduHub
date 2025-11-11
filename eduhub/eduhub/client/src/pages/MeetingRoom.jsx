import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Video, VideoOff, Phone, MessageSquare, 
  Users, Hand, Smile, UserX 
} from 'lucide-react';
import { getSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

function RemoteVideo({ stream, userName }) {
  const videoRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(true);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      
      // Check if stream has video track
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        setHasVideo(videoTrack.enabled);
        
        // Listen for track changes
        videoTrack.onended = () => setHasVideo(false);
        videoTrack.onmute = () => setHasVideo(false);
        videoTrack.onunmute = () => setHasVideo(true);
      }
    }
  }, [stream]);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden min-h-[300px]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-4xl font-bold">
              {userName?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-3 py-1 rounded text-white text-sm">
        {userName}
      </div>
    </div>
  );
}

export default function MeetingRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const [meeting, setMeeting] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState([]);
  const [waitingRoom, setWaitingRoom] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isAdmitted, setIsAdmitted] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [peerConnections, setPeerConnections] = useState({});
  const localVideoRef = useRef(null);
  const messagesEndRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    fetchMeeting();
    setupSocketListeners();

    return () => {
      // Cleanup
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      Object.values(peerConnections).forEach(pc => pc.close());
      
      socket?.off('new-message');
      socket?.off('user-joined');
      socket?.off('user-waiting');
      socket?.off('reaction');
      socket?.off('hand-raised');
      socket?.off('admitted-to-meeting');
      socket?.off('meeting-joined');
      socket?.off('webrtc-offer');
      socket?.off('webrtc-answer');
      socket?.off('webrtc-ice-candidate');
      socket?.off('user-removed');
    };
  }, [id]);

  useEffect(() => {
    if (isAdmitted && !isWaiting) {
      initializeMedia();
    }
  }, [isAdmitted, isWaiting]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMeeting = async () => {
    try {
      const { data } = await API.get(`/meetings/${id}`);
      setMeeting(data.meeting);
      setParticipants(data.meeting.participants.filter(p => p.status === 'joined'));
      setWaitingRoom(data.meeting.participants.filter(p => p.status === 'waiting'));
      
      // Check if current user is in waiting room or admitted
      const currentUserParticipant = data.meeting.participants.find(
        p => p.user?._id === user.id || p.user === user.id
      );
      
      if (currentUserParticipant) {
        if (currentUserParticipant.status === 'waiting') {
          setIsWaiting(true);
          setIsAdmitted(false);
        } else if (currentUserParticipant.status === 'joined') {
          setIsWaiting(false);
          setIsAdmitted(true);
        }
      } else {
        // User hasn't joined yet, join now
        joinMeeting();
      }
    } catch (error) {
      toast.error('Failed to load meeting');
    }
  };

  const joinMeeting = () => {
    socket?.emit('join-meeting', { meetingId: id });
  };

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Notify others that we're ready for WebRTC
      socket?.emit('ready-for-webrtc', { meetingId: id });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Could not access camera/microphone');
    }
  };

  const createPeerConnection = (userId) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
    
    const pc = new RTCPeerConnection(configuration);
    
    // Add local stream tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }
    
    // Handle incoming remote stream
    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [userId]: event.streams[0]
      }));
    };
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('webrtc-ice-candidate', {
          meetingId: id,
          targetUserId: userId,
          candidate: event.candidate
        });
      }
    };
    
    return pc;
  };

  const setupSocketListeners = () => {
    socket?.on('meeting-joined', ({ meeting: joinedMeeting }) => {
      const myParticipant = joinedMeeting.participants.find(
        p => p.user.toString() === user.id
      );
      
      if (myParticipant?.status === 'waiting') {
        setIsWaiting(true);
        setIsAdmitted(false);
        toast('Waiting for host to admit you...', { icon: '⏳' });
      } else {
        setIsWaiting(false);
        setIsAdmitted(true);
      }
    });

    socket?.on('admitted-to-meeting', () => {
      setIsWaiting(false);
      setIsAdmitted(true);
      toast.success('You have been admitted to the meeting!');
      fetchMeeting();
    });

    // WebRTC signaling - when a new user is ready
    socket?.on('user-ready-for-webrtc', async ({ userId, userName }) => {
      if (userId === user.id) return;
      
      console.log(`User ${userName} is ready for WebRTC, creating offer...`);
      
      const pc = createPeerConnection(userId);
      setPeerConnections(prev => {
        const updated = { ...prev, [userId]: pc };
        return updated;
      });
      
      try {
        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        socket?.emit('webrtc-offer', {
          meetingId: id,
          targetUserId: userId,
          offer
        });
        console.log(`Sent offer to ${userName}`);
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    });

    socket?.on('webrtc-offer', async ({ fromUserId, offer }) => {
      console.log(`Received offer from ${fromUserId}`);
      
      const pc = createPeerConnection(fromUserId);
      setPeerConnections(prev => {
        const updated = { ...prev, [fromUserId]: pc };
        return updated;
      });
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket?.emit('webrtc-answer', {
          meetingId: id,
          targetUserId: fromUserId,
          answer
        });
        console.log(`Sent answer to ${fromUserId}`);
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    socket?.on('webrtc-answer', async ({ fromUserId, answer }) => {
      console.log(`Received answer from ${fromUserId}`);
      
      setPeerConnections(prev => {
        const pc = prev[fromUserId];
        if (pc) {
          pc.setRemoteDescription(new RTCSessionDescription(answer))
            .then(() => console.log(`Set remote description for ${fromUserId}`))
            .catch(err => console.error('Error setting remote description:', err));
        }
        return prev;
      });
    });

    socket?.on('webrtc-ice-candidate', async ({ fromUserId, candidate }) => {
      console.log(`Received ICE candidate from ${fromUserId}`);
      
      setPeerConnections(prev => {
        const pc = prev[fromUserId];
        if (pc && pc.remoteDescription) {
          pc.addIceCandidate(new RTCIceCandidate(candidate))
            .then(() => console.log(`Added ICE candidate from ${fromUserId}`))
            .catch(err => console.error('Error adding ICE candidate:', err));
        }
        return prev;
      });
    });

    socket?.on('user-left-meeting', ({ userId }) => {
      console.log(`User ${userId} left meeting`);
      
      // Close peer connection
      setPeerConnections(prev => {
        if (prev[userId]) {
          prev[userId].close();
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        }
        return prev;
      });
      
      // Remove remote stream
      setRemoteStreams(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    });

    socket?.on('user-removed', ({ userId }) => {
      console.log(`User ${userId} removed by host`);
      // Same cleanup as left
      setPeerConnections(prev => {
        if (prev[userId]) {
          prev[userId].close();
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        }
        return prev;
      });
      setRemoteStreams(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      // refresh participants list
      fetchMeeting();
    });

    socket?.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket?.on('user-joined', ({ userId, userName }) => {
      if (userId !== user.id) {
        toast.success(`${userName} joined the meeting`);
      }
      fetchMeeting();
    });

    socket?.on('user-waiting', ({ userId, userName }) => {
      if (user.role === 'teacher') {
        toast(`${userName} is waiting to join`, {
          icon: '👋',
          duration: 5000
        });
      }
      fetchMeeting();
    });

    socket?.on('reaction', ({ userName, emoji }) => {
      toast.custom((t) => (
        <div className="bg-white rounded-lg shadow-lg p-3 flex items-center space-x-2">
          <span className="text-2xl">{emoji}</span>
          <span className="text-sm">{userName}</span>
        </div>
      ), { duration: 2000 });
    });

    socket?.on('hand-raised', ({ userName }) => {
      toast(`${userName} raised their hand`, { icon: '✋' });
    });

    socket?.on('removed-from-meeting', () => {
      toast.error('You have been removed from the meeting');
      window.location.href = '/dashboard';
    });

    socket?.on('chat-toggled', ({ enabled }) => {
      toast(enabled ? 'Chat enabled' : 'Chat disabled');
    });
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    socket?.emit('send-message', { meetingId: id, message: newMessage });
    setNewMessage('');
  };

  const raiseHand = () => {
    socket?.emit('raise-hand', { meetingId: id });
    toast.success('Hand raised');
  };

  const sendReaction = (emoji) => {
    socket?.emit('react', { meetingId: id, emoji });
  };

  const admitUser = (userId) => {
    socket?.emit('admit-user', { meetingId: id, userId });
    // Refresh meeting data to update waiting room
    setTimeout(() => fetchMeeting(), 500);
  };

  const removeUser = (userId) => {
    if (confirm('Remove this user from the meeting?')) {
      socket?.emit('remove-user', { meetingId: id, userId });
    }
  };

  const toggleChat = () => {
    if (user.role === 'teacher') {
      socket?.emit('toggle-chat', { meetingId: id, enabled: !meeting?.settings?.chatEnabled });
    }
  };

  const leaveMeeting = () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Close all peer connections
    Object.values(peerConnections).forEach(pc => pc.close());
    
    // Notify server
    socket?.emit('leave-meeting', { meetingId: id });
    
    // Redirect
    window.location.href = '/dashboard';
  };

  if (!meeting) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Show waiting room screen for students who haven't been admitted
  if (isWaiting && user.role === 'student') {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-32 h-32 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-5xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="text-white text-2xl font-semibold mb-2">Waiting for host to let you in</h2>
          <p className="text-gray-400 mb-6">Please wait, the host will admit you shortly</p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <button
            onClick={leaveMeeting}
            className="mt-8 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg"
          >
            Leave Waiting Room
          </button>
        </motion.div>
      </div>
    );
  }

  // Teachers and admitted students can see the full meeting interface
  const canAccessMeeting = user.role === 'teacher' || isAdmitted;

  if (!canAccessMeeting) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold">{meeting.title}</h1>
          <p className="text-gray-400 text-sm">{meeting.class?.title}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center space-x-2"
          >
            <Users size={20} />
            <span>{participants.length}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 bg-gray-900 relative p-4 overflow-y-auto">
          {/* Video Grid */}
          <div className={`grid gap-4 h-full ${
            Object.keys(remoteStreams).length === 0 
              ? 'grid-cols-1' 
              : Object.keys(remoteStreams).length === 1
              ? 'grid-cols-1 md:grid-cols-2'
              : Object.keys(remoteStreams).length <= 3
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          }`}>
            {/* Local Video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden min-h-[300px]">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-3 py-1 rounded text-white text-sm flex items-center space-x-2">
                <span>You ({user.role})</span>
                {isMuted && <span>🔇</span>}
              </div>
            </div>

            {/* Remote Videos */}
            {Object.entries(remoteStreams).map(([userId, stream]) => {
              const participant = participants.find(p => p.user?._id === userId || p.user === userId);
              return (
                <RemoteVideo
                  key={userId}
                  stream={stream}
                  userName={participant?.user?.name || 'Participant'}
                />
              );
            })}
          </div>

          {user.role === 'teacher' && waitingRoom.length > 0 && (
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-xl p-4 max-w-sm">
              <h3 className="font-semibold mb-3">Waiting Room ({waitingRoom.length})</h3>
              <div className="space-y-2">
                {waitingRoom.map((participant) => (
                  <div key={participant._id} className="flex items-center justify-between">
                    <span className="text-sm">{participant.user?.name}</span>
                    <button
                      onClick={() => admitUser(participant.user._id)}
                      className="btn btn-primary text-xs"
                    >
                      Admit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-80 bg-white border-l border-gray-200 flex flex-col"
            >
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold">Chat</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-semibold text-primary-600">{msg.userName}: </span>
                    <span className="text-gray-700">{msg.message}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 input"
                  />
                  <button onClick={sendMessage} className="btn btn-primary">
                    Send
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showParticipants && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-80 bg-white border-l border-gray-200 flex flex-col"
            >
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold">Participants ({participants.length})</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {participants.map((participant) => (
                  <div key={participant._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <span className="text-sm">{participant.user?.name}</span>
                    {user.role === 'teacher' && participant.user?._id !== user.id && (
                      <button
                        onClick={() => removeUser(participant.user._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserX size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700'} hover:bg-opacity-80 transition-colors`}
          >
            {isMuted ? <MicOff className="text-white" size={24} /> : <Mic className="text-white" size={24} />}
          </button>
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-700'} hover:bg-opacity-80 transition-colors`}
          >
            {isVideoOff ? <VideoOff className="text-white" size={24} /> : <Video className="text-white" size={24} />}
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <button onClick={raiseHand} className="p-4 rounded-full bg-gray-700 hover:bg-gray-600">
            <Hand className="text-white" size={24} />
          </button>
          <button onClick={() => sendReaction('👍')} className="p-4 rounded-full bg-gray-700 hover:bg-gray-600">
            <Smile className="text-white" size={24} />
          </button>
          <button onClick={() => setShowChat(!showChat)} className="p-4 rounded-full bg-gray-700 hover:bg-gray-600">
            <MessageSquare className="text-white" size={24} />
          </button>
          <button onClick={leaveMeeting} className="px-6 py-3 rounded-full bg-red-500 hover:bg-red-600 flex items-center space-x-2">
            <Phone size={20} className="text-white" />
            <span className="text-white font-medium">Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
}
