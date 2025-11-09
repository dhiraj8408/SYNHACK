import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, Play, FileText, Image as ImageIcon, Video, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface MaterialViewerProps {
  fileUrl: string;
  fileName?: string;
  fileType?: string; // 'pdf', 'ppt', 'image', 'video', 'link', etc.
  className?: string;
}

export default function MaterialViewer({ fileUrl, fileName, fileType, className }: MaterialViewerProps) {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detectedType, setDetectedType] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isStudent = user?.role === 'student';

  // Detect file type from URL
  useEffect(() => {
    if (!fileUrl) {
      setError('No file URL provided');
      setLoading(false);
      return;
    }

    let detected = fileType?.toLowerCase() || null;
    const url = fileUrl.toLowerCase();

    // Check for YouTube links
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      detected = 'youtube';
    }
    // Check for Google Drive links
    else if (url.includes('drive.google.com')) {
      if (url.includes('/file/d/')) {
        // Try to detect if it's a video based on file extension in URL or type
        if (url.includes('video') || fileType === 'video' || fileName?.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i)) {
          detected = 'drive-video';
        } else if (url.includes('image') || fileType === 'image' || fileName?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
          detected = 'drive-image';
        } else if (url.includes('pdf') || fileType === 'pdf' || fileName?.match(/\.pdf$/i)) {
          detected = 'drive-pdf';
        } else if (url.includes('presentation') || fileType === 'ppt' || fileName?.match(/\.(ppt|pptx)$/i)) {
          detected = 'drive-ppt';
        } else {
          detected = 'drive-file';
        }
      }
    }
    // Check for direct file extensions
    else if (url.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i) || fileType === 'video') {
      detected = 'video';
    } else if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) || fileType === 'image') {
      detected = 'image';
    } else if (url.match(/\.pdf$/i) || fileType === 'pdf') {
      detected = 'pdf';
    } else if (url.match(/\.(ppt|pptx)$/i) || fileType === 'ppt') {
      detected = 'ppt';
    }

    setDetectedType(detected);
    setLoading(false);
  }, [fileUrl, fileType, fileName]);

  // Convert YouTube URL to embed URL
  const getYouTubeEmbedUrl = (url: string): string => {
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    }
    
    if (!videoId) return url;
    
    // Add parameters to prevent fast-forwarding for students
    const params = isStudent ? '?controls=1&modestbranding=1&rel=0&disablekb=1' : '?controls=1&modestbranding=1&rel=0';
    return `https://www.youtube.com/embed/${videoId}${params}`;
  };

  // Convert Google Drive URL to embed/preview URL
  const getDriveEmbedUrl = (url: string, type: string): string => {
    // Extract file ID from Google Drive URL
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) return url;

    const fileId = match[1];
    
    if (type === 'drive-video') {
      // For videos, use the preview URL
      return `https://drive.google.com/file/d/${fileId}/preview`;
    } else if (type === 'drive-image') {
      // For images, use direct thumbnail or preview
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    } else if (type === 'drive-pdf') {
      // For PDFs, use preview
      return `https://drive.google.com/file/d/${fileId}/preview`;
    } else if (type === 'drive-ppt') {
      // For PPTs, use preview
      return `https://drive.google.com/file/d/${fileId}/preview`;
    } else {
      // Default: try preview
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  };

  // Handle video time update to prevent fast-forwarding for students
  useEffect(() => {
    if (!isStudent || !videoRef.current || detectedType !== 'video') return;

    const video = videoRef.current;
    let lastTime = 0;
    let isUserSeeking = false;

    const handleTimeUpdate = () => {
      if (isUserSeeking) return;
      const currentTime = video.currentTime;
      // If user tries to skip forward more than 2 seconds, reset to last valid position
      if (currentTime > lastTime + 2) {
        video.currentTime = lastTime;
      } else {
        lastTime = currentTime;
      }
    };

    const handleSeeking = () => {
      isUserSeeking = true;
      const currentTime = video.currentTime;
      if (currentTime > lastTime + 2) {
        video.currentTime = lastTime;
      }
      setTimeout(() => {
        isUserSeeking = false;
      }, 100);
    };

    const handleSeeked = () => {
      const currentTime = video.currentTime;
      if (currentTime > lastTime + 2) {
        video.currentTime = lastTime;
      } else {
        lastTime = currentTime;
      }
      isUserSeeking = false;
    };

    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('contextmenu', handleContextMenu);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isStudent, detectedType]);

  // Check if iframe loaded successfully (using a timeout)
  useEffect(() => {
    if (detectedType && (detectedType.includes('drive') || detectedType === 'youtube' || detectedType === 'pdf' || detectedType === 'ppt')) {
      const timer = setTimeout(() => {
        // If still loading after 10 seconds, show error
        if (loading) {
          setError('Error loading file. Please check if the link is accessible and set to "Anyone with the link can view".');
          setLoading(false);
        }
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [detectedType, loading]);

  // Get API base URL for relative paths
  const getFullUrl = (url: string): string => {
    if (url.startsWith('/api/')) {
      const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';
      return `${API_BASE_URL}${url}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading File</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const fullUrl = getFullUrl(fileUrl);

  // YouTube video
  if (detectedType === 'youtube') {
    const embedUrl = getYouTubeEmbedUrl(fileUrl);
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="relative w-full" style={{ paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
          <iframe
            src={embedUrl}
            className="absolute top-0 left-0 w-full h-full border-0 rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => {
              setLoading(false);
              setError(null);
            }}
            title={fileName || 'YouTube Video'}
          />
        </div>
        {fileName && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Video className="h-4 w-4" />
            {fileName}
          </p>
        )}
        {isStudent && (
          <p className="text-xs text-muted-foreground">
            Note: Video controls are restricted for students
          </p>
        )}
      </div>
    );
  }

  // Google Drive video
  if (detectedType === 'drive-video') {
    const driveVideoUrl = getDriveEmbedUrl(fileUrl, 'drive-video');
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="relative w-full" style={{ paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
          <iframe
            src={driveVideoUrl}
            className="absolute top-0 left-0 w-full h-full border-0 rounded-lg"
            allow="autoplay"
            onLoad={() => {
              setLoading(false);
              setError(null);
            }}
            title={fileName || 'Google Drive Video'}
          />
        </div>
        {fileName && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Video className="h-4 w-4" />
            {fileName}
          </p>
        )}
        {isStudent && (
          <p className="text-xs text-muted-foreground">
            Note: Video controls are restricted for students
          </p>
        )}
      </div>
    );
  }

  // Direct video file
  if (detectedType === 'video') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="relative w-full">
          <video
            ref={videoRef}
            src={fullUrl}
            controls
            controlsList={isStudent ? 'nodownload nofullscreen noremoteplayback' : undefined}
            disablePictureInPicture={isStudent}
            onError={() => {
              setError('Error loading video file. Please check if the link is accessible.');
              setLoading(false);
            }}
            onLoadStart={() => setLoading(false)}
            onLoadedData={() => setLoading(false)}
          >
            Your browser does not support the video tag.
          </video>
        </div>
        {fileName && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Video className="h-4 w-4" />
            {fileName}
          </p>
        )}
        {isStudent && (
          <p className="text-xs text-muted-foreground">
            Note: Fast-forwarding and seeking are disabled for students
          </p>
        )}
      </div>
    );
  }

  // Image (Google Drive or direct)
  if (detectedType === 'image' || detectedType === 'drive-image') {
    const imageUrl = detectedType === 'drive-image' 
      ? getDriveEmbedUrl(fileUrl, 'drive-image')
      : fullUrl;

    return (
      <div className={`space-y-2 ${className}`}>
        <div className="relative w-full">
          <img
            src={imageUrl}
            alt={fileName || 'Image'}
            className="w-full h-auto rounded-lg border"
            onError={() => {
              setError('Error loading image. Please check if the link is accessible and set to "Anyone with the link can view".');
              setLoading(false);
            }}
            onLoad={() => {
              setLoading(false);
              setError(null);
            }}
          />
        </div>
        {fileName && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            {fileName}
          </p>
        )}
      </div>
    );
  }

  // PDF (Google Drive or direct)
  if (detectedType === 'pdf' || detectedType === 'drive-pdf') {
    const pdfUrl = detectedType === 'drive-pdf'
      ? getDriveEmbedUrl(fileUrl, 'drive-pdf')
      : fullUrl;

    return (
      <div className={`space-y-2 ${className}`}>
        <div className="relative w-full" style={{ height: '600px' }}>
          <iframe
            src={pdfUrl}
            className="w-full h-full border rounded-lg"
            onLoad={() => {
              setLoading(false);
              setError(null);
            }}
            title={fileName || 'PDF Document'}
          />
        </div>
        {fileName && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {fileName}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(pdfUrl, '_blank')}
            >
              <Download className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        )}
      </div>
    );
  }

  // PowerPoint (Google Drive or direct)
  if (detectedType === 'ppt' || detectedType === 'drive-ppt') {
    const pptUrl = detectedType === 'drive-ppt'
      ? getDriveEmbedUrl(fileUrl, 'drive-ppt')
      : fullUrl;

    return (
      <div className={`space-y-2 ${className}`}>
        <div className="relative w-full" style={{ height: '600px' }}>
          <iframe
            src={pptUrl}
            className="w-full h-full border rounded-lg"
            onLoad={() => {
              setLoading(false);
              setError(null);
            }}
            title={fileName || 'PowerPoint Presentation'}
          />
        </div>
        {fileName && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {fileName}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(pptUrl, '_blank')}
            >
              <Download className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Generic Google Drive file
  if (detectedType === 'drive-file') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="relative w-full" style={{ height: '600px' }}>
          <iframe
            src={getDriveEmbedUrl(fileUrl, 'drive-file')}
            className="w-full h-full border rounded-lg"
            onLoad={() => {
              setLoading(false);
              setError(null);
            }}
            title={fileName || 'Google Drive File'}
          />
        </div>
        {fileName && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {fileName}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(fileUrl, '_blank')}
            >
              <Download className="h-4 w-4 mr-2" />
              Open in Google Drive
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Fallback: show download button
  return (
    <div className={`space-y-2 ${className}`}>
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertTitle>File Preview Not Available</AlertTitle>
        <AlertDescription>
          This file type cannot be previewed. Please download to view.
        </AlertDescription>
      </Alert>
      <Button
        variant="outline"
        onClick={() => window.open(fullUrl, '_blank')}
        className="w-full"
      >
        <Download className="h-4 w-4 mr-2" />
        {fileName || 'Download File'}
      </Button>
    </div>
  );
}

