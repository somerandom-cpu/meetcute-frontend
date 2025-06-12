import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileCard from '../components/Profile/ProfileCard';
import { matchesAPI } from '../services/api';
import { FaHeart, FaTimes } from 'react-icons/fa';
import { useAuth } from "../contexts/AuthContext";
import { getImageUrl } from '../utils/image';

const Discover = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matchCreated, setMatchCreated] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Track skipped profiles in a Set, persisted in localStorage so they are not shown again
  const [skippedIds, setSkippedIds] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('skippedProfiles') || '[]');
      return new Set(stored);
    } catch (e) {
      console.error('Failed to parse skippedProfiles from localStorage', e);
      return new Set();
    }
  });

  useEffect(() => {
    if (currentUser) {
      fetchProfiles();
    }
  }, [currentUser]);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await matchesAPI.getSuggestions();
      console.log('Fetched potential matches:', response);
      
      // Process profiles for display
      const processedProfiles = (Array.isArray(response) ? response : [])
        // Exclude any profiles the user has previously skipped/removed
        .filter(profile => !skippedIds.has(profile.user_id))
        .map(profile => ({
          id: profile.user_id,
          user_id: profile.user_id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
          age: calculateAge(profile.dob),
          location: profile.location || profile.country || profile.city || 'Unknown location',
          bio: profile.bio || 'No bio provided',
          profile_picture: getImageUrl(profile.profile_picture),
          tags: profile.interests ? profile.interests.split(',').map(i => i.trim()) : []
        }));
      
      setProfiles(processedProfiles);
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError('Failed to load profiles. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [skippedIds]);

  const calculateAge = (dob) => {
    if (!dob) return null;
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (err) {
      console.error('Error calculating age:', err);
      return null;
    }
  };

  const handleLike = async (profileId) => {
    try {
      console.log('Liking profile:', profileId);
      
      // Add error display with timeout to auto-dismiss
      const showTemporaryError = (message) => {
        setError(message);
        setTimeout(() => setError(null), 3000);
      };
      
      const response = await matchesAPI.likeProfile(profileId);
      
      // Toggle liked state locally for immediate UI feedback
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, liked_by_me: true } : p));
      
      // Handle already liked profiles
      if (response.alreadyLiked) {
        console.log('Already liked this profile');
        // Show a more informative message to the user
        if (response.match) {
          // If it's also a match, show match notification
          showMatchDialog(profileId, true);
        } else {
          // Just show a small notification
          showTemporaryError("You've already liked this profile");
        }
      } 
      // Check if it's a new match
      else if (response.match) {
        // Show match notification with option to message
        showMatchDialog(profileId, false);
      } else {
        // No match, just move to the next profile
        // Treat liked profiles as skipped for future fetches
        const newSet = new Set(skippedIds);
        newSet.add(profileId);
        persistSkipped(newSet);
      }
    } catch (err) {
      console.error('Error liking profile:', err);
      
      // Provide more specific error messages based on the error type
      if (err.response?.status === 429 && err.response?.data?.limitExceeded && err.response?.data?.limitType === 'swipe') {
        // Specific error for swipe limit - make this persistent and stay on current profile
        setError(err.response.data.error || 'You have reached your daily swipe limit. Please upgrade for unlimited swipes.');
        // Optionally, you could disable swipe buttons here or show an upgrade modal.
      } else {
        if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else if (err.request) {
          setError('Network error. Please check your connection.');
        } else {
          setError('Failed to like profile. Please try again.');
        }
        setTimeout(() => {
          setError(null);
        }, 3000);
      }
    }
  };
  
  const showMatchDialog = (profileId, alreadyMatched) => {
    // Find the matched profile
    const matchedProfile = profiles.find(p => p.id === profileId);
    
    if (!matchedProfile) return;
    
    // Save match info to session storage for the Messages component
    const matchData = {
      user_id: matchedProfile.id,
      first_name: matchedProfile.name.split(' ')[0],
      last_name: matchedProfile.name.split(' ')[1] || '',
      profile_picture: matchedProfile.profile_picture
    };
    
    // Store the match data in session storage
    sessionStorage.setItem('selectedMatch', JSON.stringify(matchData));
    
    // Show modal dialog with options
    const message = alreadyMatched ? 
      `You already matched with ${matchedProfile.name}!` : 
      `It's a match with ${matchedProfile.name}! 🎉`;
      
    if (confirm(`${message}\n\nDo you want to message ${matchedProfile.name.split(' ')[0]} now?`)) {
      // Navigate to messages with this user
      navigate(`/messages/${matchedProfile.id}`);
    } else {
      // Continue browsing
    }
  };

  const handleSkip = async (profileId) => {
    const updated = new Set(skippedIds);
    updated.add(profileId);
    persistSkipped(updated);
    setProfiles(prev => prev.filter(p => p.id !== profileId));
  };

  // Helper to persist skippedIds to localStorage
  const persistSkipped = (updatedSet) => {
    setSkippedIds(new Set(updatedSet));
    localStorage.setItem('skippedProfiles', JSON.stringify(Array.from(updatedSet)));
  };

  // Show loading state
  if (loading && profiles.length === 0) {
    return (
      <div className="pt-16 flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  // Show error state
  if (error && profiles.length === 0) {
    return (
      <div className="pt-16 flex flex-col justify-center items-center min-h-[80vh] p-4">
        <div className="text-red-500 text-xl mb-4">😞 {error}</div>
        <button 
          onClick={fetchProfiles}
          className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show empty state when no profiles available
  if (profiles.length === 0) {
    return (
      <div className="pt-16 flex flex-col justify-center items-center min-h-[80vh] p-4">
        <div className="text-2xl font-bold mb-2">No more profiles</div>
        <p className="text-gray-500 mb-6 text-center">
          You've viewed all potential matches for now. Check back later for more!
        </p>
        <button 
          onClick={() => navigate('/matches')}
          className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
        >
          View Your Matches
        </button>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 max-w-5xl mx-auto">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {loading && profiles.length === 0 ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-2">No profiles found</h2>
          <p className="text-gray-500 mb-6">Check back later for more potential matches!</p>
          <button onClick={fetchProfiles} className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg">Refresh</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map(profile => (
            <div key={profile.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <ProfileCard profile={profile} />
              <div className="flex justify-between items-center p-4">
                <button
                  onClick={() => (profile.liked_by_me ? null : handleLike(profile.id))}
                  className={`flex-1 mr-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${profile.liked_by_me ? 'bg-green-100 text-green-600 cursor-default' : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]'}`}
                >
                  {profile.liked_by_me ? 'Liked' : 'Like'}
                </button>
                <button
                  onClick={() => handleSkip(profile.id)}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
                  title="Skip"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Discover;
