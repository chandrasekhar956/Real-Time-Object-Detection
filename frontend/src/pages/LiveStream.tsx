import React, { useState, useEffect, useRef } from "react";
import { getWebcamStream, getRtspStream, getDetectionStatus } from "../lib/api";
import { useAlertSound } from "../hooks/useAlertSound";

const LiveStream: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'webcam' | 'rtsp'>('webcam');
  const [rtspUrl, setRtspUrl] = useState('');
  const [cameraId, setCameraId] = useState('0');
  const [isStreaming, setIsStreaming] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState<{
    detected: boolean;
    objects?: Array<{class: string; confidence: number}>;
  }>({ detected: false });
  const videoRef = useRef<HTMLImageElement>(null);
  const statusInterval = useRef<number | null>(null);
  const prevDetectionStatus = useRef<boolean>(false);
  const { playAlertSound } = useAlertSound();

  // Update stream source when settings change
  useEffect(() => {
    if (isStreaming) {
      startStream();
    }
    return () => {
      if (statusInterval.current) {
        clearInterval(statusInterval.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, cameraId, rtspUrl]);

  // Handle alert sound when weapon is detected
  useEffect(() => {
    playAlertSound(detectionStatus.detected);
  }, [detectionStatus.detected, playAlertSound]);

  const startStream = () => {
    if (statusInterval.current) {
      clearInterval(statusInterval.current);
    }

    // Start polling for detection status
    const fetchStatus = async () => {
      try {
        console.log('Fetching detection status...');
        const status = await getDetectionStatus();
        console.log('Received status:', status);
        
        // Update detection status
        setDetectionStatus(prev => ({
          ...prev,
          ...status
        }));
        
        // Update previous detection status
        prevDetectionStatus.current = status.detected;
      } catch (error) {
        console.error('Error getting detection status:', error);
        // Set a default status if there's an error
        setDetectionStatus({
          detected: false,
          objects: []
        });
      }
    };

    // Initial fetch
    fetchStatus();
    
    // Set up interval for polling
    statusInterval.current = window.setInterval(fetchStatus, 1000); // Poll every second

    setIsStreaming(true);
  };

  const stopStream = () => {
    if (statusInterval.current) {
      clearInterval(statusInterval.current);
      statusInterval.current = null;
    }
    setIsStreaming(false);
  };

  const toggleStream = () => {
    if (isStreaming) {
      stopStream();
    } else {
      startStream();
    }
  };

  const getStreamUrl = () => {
    if (activeTab === 'webcam') {
      return getWebcamStream(cameraId);
    } else {
      return getRtspStream(rtspUrl);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">Live Object Detection</h2>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700 mb-6">
        <button
          className={`px-6 py-2 font-medium ${activeTab === 'webcam' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('webcam')}
        >
          Webcam
        </button>
        <button
          className={`px-6 py-2 font-medium ${activeTab === 'rtsp' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('rtsp')}
        >
          RTSP Stream
        </button>
      </div>

      {/* Stream Controls */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        {activeTab === 'webcam' ? (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Camera Device ID</label>
            <input
              type="text"
              value={cameraId}
              onChange={(e) => setCameraId(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="0 (default camera)"
              disabled={isStreaming}
            />
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">RTSP Stream URL</label>
            <input
              type="text"
              value={rtspUrl}
              onChange={(e) => setRtspUrl(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="rtsp://username:password@ip:port/stream"
              disabled={isStreaming}
            />
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={toggleStream}
            className={`px-6 py-2 rounded font-medium ${isStreaming ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isStreaming ? 'Stop Stream' : 'Start Stream'}
          </button>
        </div>
      </div>

      {/* Video Stream */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        {isStreaming ? (
          <img
            ref={videoRef}
            src={getStreamUrl()}
            alt="Live stream"
            className="w-full h-auto max-h-[70vh] mx-auto"
          />
        ) : (
          <div className="flex items-center justify-center h-64 bg-gray-900 text-gray-500">
            <p>Stream will appear here when started</p>
          </div>
        )}

        {/* Detection Status */}
        <div className={`absolute top-4 right-4 p-3 rounded-lg ${detectionStatus.detected ? 'bg-red-600' : 'bg-green-600'}`}>
          <p className="font-bold">
            {detectionStatus.detected ? 'WEAPON DETECTED!' : 'No threats detected'}
          </p>
          {detectionStatus.objects && detectionStatus.objects.length > 0 && (
            <div className="mt-2 text-sm">
              <p>Detected objects:</p>
              <ul className="list-disc pl-5">
                {detectionStatus.objects.map((obj, index) => (
                  <li key={index}>
                    {obj.class} ({(obj.confidence * 100).toFixed(1)}%)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveStream;
