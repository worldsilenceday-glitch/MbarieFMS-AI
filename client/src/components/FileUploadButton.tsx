import { useState, useRef } from "react";
import { addToSyncQueue } from "../utils/syncUtils";

interface FileUploadButtonProps {
  onFileUpload: (file: File) => void;
  onUploadProgress?: (progress: number) => void;
  onOfflineQueue?: (file: File) => void;
}

export const FileUploadButton = ({ 
  onFileUpload, 
  onUploadProgress, 
  onOfflineQueue 
}: FileUploadButtonProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error' | 'queued'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedFileTypes = [
    '.pdf', '.docx', '.doc', 
    '.csv', '.xlsx', '.xls',
    '.jpg', '.jpeg', '.png', 
    '.txt', '.md'
  ];

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension || '')) {
      alert(`Unsupported file type. Please upload one of: ${acceptedFileTypes.join(', ')}`);
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Please upload files smaller than 10MB.');
      return;
    }

    // Check if offline
    const isOffline = !navigator.onLine;

    if (isOffline) {
      // Queue for offline sync
      handleOfflineUpload(file);
      return;
    }

    // Online upload
    await handleOnlineUpload(file);
  };

  const handleOnlineUpload = async (file: File) => {
    setUploadStatus('uploading');
    setUploadProgress(0);
    if (onUploadProgress) onUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min((prev || 0) + 10, 90);
          if (onUploadProgress) onUploadProgress(newProgress);
          return newProgress;
        });
      }, 100);

      // Complete upload after delay
      setTimeout(() => {
        clearInterval(progressInterval);
        setUploadProgress(100);
        if (onUploadProgress) onUploadProgress(100);
        
        // Call the upload handler
        onFileUpload(file);
        setUploadStatus('success');
        
        // Reset progress after a short delay
        setTimeout(() => {
          setUploadProgress(null);
          setUploadStatus('idle');
          if (onUploadProgress) onUploadProgress(0);
        }, 1000);
      }, 1000);

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
  };

  const handleOfflineUpload = (file: File) => {
    // Convert file to base64 for storage
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: e.target?.result,
        timestamp: new Date().toISOString()
      };

      // Add to sync queue
      addToSyncQueue({
        type: 'upload',
        data: fileData
      });

      setUploadStatus('queued');
      
      // Notify parent component
      if (onOfflineQueue) {
        onOfflineQueue(file);
      }

      // Show success message
      setTimeout(() => {
        setUploadStatus('idle');
      }, 2000);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const getButtonColor = () => {
    switch (uploadStatus) {
      case 'uploading':
        return "bg-blue-400 text-white";
      case 'success':
        return "bg-green-500 text-white";
      case 'error':
        return "bg-red-500 text-white";
      case 'queued':
        return "bg-yellow-500 text-white";
      case 'idle':
        return isDragging 
          ? "bg-green-500 text-white scale-110" 
          : "bg-gray-200 text-gray-700 hover:bg-gray-300";
      default:
        return "bg-gray-200 text-gray-700 hover:bg-gray-300";
    }
  };

  const getButtonIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <div className="w-4 h-4 flex items-center justify-center text-xs">{uploadProgress}%</div>;
      case 'success':
        return <span className="text-sm">✅</span>;
      case 'error':
        return <span className="text-sm">❌</span>;
      case 'queued':
        return <span className="text-sm">⏳</span>;
      default:
        return <span className="text-sm">📎</span>;
    }
  };

  const getTooltipText = () => {
    switch (uploadStatus) {
      case 'uploading':
        return `Uploading... ${uploadProgress}%`;
      case 'success':
        return 'Upload complete!';
      case 'error':
        return 'Upload failed';
      case 'queued':
        return 'Queued for offline sync';
      default:
        return 'Upload file (PDF, DOCX, CSV, Images, TXT)';
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={acceptedFileTypes.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
      />
      
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-3 rounded-full transition-all duration-300 cursor-pointer ${getButtonColor()}`}
        title={getTooltipText()}
      >
        {getButtonIcon()}
      </div>

      {/* Status Tooltip */}
      {uploadStatus !== 'idle' && (
        <div className={`absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-lg text-xs whitespace-nowrap z-10 ${
          uploadStatus === 'success' ? 'bg-green-100 border border-green-300 text-green-800' :
          uploadStatus === 'error' ? 'bg-red-100 border border-red-300 text-red-800' :
          uploadStatus === 'queued' ? 'bg-yellow-100 border border-yellow-300 text-yellow-800' :
          'bg-blue-100 border border-blue-300 text-blue-800'
        }`}>
          {getTooltipText()}
          {uploadStatus === 'queued' && !navigator.onLine && (
            <div className="text-xs mt-1">Will sync when back online</div>
          )}
        </div>
      )}

      {/* Drag & Drop Tooltip */}
      {isDragging && uploadStatus === 'idle' && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-300 text-green-800 px-3 py-1 rounded-lg text-xs whitespace-nowrap z-10">
          Drop file to upload
        </div>
      )}
    </div>
  );
};
