import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, Download, X, FileText, Image as ImageIcon, Video, File } from 'lucide-react';

interface FilePreviewProps {
  fileUrl: string | any;
  fileName?: string;
  fileType?: string;
  className?: string;
}

export function FilePreview({ fileUrl, fileName, fileType, className }: FilePreviewProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  // Parse fileUrl if it's a JSON string
  let fileData: any = null;
  let url = '';
  let previewUrl = '';
  let thumbnailUrl = '';
  let resourceType = '';

  try {
    if (typeof fileUrl === 'string') {
      // Try to parse as JSON (Cloudinary format)
      const trimmed = fileUrl.trim();
      if (trimmed.startsWith('{')) {
        try {
          fileData = JSON.parse(trimmed);
          url = fileData.url || '';
          previewUrl = fileData.previewUrl || fileData.url || '';
          thumbnailUrl = fileData.thumbnailUrl || '';
          resourceType = fileData.resourceType || '';
          
          // Debug logging (only in development)
          if (import.meta.env.DEV) {
            console.log('Parsed Cloudinary file data:', {
              url: url.substring(0, 50) + '...',
              hasPreview: !!previewUrl,
              hasThumbnail: !!thumbnailUrl,
              resourceType
            });
          }
        } catch (parseError) {
          // JSON parse failed, treat as regular URL
          console.warn('Failed to parse fileUrl as JSON:', parseError);
          console.warn('fileUrl value:', trimmed.substring(0, 100));
          url = fileUrl;
          previewUrl = fileUrl;
        }
      } else {
        // Regular URL
        url = fileUrl;
        previewUrl = fileUrl;
      }
    } else if (fileUrl && typeof fileUrl === 'object') {
      fileData = fileUrl;
      url = fileData.url || '';
      previewUrl = fileData.previewUrl || fileData.url || '';
      thumbnailUrl = fileData.thumbnailUrl || '';
      resourceType = fileData.resourceType || '';
    }
  } catch (e) {
    // Not JSON, treat as regular URL
    console.warn('Error parsing fileUrl:', e);
    url = typeof fileUrl === 'string' ? fileUrl : '';
    previewUrl = url;
  }

  // Ensure we have a valid URL
  if (!url) {
    console.error('No valid URL found in fileUrl:', fileUrl);
    return (
      <div className="text-sm text-muted-foreground p-2">
        No file URL available
      </div>
    );
  }

  // Validate URL format
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/api/')) {
    console.warn('Invalid URL format:', url);
  }

  // Determine file type from URL or resourceType
  const getFileType = () => {
    if (resourceType) {
      if (resourceType === 'image') return 'image';
      if (resourceType === 'video') return 'video';
      if (resourceType === 'raw') {
        const ext = url.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return 'pdf';
        return 'document';
      }
    }
    
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext || '')) return 'video';
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext || '')) return 'document';
    return 'file';
  };

  const type = getFileType();
  const displayUrl = previewUrl || url;
  const thumbUrl = thumbnailUrl || previewUrl || url;

  const handleDownload = async () => {
    if (!url) {
      console.error('No URL available for download');
      return;
    }

    setDownloading(true);

    try {
      // For Cloudinary URLs or external URLs, we need to fetch and create a blob
      // For local URLs, we can use direct download
      if (url.startsWith('http://') || url.startsWith('https://')) {
        // External URL (Cloudinary or other)
        try {
          // Fetch the file as a blob
          const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
          }

          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);

          // Create download link
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName || 'download';
          link.style.display = 'none';

          // Trigger download
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Clean up blob URL after a delay
          setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
          }, 100);
        } catch (error) {
          console.error('Download via fetch failed, using direct link:', error);
          // Fallback: open in new tab (user can save from there)
          window.open(url, '_blank');
        }
      } else {
        // Local URL - use direct download
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || 'download';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      setDownloading(false);
    }
  };

  const renderPreview = () => {
    switch (type) {
      case 'image':
        return (
          <div className="flex items-center justify-center p-4">
            <img
              src={displayUrl}
              alt={fileName || 'Preview'}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
              onError={(e) => {
                console.error('Failed to load image:', displayUrl);
                // Fallback to original URL if preview fails
                if (displayUrl !== url) {
                  e.currentTarget.src = url;
                }
              }}
            />
          </div>
        );
      
      case 'video':
        return (
          <div className="flex items-center justify-center p-4">
            <video
              src={displayUrl}
              controls
              className="max-w-full max-h-[70vh] rounded-lg"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
      
      case 'pdf':
        return (
          <div className="w-full h-[70vh] flex flex-col">
            <div className="mb-2 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">PDF Document</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
            </div>
            <iframe
              src={`${displayUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full flex-1 border border-border rounded-lg"
              title={fileName || 'PDF Preview'}
              onError={(e) => {
                console.error('Failed to load PDF in iframe:', displayUrl);
              }}
            />
            <p className="text-xs text-muted-foreground mt-2">
              If the PDF doesn't load,{' '}
              <button onClick={handleDownload} className="text-primary underline hover:no-underline">
                click here to download
              </button>
            </p>
          </div>
        );
      
      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Preview not available for this file type
            </p>
            <Button 
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </>
              )}
            </Button>
          </div>
        );
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  // Don't render if no URL
  if (!url) {
    return (
      <div className="text-sm text-muted-foreground">
        No file URL available
      </div>
    );
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        {type === 'image' && thumbUrl ? (
          <button
            onClick={() => setPreviewOpen(true)}
            className="relative group cursor-pointer"
          >
            <img
              src={thumbUrl}
              alt={fileName || 'Thumbnail'}
              className="w-16 h-16 object-cover rounded border border-border hover:opacity-80 transition-opacity"
              onError={(e) => {
                // If thumbnail fails, fallback to preview URL or original URL
                e.currentTarget.src = previewUrl || url;
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded transition-colors flex items-center justify-center">
              <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-2"
          >
            {getIcon()}
            <span>Preview</span>
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2"
        >
          {downloading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Downloading...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Download</span>
            </>
          )}
        </Button>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{fileName || 'File Preview'}</DialogTitle>
                <DialogDescription>
                  {type === 'image' && 'Image Preview'}
                  {type === 'video' && 'Video Player'}
                  {type === 'pdf' && 'PDF Document'}
                  {type === 'document' && 'Document'}
                  {type === 'file' && 'File'}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="mt-4">{renderPreview()}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}

