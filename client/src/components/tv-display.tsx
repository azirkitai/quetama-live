import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Volume2, Calendar } from "lucide-react";
import { useActiveTheme, createGradientStyle, createTextGradientStyle } from "@/hooks/useActiveTheme";
import { useQuery } from "@tanstack/react-query";

interface QueueItem {
  id: string;
  name: string;
  number: string;
  room: string;
  status: "waiting" | "calling" | "completed";
  timestamp: Date;
}

interface PrayerTime {
  name: string;
  time: string;
  key?: string;
}

interface PrayerTimesResponse {
  prayerTimes: PrayerTime[];
  date: {
    readable: string;
    timestamp: string;
  };
  location: {
    city: string;
    country: string;
  };
  meta: {
    timezone: string;
    method: string;
  };
}

interface WeatherResponse {
  location: {
    city: string;
    country: string;
  };
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    description: string;
    icon: string;
  };
  units: {
    temperature: string;
    windSpeed: string;
    humidity: string;
  };
}

interface MediaItem {
  url: string;
  type: "image" | "video" | "youtube";
  name?: string;
}

interface TVDisplayProps {
  currentPatient?: QueueItem;
  queueHistory?: QueueItem[];
  clinicName?: string;
  mediaItems?: MediaItem[];
  prayerTimes?: PrayerTime[];
  isFullscreen?: boolean;
  showPrayerTimes?: boolean;
  showWeather?: boolean;
}

export function TVDisplay({ 
  currentPatient,
  queueHistory = [],
  clinicName = "KLINIK UTAMA 24 JAM",
  mediaItems = [],
  prayerTimes = [],
  isFullscreen = false,
  showPrayerTimes = false,
  showWeather = false
}: TVDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Fetch active theme
  const { data: theme } = useActiveTheme();

  // Fetch text groups for styling
  const { data: textGroups = [] } = useQuery({
    queryKey: ['/api/text-groups/active'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch settings for marquee and other display settings
  const { data: settings = [] } = useQuery<Array<{key: string; value: string}>>({
    queryKey: ['/api/settings'],
    staleTime: 30 * 1000, // 30 seconds - shorter for real-time marquee updates
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for live updates
  });

  // Convert settings array to object for easier access
  const settingsObj = settings.reduce((acc: Record<string, string>, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});

  // Extract marquee settings with fallbacks
  const enableMarquee = settingsObj.enableMarquee === 'true';
  const marqueeText = settingsObj.marqueeText || "Selamat datang ke Klinik Kesihatan";
  const marqueeColor = settingsObj.marqueeColor || "#ffffff";
  const marqueeBackgroundColor = settingsObj.marqueeBackgroundColor || "#1e40af";

  // Extract modal highlight box settings
  const modalBackgroundColor = settingsObj.modalBackgroundColor || '#1e293b';
  const modalBorderColor = settingsObj.modalBorderColor || '#fbbf24';
  const modalTextColor = settingsObj.modalTextColor || '#ffffff';

  // Extract clinic logo settings from settings
  const settingsClinicLogo = settingsObj.clinicLogo || '';
  const showClinicLogo = settingsObj.showClinicLogo === 'true';
  
  // Helper function to get background style based on mode (solid vs gradient)
  const getBackgroundStyle = (mode: string | undefined, solidColor: string, gradientValue: string, fallbackColor: string) => {
    if (mode === 'gradient' && gradientValue) {
      return { background: gradientValue };
    }
    return { backgroundColor: solidColor || fallbackColor };
  };
  
  // Universal helper function to get text style based on mode (solid vs gradient)
  const getTextStyle = (mode: string | undefined, solidColor: string, gradientValue: string, fallbackColor: string) => {
    if (mode === 'gradient' && gradientValue) {
      return {
        background: gradientValue,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      };
    }
    return { color: solidColor || fallbackColor };
  };
  
  // Extract individual section settings
  const headerBackgroundMode = settingsObj.headerBackgroundMode || 'solid';
  const headerBackgroundColor = settingsObj.headerBackgroundColor || '#1e40af';
  const headerBackgroundGradient = settingsObj.headerBackgroundGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  
  const callBackgroundMode = settingsObj.callBackgroundMode || 'solid';
  const callBackgroundColor = settingsObj.callBackgroundColor || '#16a34a';
  const callBackgroundGradient = settingsObj.callBackgroundGradient || 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
  
  const prayerTimesBackgroundMode = settingsObj.prayerTimesBackgroundMode || 'solid';
  const prayerTimesBackgroundColor = settingsObj.prayerTimesBackgroundColor || '#7c3aed';
  const prayerTimesBackgroundGradient = settingsObj.prayerTimesBackgroundGradient || 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)';
  
  const weatherBackgroundMode = settingsObj.weatherBackgroundMode || 'solid';
  const weatherBackgroundColor = settingsObj.weatherBackgroundColor || '#f97316';
  const weatherBackgroundGradient = settingsObj.weatherBackgroundGradient || 'linear-gradient(135deg, #fdcb6e 0%, #e84393 100%)';
  
  const queueBackgroundMode = settingsObj.queueBackgroundMode || 'solid';
  const queueBackgroundColor = settingsObj.queueBackgroundColor || '#f3f4f6';
  const queueBackgroundGradient = settingsObj.queueBackgroundGradient || 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)';
  
  const queueItemBackgroundMode = settingsObj.queueItemBackgroundMode || 'solid';
  const queueItemBackgroundColor = settingsObj.queueItemBackgroundColor || '#2563eb';
  const queueItemBackgroundGradient = settingsObj.queueItemBackgroundGradient || 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)';
  
  const historyNameColor = settingsObj.historyNameColor || '#facc15';
  const historyNameMode = settingsObj.historyNameMode || 'solid';
  const historyNameGradient = settingsObj.historyNameGradient || 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
  
  const marqueeBackgroundMode = settingsObj.marqueeBackgroundMode || 'solid';
  const marqueeBackgroundGradient = settingsObj.marqueeBackgroundGradient || 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)';
  
  // Extract text color settings
  const headerTextMode = settingsObj.headerTextMode || 'solid';
  const headerTextColor = settingsObj.headerTextColor || '#ffffff';
  const headerTextGradient = settingsObj.headerTextGradient || 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
  
  const clinicNameTextMode = settingsObj.clinicNameTextMode || 'solid';
  const clinicNameTextColor = settingsObj.clinicNameTextColor || '#ffffff';
  const clinicNameTextGradient = settingsObj.clinicNameTextGradient || 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
  
  
  const callNameTextMode = settingsObj.callNameTextMode || 'solid';
  const callNameTextColor = settingsObj.callNameTextColor || '#ffffff';
  const callNameTextGradient = settingsObj.callNameTextGradient || 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
  
  const windowTextMode = settingsObj.windowTextMode || 'solid';
  const windowTextColor = settingsObj.windowTextColor || '#ffffff';
  const windowTextGradient = settingsObj.windowTextGradient || 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
  
  const prayerTimesTextMode = settingsObj.prayerTimesTextMode || 'solid';
  const prayerTimesTextColor = settingsObj.prayerTimesTextColor || '#ffffff';
  const prayerTimesTextGradient = settingsObj.prayerTimesTextGradient || 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
  
  const weatherTextMode = settingsObj.weatherTextMode || 'solid';
  const weatherTextColor = settingsObj.weatherTextColor || '#ffffff';
  const weatherTextGradient = settingsObj.weatherTextGradient || 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
  
  const queueTextMode = settingsObj.queueTextMode || 'solid';
  const queueTextColor = settingsObj.queueTextColor || '#1f2937';
  const queueTextGradient = settingsObj.queueTextGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  
  const marqueeTextMode = settingsObj.marqueeTextMode || 'solid';
  const marqueeTextGradient = settingsObj.marqueeTextGradient || 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)';

  // Helper function to get text group styles (excluding color/gradient properties that Settings should override)
  const getTextGroupStyles = (groupName: string, excludeColorOverrides = false) => {
    const group = (textGroups as any[]).find((g: any) => g.groupName === groupName);
    if (!group) return {};

    const styles: any = {};
    
    // Always include non-color properties that don't conflict with Settings
    if (group.backgroundColor) styles.backgroundColor = group.backgroundColor;
    if (group.fontSize) styles.fontSize = group.fontSize;
    if (group.fontWeight) styles.fontWeight = group.fontWeight;
    if (group.textAlign) styles.textAlign = group.textAlign;
    
    // Only include color/gradient if not excluding them (so Settings can override)
    if (!excludeColorOverrides) {
      if (group.color) styles.color = group.color;
      
      // Handle gradient (takes precedence over color)
      if (group.gradient) {
        styles.background = group.gradient;
        styles.WebkitBackgroundClip = 'text';
        styles.WebkitTextFillColor = 'transparent';
        styles.backgroundClip = 'text';
      }
    }

    return styles;
  };
  
  // Helper function to create history name text styles
  const getHistoryNameStyle = () => {
    if (historyNameMode === 'gradient') {
      return {
        background: historyNameGradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      };
    }
    return { color: historyNameColor };
  };

  // Location state for prayer times
  const [location, setLocation] = useState<{lat: number; lon: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get user location on component mount
  useEffect(() => {
    if (!showPrayerTimes && !showWeather) return;

    const getLocation = () => {
      if (navigator.geolocation) {
        // Add timeout to prevent hanging indefinitely
        const timeoutId = setTimeout(() => {
          console.warn('Geolocation timeout, using fallback location');
          setLocationError('Location timeout');
          // Fallback to Kuala Lumpur
          setLocation({ lat: 3.139, lon: 101.6869 });
        }, 5000); // 5 second timeout

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            setLocation({
              lat: position.coords.latitude,
              lon: position.coords.longitude
            });
            setLocationError(null);
          },
          (error) => {
            clearTimeout(timeoutId);
            console.warn('Geolocation failed, using fallback location:', error.message);
            setLocationError(error.message);
            // Fallback to Kuala Lumpur
            setLocation({ lat: 3.139, lon: 101.6869 });
          },
          {
            timeout: 4000, // 4 second timeout for getCurrentPosition
            enableHighAccuracy: false
          }
        );
      } else {
        console.warn('Geolocation not supported, using fallback location');
        setLocationError('Geolocation not supported');
        // Fallback to Kuala Lumpur
        setLocation({ lat: 3.139, lon: 101.6869 });
      }
    };

    getLocation();
  }, [showPrayerTimes, showWeather]);

  // Fetch real prayer times from API when showPrayerTimes is enabled and location is available
  const { data: prayerTimesData, isLoading: prayerTimesLoading } = useQuery<PrayerTimesResponse>({
    queryKey: ['/api/prayer-times', location?.lat, location?.lon],
    queryFn: async () => {
      if (!location) throw new Error('Location not available');
      
      const params = new URLSearchParams({
        latitude: location.lat.toString(),
        longitude: location.lon.toString()
      });
      
      const response = await fetch(`/api/prayer-times?${params}`);
      if (!response.ok) throw new Error('Failed to fetch prayer times');
      return response.json();
    },
    enabled: showPrayerTimes && !!location,
    staleTime: 1000 * 60 * 60, // 1 hour - prayer times don't change frequently
    refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
  });

  // Fetch real weather data from API when showWeather is enabled and location is available
  const { data: weatherData, isLoading: weatherLoading } = useQuery<WeatherResponse>({
    queryKey: ['/api/weather', location?.lat, location?.lon],
    queryFn: async () => {
      if (!location) throw new Error('Location not available');
      
      const params = new URLSearchParams({
        latitude: location.lat.toString(),
        longitude: location.lon.toString()
      });
      
      console.log('🌤️ Fetching weather for location:', location);
      const response = await fetch(`/api/weather?${params}`);
      if (!response.ok) throw new Error('Failed to fetch weather data');
      const data = await response.json();
      console.log('🌤️ Weather API response:', data);
      return data;
    },
    enabled: showWeather && !!location,
    staleTime: 1000 * 60 * 15, // 15 minutes - weather changes more frequently
    refetchInterval: 1000 * 60 * 10, // Refetch every 10 minutes
  });

  // Use real prayer times if available, otherwise fall back to props
  const displayPrayerTimes = showPrayerTimes && prayerTimesData?.prayerTimes && prayerTimesData.prayerTimes.length > 0 
    ? prayerTimesData.prayerTimes 
    : (prayerTimes || []);
  
  
  // Client-side highlight computation using browser timezone (more accurate)
  const computeHighlighting = () => {
    if (!showPrayerTimes || !prayerTimesData?.prayerTimes) {
      return { nextPrayer: null, shouldHighlight: false };
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Removed excessive debug logging
    
    // Find next upcoming prayer (for highlighting purpose)
    let nextUpcomingPrayer = null;
    let minTimeUntilNext = Infinity;
    
    for (const prayer of prayerTimesData.prayerTimes) {
      // Clean time string - remove timezone info like "(MYT)"
      const cleanTime = prayer.time.replace(/[^\d:]/g, '');
      const [hours, minutes] = cleanTime.split(':').map(Number);
      
      if (isNaN(hours) || isNaN(minutes)) continue; // Skip invalid times
      
      const prayerTime = hours * 60 + minutes;
      const timeDiff = prayerTime - currentTime;
      
      // If prayer is upcoming today and closer than current minimum
      if (timeDiff > 0 && timeDiff < minTimeUntilNext) {
        nextUpcomingPrayer = prayer;
        minTimeUntilNext = timeDiff;
      }
    }
    
    // If no prayer left today, highlight first prayer of next day (SUBUH)
    if (!nextUpcomingPrayer && prayerTimesData.prayerTimes.length > 0) {
      nextUpcomingPrayer = prayerTimesData.prayerTimes[0]; // First prayer (usually SUBUH)
    }
    
    if (nextUpcomingPrayer) {
      return { nextPrayer: nextUpcomingPrayer.key, shouldHighlight: true };
    }
    
    return { nextPrayer: null, shouldHighlight: false };
  };

  const { nextPrayer, shouldHighlight } = computeHighlighting();
  
  // Animation states
  const [showHighlight, setShowHighlight] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [blinkVisible, setBlinkVisible] = useState(true);
  const [prevPatientId, setPrevPatientId] = useState<string | undefined>(undefined);
  
  // Media slideshow states
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isMediaVisible, setIsMediaVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Timer refs for cleanup
  const highlightTimerRef = useRef<NodeJS.Timeout | null>(null);
  const blinkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Detect new patient call and trigger animation sequence
  useEffect(() => {
    if (currentPatient && currentPatient.id !== prevPatientId) {
      // Clean up any existing timers
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
      if (blinkTimerRef.current) {
        clearInterval(blinkTimerRef.current);
      }
      
      // Reset all animation states
      setShowHighlight(false);
      setIsBlinking(false);
      setBlinkVisible(true);
      
      // Step 1: Show highlight card for 5 seconds
      setShowHighlight(true);
      
      highlightTimerRef.current = setTimeout(() => {
        setShowHighlight(false);
        
        // Step 2: Start blinking after highlight disappears
        setIsBlinking(true);
        setBlinkVisible(true);
        
        // Blink 5 complete cycles (10 toggles: 5 off, 5 on)
        let toggleCount = 0;
        blinkTimerRef.current = setInterval(() => {
          toggleCount++;
          setBlinkVisible(toggleCount % 2 === 1); // true for odd, false for even
          
          if (toggleCount >= 10) { // 5 complete blinks = 10 toggles
            clearInterval(blinkTimerRef.current!);
            setIsBlinking(false);
            setBlinkVisible(true); // Ensure final state is visible
          }
        }, 400); // 400ms per toggle (faster, crisper blinks)
        
      }, 5000); // 5 seconds for highlight

      // Update previous patient ID
      setPrevPatientId(currentPatient.id);
    }
  }, [currentPatient?.id]); // Only depend on patient ID change

  // Media slideshow management 
  useEffect(() => {
    if (mediaItems.length > 1) {
      mediaTimerRef.current = setInterval(() => {
        // Start fade out
        setIsMediaVisible(false);
        
        // After fade out completes, switch media and fade in
        fadeTimerRef.current = setTimeout(() => {
          setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
          setIsMediaVisible(true);
        }, 500); // 500ms fade out duration
        
      }, 10000); // Change media every 10 seconds
      
      return () => {
        if (mediaTimerRef.current) {
          clearInterval(mediaTimerRef.current);
        }
        if (fadeTimerRef.current) {
          clearTimeout(fadeTimerRef.current);
        }
      };
    }
  }, [mediaItems.length]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
      if (blinkTimerRef.current) {
        clearInterval(blinkTimerRef.current);
      }
      if (mediaTimerRef.current) {
        clearInterval(mediaTimerRef.current);
      }
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    return { day, month, year, dayName };
  };

  const dateInfo = formatDate(currentTime);

  // YouTube video helper functions
  const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com/watch') || url.includes('youtu.be/');
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
    }
    return url;
  };

  // Get current media item
  const currentMedia = mediaItems.length > 0 ? mediaItems[currentMediaIndex] : null;

  const containerStyle = isFullscreen ? {
    gridTemplateRows: `36.5625vw 1fr`,
    gridTemplateColumns: `65vw 35vw`,
    gap: 0,
    height: "100dvh",
    width: "100vw",
    margin: 0,
    padding: 0,
    ...getBackgroundStyle(headerBackgroundMode, headerBackgroundColor, headerBackgroundGradient, '#ffffff')
  } : {
    gridTemplateRows: 'auto 1fr',
    gridTemplateColumns: '65% 35%',
    gap: '0',
    ...getBackgroundStyle(headerBackgroundMode, headerBackgroundColor, headerBackgroundGradient, '#ffffff')
  };

  const wrapperClass = isFullscreen 
    ? "fixed inset-0 w-screen h-screen overflow-hidden text-gray-900 grid m-0 p-0"
    : "h-screen text-gray-900 grid";

  return (
    <div className={wrapperClass}
         style={containerStyle} 
         data-testid="tv-display">
      {/* Top Row - Advertisement Area with 16:9 ratio */}
      <div className={`${isFullscreen ? 'm-0 p-0 w-full h-full' : 'p-4 w-full'}`}>
        <div className="overflow-hidden flex items-center justify-center w-full h-full relative" style={{ aspectRatio: '16/9', backgroundColor: '#f3f4f6' }}>
          {currentMedia ? (
            <div 
              className="absolute inset-0 w-full h-full transition-opacity ease-in-out"
              style={{ 
                opacity: isMediaVisible ? 1 : 0,
                transitionDuration: '500ms'
              }}
            >
              {isYouTubeUrl(currentMedia.url) ? (
                <iframe
                  src={getYouTubeEmbedUrl(currentMedia.url)}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  data-testid="youtube-content"
                />
              ) : currentMedia.type === "image" ? (
                <img 
                  src={currentMedia.url} 
                  alt="Media Content" 
                  className="w-full h-full object-cover"
                  data-testid="media-content"
                />
              ) : (
                <video 
                  src={currentMedia.url} 
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  data-testid="media-content"
                />
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-5xl font-bold mb-4" data-testid="no-display-message">
                  NO DISPLAY
                </div>
                <p className="text-lg">Tiada media dimuatnaik</p>
              </div>
            </div>
          )}
          
          {/* Media indicator dots */}
          {mediaItems.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {mediaItems.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentMediaIndex ? 'bg-white shadow-lg' : 'bg-white/50'
                  }`}
                  data-testid={`media-indicator-${index}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Right - Patient Names Header */}
      <div className={`text-white ${isFullscreen ? 'p-0 m-0' : 'p-4'} flex flex-col w-full`}
           style={{
             ...getBackgroundStyle(headerBackgroundMode, headerBackgroundColor, headerBackgroundGradient, '#1d4ed8')
           }}>
        {/* Header */}
        <div className={`text-center ${isFullscreen ? 'mb-2 pt-4 px-4' : 'mb-4'}`}>
          {/* Logo Display - Use uploaded logo if enabled */}
          {showClinicLogo && settingsClinicLogo && (
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img 
                src={settingsClinicLogo} 
                alt="Logo Klinik" 
                className="h-32 w-auto object-contain bg-white rounded-lg p-2 shadow-lg"
                style={{ maxWidth: '350px' }}
                data-testid="clinic-logo"
              />
            </div>
          )}
          <h1 className="font-bold text-[20px]" 
              style={{ 
                fontSize: '20px',
                ...getTextGroupStyles('clinic_name', true), // Exclude color overrides so Settings can override
                ...getTextStyle(clinicNameTextMode, clinicNameTextColor, clinicNameTextGradient, '#ffffff')
              }} 
              data-testid="clinic-name">
            {clinicName}
          </h1>
          <div className="px-4 py-2 rounded-lg mt-2"
               style={{
                 ...getBackgroundStyle(callBackgroundMode, callBackgroundColor, callBackgroundGradient, '#1e40af'),
                 color: '#ffffff'
               }}>
            <h2 className="font-bold" style={{ 
              fontSize: 'clamp(1.75rem, 2.5vw, 2.5rem)',
              ...getTextGroupStyles('title', true), // Exclude color overrides so Settings can override
              ...getTextStyle(callNameTextMode, callNameTextColor, callNameTextGradient, '#ffffff')
            }}>CALLING</h2>
          </div>
        </div>

        {/* Current Patient Display */}
        {currentPatient ? (
          <div className={`${isFullscreen ? 'p-2 mx-4 rounded-md mb-2' : 'p-3 rounded-lg mb-3'} text-center`}
               style={{
                 ...getBackgroundStyle(callBackgroundMode, callBackgroundColor, callBackgroundGradient, '#2563eb')
               }}>
            <div className="font-bold"
                 style={{ 
                   fontSize: 'clamp(2.5rem, 4vw, 4rem)',
                   opacity: isBlinking ? (blinkVisible ? '1' : '0') : '1',
                   transition: isBlinking ? 'none' : 'opacity 300ms ease-in-out',
                   ...getTextStyle(callNameTextMode, callNameTextColor, callNameTextGradient, '#facc15')
                 }} 
                 data-testid="current-patient-display">
              {currentPatient.name}
            </div>
            <div
                 style={{ 
                   fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)',
                   opacity: isBlinking ? (blinkVisible ? '1' : '0') : '1',
                   transition: isBlinking ? 'none' : 'opacity 300ms ease-in-out',
                   ...getTextStyle(windowTextMode, windowTextColor, windowTextGradient, '#facc15')
                 }} 
                 data-testid="current-room">
              {currentPatient.room}
            </div>
          </div>
        ) : (
          <div className={`${isFullscreen ? 'p-2 mx-4 rounded-md mb-2' : 'p-3 rounded-lg mb-3'} text-center`}
               style={{
                 ...getBackgroundStyle(callBackgroundMode, callBackgroundColor, callBackgroundGradient, '#2563eb')
               }}>
            <div className="text-white" style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)' }}>N/A</div>
          </div>
        )}

      </div>

      {/* Second Row Left - Date & Prayer Times Expanded */}
      <div className={`${isFullscreen ? 'px-4 py-2 m-0' : 'px-4 py-2'} text-white w-full h-full flex flex-col justify-center`}
           style={{
             ...getBackgroundStyle(prayerTimesBackgroundMode, prayerTimesBackgroundColor, prayerTimesBackgroundGradient, '#1e40af')
           }}>
        {/* Date/Time Section - Larger */}
        <div className={`bg-white text-gray-900 p-6 ${isFullscreen ? 'rounded-md mb-6' : 'rounded-lg mb-6'} flex items-center justify-center space-x-6`}>
          <div className="bg-teal-500 text-white p-4 rounded-lg">
            <div className="text-center">
              <div className="text-sm">Today</div>
              <div className="text-4xl font-bold">{dateInfo.day}</div>
              <div className="text-sm">Sep</div>
            </div>
          </div>
          <div className="text-center">
            <div className="font-bold text-3xl">{dateInfo.dayName}</div>
            <div className="text-2xl text-gray-600">{dateInfo.month} {dateInfo.year}</div>
            <div className="font-mono font-bold text-4xl" data-testid="display-time">
              {formatTime(currentTime)}
            </div>
          </div>
        </div>

        {/* Prayer Times Section - Conditional with Loading/Error States */}
        {showPrayerTimes && (
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <span className="text-yellow-400 text-3xl">🕌</span>
              <span className="font-bold text-3xl" style={{ ...getTextStyle(prayerTimesTextMode, prayerTimesTextColor, prayerTimesTextGradient, '#facc15') }}>PRAYER TIME</span>
            </div>
            
            {prayerTimesLoading ? (
              <div className="text-white text-xl">
                Loading prayer times...
              </div>
            ) : location ? (
              <div className="text-yellow-300 text-lg mb-4">
                📍 {locationError ? "Kuala Lumpur, Malaysia" : prayerTimesData?.location ? `${prayerTimesData.location.city}, ${prayerTimesData.location.country}` : "Kuala Lumpur, Malaysia"}
              </div>
            ) : null}
            
            {!prayerTimesLoading && displayPrayerTimes.length > 0 && (
              <div className="grid grid-cols-5 gap-4">
                {displayPrayerTimes.map((prayer, index) => {
                  const isCurrentPrayer = nextPrayer === prayer.key && shouldHighlight;
                  
                  return (
                    <div key={prayer.key || index} className="text-center">
                      <div className={`font-bold text-2xl ${isCurrentPrayer ? 'animate-pulse' : ''}`} style={{
                        ...(isCurrentPrayer ? getTextStyle(prayerTimesTextMode, prayerTimesTextColor, prayerTimesTextGradient, '#facc15') : getTextStyle(prayerTimesTextMode, prayerTimesTextColor, prayerTimesTextGradient, '#ffffff'))
                      }}>
                        {prayer.name}
                      </div>
                      <div className={`text-2xl ${isCurrentPrayer ? 'font-bold' : ''}`} style={{
                        ...(isCurrentPrayer ? getTextStyle(prayerTimesTextMode, prayerTimesTextColor, prayerTimesTextGradient, '#facc15') : getTextStyle(prayerTimesTextMode, prayerTimesTextColor, prayerTimesTextGradient, '#ffffff'))
                      }}>
                        {prayer.time}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {!prayerTimesLoading && displayPrayerTimes.length === 0 && (
              <div className="text-white text-xl">
                Prayer times not available
              </div>
            )}
          </div>
        )}

        {/* Weather Section - Real Location-Based Weather */}
        {showWeather && (
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <span className="text-blue-400 text-3xl">🌤️</span>
              <span className="font-bold text-3xl" style={{ ...getTextStyle(weatherTextMode, weatherTextColor, weatherTextGradient, '#60a5fa') }}>WEATHER</span>
            </div>
            
            {/* Fix rendering race condition - better conditional logic */}
            {!location ? (
              <div className="text-white text-xl">
                Detecting location...
              </div>
            ) : weatherLoading ? (
              <div className="text-white text-xl">
                Loading weather data...
              </div>
            ) : weatherData ? (
              <div className="space-y-4">
                {locationError && (
                  <div className="text-yellow-300 text-lg mb-2">
                    Using default location
                  </div>
                )}
                
                {/* Temperature and Icon */}
                <div className="flex items-center justify-center space-x-6">
                  <span className="text-6xl">{weatherData.current.icon}</span>
                  <div className="text-center">
                    <div className="text-5xl font-bold" style={{
                      ...getTextStyle(weatherTextMode, weatherTextColor, weatherTextGradient, '#ffffff')
                    }}>
                      {weatherData.current.temperature}{weatherData.units.temperature}
                    </div>
                    <div className="text-xl" style={{
                      ...getTextStyle(weatherTextMode, weatherTextColor, weatherTextGradient, '#bfdbfe')
                    }}>
                      {weatherData.current.description}
                    </div>
                  </div>
                </div>
                
                {/* Weather Details */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-lg font-semibold" style={{
                      ...getTextStyle(weatherTextMode, weatherTextColor, weatherTextGradient, '#bfdbfe')
                    }}>Humidity</div>
                    <div className="text-2xl" style={{
                      ...getTextStyle(weatherTextMode, weatherTextColor, weatherTextGradient, '#ffffff')
                    }}>{weatherData.current.humidity}{weatherData.units.humidity}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold" style={{
                      ...getTextStyle(weatherTextMode, weatherTextColor, weatherTextGradient, '#bfdbfe')
                    }}>Wind Speed</div>
                    <div className="text-2xl" style={{
                      ...getTextStyle(weatherTextMode, weatherTextColor, weatherTextGradient, '#ffffff')
                    }}>{weatherData.current.windSpeed} {weatherData.units.windSpeed}</div>
                  </div>
                </div>
                
                {/* Location Info - improved labeling */}
                <div className="text-lg" style={{
                  ...getTextStyle(weatherTextMode, weatherTextColor, weatherTextGradient, '#93c5fd')
                }}>
                  📍 {locationError ? "Kuala Lumpur, Malaysia" : `${weatherData.location.city}, ${weatherData.location.country}`}
                </div>
              </div>
            ) : (
              <div className="text-white text-xl">
                Weather data unavailable, retrying...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Second Row Right - Patient Queue */}
      <div className={`text-white ${isFullscreen ? 'p-4' : 'p-4'} flex flex-col w-full h-full`}
           style={{
             ...getBackgroundStyle(queueBackgroundMode, queueBackgroundColor, queueBackgroundGradient, '#1d4ed8')
           }}>
        <div className="grid grid-cols-2 gap-1 text-center mb-2">
          <div className="font-bold" style={{ 
            fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)',
            ...getHistoryNameStyle(),
            ...getTextGroupStyles('Token Label', true) // Exclude color overrides so Settings can override
          }}>NAME</div>
          <div className="font-bold" style={{ 
            fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)',
            ...getHistoryNameStyle(),
            ...getTextGroupStyles('Window Label', true) // Exclude color overrides so Settings can override
          }}>ROOM</div>
        </div>
        <div className="space-y-1 overflow-y-auto flex-1" data-testid="queue-list">
          {queueHistory.length > 0 ? (
            queueHistory.slice(0, 4).map((item) => (
              <div key={item.id} className="p-3 rounded grid grid-cols-2 gap-1"
                   style={{
                     ...getBackgroundStyle(queueItemBackgroundMode, queueItemBackgroundColor, queueItemBackgroundGradient, '#2563eb')
                   }}>
                <div className="font-bold" 
                     style={{ 
                       fontSize: 'clamp(1.25rem, 2vw, 2rem)',
                       ...getHistoryNameStyle()
                     }}>
                  {item.name}
                </div>
                <div 
                     style={{ 
                       fontSize: 'clamp(1.25rem, 2vw, 2rem)',
                       ...getHistoryNameStyle()
                     }}>
                  {item.room}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p style={{ 
                fontSize: 'clamp(1.25rem, 2vw, 2rem)',
                ...getHistoryNameStyle(),
                ...getTextGroupStyles('Patient History', true) // Exclude color overrides so Settings can override
              }}>Tiada dalam barisan</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Floating Marquee Overlay */}
      {isFullscreen && enableMarquee && (
        <div 
          className="fixed bottom-0 left-0 w-full text-white py-2 z-50"
          style={{
            ...getBackgroundStyle(marqueeBackgroundMode, marqueeBackgroundColor, marqueeBackgroundGradient, '#1e40af')
          }}
        >
          <div className="overflow-hidden w-full">
            <div className="inline-flex whitespace-nowrap animate-marquee" data-testid="marquee-container" aria-hidden="false">
              <span 
                className="px-8 font-bold text-2xl" 
                style={{ 
                  fontSize: 'clamp(1.5rem, 2vw, 2rem)',
                  color: marqueeColor
                }}
              >
                {marqueeText}
              </span>
              <span 
                className="px-8 font-bold text-2xl" 
                style={{ 
                  fontSize: 'clamp(1.5rem, 2vw, 2rem)',
                  color: marqueeColor
                }} 
                aria-hidden="true"
              >
                {marqueeText}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Highlight Card Overlay - Rectangle showing name and window */}
      {showHighlight && currentPatient && (
        <div className="fixed inset-0 flex items-center justify-center z-[100]" 
             style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
             data-testid="highlight-overlay">
          {/* Modal Container with Lines Design */}
          <div className="relative p-8 rounded-lg shadow-2xl"
               style={{
                 backgroundColor: modalBackgroundColor,
                 minWidth: '500px',
                 maxWidth: '800px'
               }}>
            
            {/* Corner Lines Design */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top-left corner */}
              <div className="absolute top-0 left-0 w-20 h-0.5" 
                   style={{ backgroundColor: modalBorderColor }}></div>
              <div className="absolute top-0 left-0 w-0.5 h-20" 
                   style={{ backgroundColor: modalBorderColor }}></div>
              
              {/* Top-right corner */}
              <div className="absolute top-0 right-0 w-20 h-0.5" 
                   style={{ backgroundColor: modalBorderColor }}></div>
              <div className="absolute top-0 right-0 w-0.5 h-20" 
                   style={{ backgroundColor: modalBorderColor }}></div>
              
              {/* Bottom-left corner */}
              <div className="absolute bottom-0 left-0 w-20 h-0.5" 
                   style={{ backgroundColor: modalBorderColor }}></div>
              <div className="absolute bottom-0 left-0 w-0.5 h-20" 
                   style={{ backgroundColor: modalBorderColor }}></div>
              
              {/* Bottom-right corner */}
              <div className="absolute bottom-0 right-0 w-20 h-0.5" 
                   style={{ backgroundColor: modalBorderColor }}></div>
              <div className="absolute bottom-0 right-0 w-0.5 h-20" 
                   style={{ backgroundColor: modalBorderColor }}></div>
            </div>

            {/* Modal Content */}
            <div className="text-center space-y-6 relative z-10">
              {/* NAME Label */}
              <div className="text-sm font-semibold tracking-wider mb-2" 
                   style={{ color: modalTextColor, opacity: 0.8 }}>
                NAME
              </div>
              
              {/* Patient Name */}
              <div className="px-8 py-4 rounded border-2"
                   style={{
                     borderColor: modalBorderColor,
                     backgroundColor: 'rgba(0, 0, 0, 0.2)'
                   }}>
                <div className="font-bold" 
                     style={{ 
                       fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                       color: modalTextColor
                     }}
                     data-testid="highlight-patient-name">
                  {currentPatient.name}
                </div>
              </div>

              {/* ROOM Label */}
              <div className="text-sm font-semibold tracking-wider mb-2" 
                   style={{ color: modalTextColor, opacity: 0.8 }}>
                ROOM
              </div>

              {/* Room Name */}
              <div className="px-8 py-4 rounded border-2"
                   style={{
                     borderColor: modalBorderColor,
                     backgroundColor: 'rgba(0, 0, 0, 0.2)'
                   }}>
                <div className="font-bold" 
                     style={{ 
                       fontSize: 'clamp(2rem, 4vw, 3rem)',
                       color: modalTextColor
                     }}
                     data-testid="highlight-patient-room">
                  {currentPatient.room}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}