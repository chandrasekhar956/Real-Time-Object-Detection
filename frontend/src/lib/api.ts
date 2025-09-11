const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

/**
 * Upload a file for object detection
 * @param file The file to upload (image or video)
 * @returns Detection results
 */
export async function uploadFile(file: File): Promise<{message: string; resultUrl?: string; detections?: any[]}> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Upload failed');
  }

  return response.json();
}

/**
 * Start webcam stream detection
 * @param cameraId The camera device ID (default: 0 for default camera)
 * @returns The URL to the MJPEG stream
 */
export function getWebcamStream(cameraId: string | number = 0): string {
  return `${API_BASE}/video${cameraId ? `?camera=${cameraId}` : ''}`;
}

/**
 * Start RTSP stream detection
 * @param rtspUrl The RTSP stream URL
 * @returns The URL to the MJPEG stream
 */
export function getRtspStream(rtspUrl: string): string {
  return `${API_BASE}/cctv?stream=${encodeURIComponent(rtspUrl)}`;
}

/**
 * Get the current detection status
 * @returns Object containing detection status and any active alerts
 */
export async function getDetectionStatus(): Promise<{
  detected: boolean;
  timestamp?: string;
  objects?: Array<{class: string; confidence: number}>;
  error?: string;
}> {
  const response = await fetch(`${API_BASE}/detection-status`);
  if (!response.ok) {
    throw new Error('Failed to get detection status');
  }
  return response.json();
}

/**
 * Stop a running stream
 * @param streamId The ID of the stream to stop
 * @returns Promise that resolves when the stream is stopped
 */
export async function stopStream(streamId: string): Promise<{status: string; stream_id: string}> {
  const response = await fetch(`${API_BASE}/stop-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ stream_id: streamId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to stop stream');
  }

  return response.json();
}

/**
 * Start a detection session
 * @param type Type of detection ('webcam', 'rtsp')
 * @param source Source identifier (camera ID or RTSP URL)
 * @returns Response message
 */
export async function startDetection(type: 'webcam' | 'rtsp', source: string): Promise<{message: string}> {
  const response = await fetch(`${API_BASE}/start-detection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, source }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to start detection');
  }

  return response.json();
}

/**
 * Stop the current detection session
 * @returns Response message
 */
export async function stopDetection(): Promise<{message: string}> {
  const response = await fetch(`${API_BASE}/stop-detection`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to stop detection');
  }

  return response.json();
}
