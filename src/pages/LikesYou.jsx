// frontend/src/pages/LikesYou.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchesAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FaHeart, FaTimes } from 'react-icons/fa';
import { useSubscription } from '../contexts/SubscriptionContext';

// Helper to build image URL (reuse logic from Matches)
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('blob:') || path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
  if (path.includes('profile-') || path.includes('profile_')) {
    const filename = path.split('/').pop();
    return `${baseUrl}/api/profiles/picture/${encodeURIComponent(filename)}`;
  }
  return path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
};

const LikesYou = () => {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { meetsTierRequirement } = useSubscription();

  useEffect(() => {
    if (!meetsTierRequirement('Premium')) {
      // Redirect to premium upsell if not eligible
      navigate('/premium');
      return;
    }
    fetchLikes();
  }, [meetsTierRequirement]);

  const fetchLikes = async () => {
    try {
      const likesData = await matchesAPI.getLikesYou();
      setLikes(Array.isArray(likesData) ? likesData : []);
    } catch (err) {
      console.error('Error fetching likes-you list:', err);
      setError(err.response?.data?.error || 'Failed to fetch likes');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeBack = async (userId) => {
    try {
      const res = await matchesAPI.likeProfile(userId);
      if (res.match) {
        toast.success('It’s a match!');
      } else {
        toast.success('Liked back!');
      }
      // After liking back, remove from list
      setLikes(prev => prev.filter(u => u.user_id !== userId));
    } catch (err) {
      console.error('Error liking back:', err);
      toast.error(err.response?.data?.error || 'Failed to like back');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">People Who Liked You</h1>

      {likes.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-sm">
          <div className="text-6xl mb-4">😍</div>
          <h2 className="text-xl font-semibold mb-2 text-gray-700">No likes yet</h2>
          <p className="text-gray-500">Keep being awesome and you will show up here!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {likes.map(user => (
            <div key={user.user_id} className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
              <div className="relative h-64 bg-gray-100 flex items-center justify-center overflow-hidden">
                {user.profile_picture ? (
                  <img
                    src={getImageUrl(user.profile_picture)}
                    alt={`${user.firstName || 'User'}'s profile`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <div className="text-gray-400 text-center p-4">
                      <div className="text-6xl mb-2">👤</div>
                      <p className="text-sm">No profile picture</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-1 text-gray-800">
                  {user.firstname || user.firstName} {user.lastname || user.lastName}
                </h3>
                <div className="flex justify-between items-center gap-2 mt-3">
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
                    onClick={() => handleLikeBack(user.user_id)}
                  >
                    <FaHeart /> Like Back
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full"
                    onClick={() => setLikes(prev => prev.filter(u => u.user_id !== user.user_id))}
                    title="Dismiss"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LikesYou;
