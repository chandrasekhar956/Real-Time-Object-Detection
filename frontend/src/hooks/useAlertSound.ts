import { useCallback, useEffect, useRef } from 'react';

const ALERT_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2668/2668-preview.mp3";

export const useAlertSound = () => {
  const alertSoundRef = useRef<HTMLAudioElement | null>(null);
  const alertInterval = useRef<NodeJS.Timeout | null>(null);
  const unlockedRef = useRef<boolean>(false);

  // Initialize audio element
  useEffect(() => {
    alertSoundRef.current = new Audio(ALERT_SOUND_URL);
    alertSoundRef.current.load();
    
    return () => {
      if (alertSoundRef.current) {
        alertSoundRef.current.pause();
        alertSoundRef.current = null;
      }
      if (alertInterval.current) {
        clearInterval(alertInterval.current);
      }
    };
  }, []);

  // Play alert sound repeatedly
  const playAlertSound = useCallback((shouldPlay: boolean) => {
    if (!alertSoundRef.current) return;

    // Clear any existing interval
    if (alertInterval.current) {
      clearInterval(alertInterval.current);
      alertInterval.current = null;
    }

    if (shouldPlay) {
      // Play immediately
      try {
        alertSoundRef.current.currentTime = 0;
        alertSoundRef.current.play().catch(e => console.error('Error playing alert:', e));
      } catch (error) {
        console.error('Error playing alert sound:', error);
      }

      // Set up interval for repeating
      alertInterval.current = setInterval(() => {
        if (alertSoundRef.current) {
          try {
            alertSoundRef.current.currentTime = 0;
            alertSoundRef.current.play().catch(e => console.error('Error playing alert:', e));
          } catch (error) {
            console.error('Error playing alert sound:', error);
          }
        }
      }, 2000); // Repeat every 2 seconds
    } else if (alertSoundRef.current) {
      // Stop any currently playing sound
      alertSoundRef.current.pause();
      alertSoundRef.current.currentTime = 0;
    }
  }, []);

  // Try to unlock audio on a user gesture so browsers allow future play() calls
  const enableAlertSound = useCallback(async () => {
    if (unlockedRef.current) return;
    const audio = alertSoundRef.current;
    if (!audio) return;

    try {
      // Temporarily mute and play to satisfy autoplay policies, then pause and unmute
      audio.muted = true;
      audio.currentTime = 0;
      // Some browsers require play() to be awaited to mark as allowed
      // ignore errors but proceed conservatively
      await audio.play().catch(() => {});
      audio.pause();
      audio.muted = false;
      unlockedRef.current = true;
    } catch (e) {
      console.warn('Unable to unlock alert audio:', e);
    }
  }, []);

  return { playAlertSound, enableAlertSound };
};
