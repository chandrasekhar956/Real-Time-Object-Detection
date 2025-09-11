import React, { useState, useCallback, useEffect } from "react";
import { uploadFile } from "../lib/api";
import { useAlertSound } from "../hooks/useAlertSound";

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

const Upload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    message: string;
    resultUrl?: string;
    detections?: Array<{ class: string; confidence: number }>;
  } | null>(null);
  
  const { playAlertSound } = useAlertSound();

  // Supported file types
  const supportedFormats = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ];

  const validateFile = (fileToValidate: File): boolean => {
    if (!supportedFormats.includes(fileToValidate.type)) {
      setError('Unsupported file type. Please upload an image or video file.');
      return false;
    }
    
    // 50MB max file size
    const maxSize = 50 * 1024 * 1024; 
    if (fileToValidate.size > maxSize) {
      setError('File is too large. Maximum size is 50MB.');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleRemoveFile = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  // Handle alert sound when weapon detection status changes
  useEffect(() => {
    // Play sound continuously if there are detections
    if (result?.detections && result.detections.length > 0) {
      playAlertSound(true);
    } else {
      playAlertSound(false);
    }
    
    // Cleanup function to stop the sound when component unmounts or detections change
    return () => {
      playAlertSound(false);
    };
  }, [result?.detections, playAlertSound]);
  
  const handleUpload = async () => {
    if (!file) return;
    
    setStatus('uploading');
    setError(null);
    
    try {
      const response = await uploadFile(file);
      setResult(response);
      setStatus('success');
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      setStatus('error');
      // Ensure sound is stopped on error
      playAlertSound(false);
    }
  };

  const isImage = file?.type.startsWith('image/');
  const isVideo = file?.type.startsWith('video/');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6 text-center">Upload Media for Detection</h2>
      
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${!file ? 'border-gray-600 hover:border-blue-500 bg-gray-800' : 'border-transparent'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {!file ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg 
                className="w-16 h-16 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="1.5" 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-lg">Drag & drop an image or video here, or click to select</p>
            <p className="text-sm text-gray-400">Supports: JPG, PNG, GIF, MP4, WebM, QuickTime (max 50MB)</p>
            <div className="mt-4">
              <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded cursor-pointer">
                Select File
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange} 
                  accept={supportedFormats.join(',')}
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              {isImage && (
                <img 
                  src={URL.createObjectURL(file)} 
                  alt="Preview" 
                  className="max-h-64 mx-auto rounded" 
                />
              )}
              {isVideo && (
                <video 
                  src={URL.createObjectURL(file)} 
                  controls 
                  className="max-h-64 mx-auto rounded"
                />
              )}
              <button
                onClick={handleRemoveFile}
                className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                aria-label="Remove file"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-sm text-gray-300">
              <p className="truncate">{file.name}</p>
              <p>{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}</p>
            </div>
            
            <div className="pt-2">
              <button
                onClick={handleUpload}
                disabled={status === 'uploading'}
                className={`px-6 py-2 rounded font-medium w-full ${
                  status === 'uploading'
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {status === 'uploading' ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  'Analyze for Weapons'
                )}
              </button>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-600/20 border border-red-600 rounded text-red-200 text-sm">
                {error}
              </div>
            )}
            
            {status === 'success' && result && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <h3 className="font-bold text-lg mb-2">Analysis Results</h3>
                
                {result.detections && result.detections.length > 0 ? (
                  <div>
                    <div className="mb-3 p-3 bg-red-600/20 border border-red-600 rounded">
                      <p className="font-bold text-red-300">⚠️ Potential threat detected!</p>
                    </div>
                    <div className="space-y-2 mt-3">
                      <p>Detected objects:</p>
                      <ul className="space-y-1">
                        {result.detections.map((detection, idx) => (
                          <li key={idx} className="flex justify-between items-center p-2 bg-gray-700/50 rounded">
                            <span className="capitalize">{detection.class}</span>
                            <span className="text-yellow-300">{(detection.confidence * 100).toFixed(1)}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-green-600/20 border border-green-600 rounded">
                    <p className="font-medium text-green-300">✅ No weapons or threats detected</p>
                  </div>
                )}
                
                {result.resultUrl && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <a 
                      href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${result.resultUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline text-sm"
                    >
                      View processed {isImage ? 'image' : 'video'}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
