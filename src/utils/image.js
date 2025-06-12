// frontend/src/utils/image.js
// Central helper for constructing full URLs for images stored on the backend
// Usage: import { getImageUrl } from '.../utils/image';

export const getImageUrl = (path) => {
  // Return a default avatar for empty values so that <img src=""> is never broken
  if (!path) return '/images/default-avatar.svg';

  // Blob URLs from File API or Data URLs need no processing
  if (path.startsWith('blob:') || path.startsWith('data:')) return path;

  // If it's already a full URL, return it as is
  if (path.startsWith('http')) return path;

  // Base URL where the backend is running
  const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;

  // Handle profile pictures
  if (path.includes('profile-') || path.includes('profile_') || path.includes('profile/')) {
    // If it's already a full path, just ensure it has the base URL
    if (path.startsWith('/uploads/')) {
      return `${baseUrl}${path}`;
    }
    // Otherwise, treat it as a filename and use the API endpoint
    const filename = path.split('/').pop();
    return `${baseUrl}/api/profiles/picture/${encodeURIComponent(filename)}`;
  }

  // If path is already absolute from root (e.g. "/uploads/...")
  if (path.startsWith('/')) {
    return `${baseUrl}${path}`;
  }

  // Fallback – treat as relative path
  return `${baseUrl}/${path}`;
};
