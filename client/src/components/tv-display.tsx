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
  clinicLogo?: string;
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
  clinicLogo,
  mediaItems = [],
  prayerTimes = [],
  isFullscreen = false,
  showPrayerTimes = false,
  showWeather = false
}: TVDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Fetch active theme
  const { data: theme } = useActiveTheme();

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
  const displayPrayerTimes = showPrayerTimes && prayerTimesData?.prayerTimes ? prayerTimesData.prayerTimes : prayerTimes;
  
  // Client-side highlight computation using browser timezone (more accurate)
  const computeHighlighting = () => {
    if (!showPrayerTimes || !prayerTimesData?.prayerTimes) {
      return { nextPrayer: null, shouldHighlight: false };
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Find prayer that should be highlighted (within 5 minutes after start)
    for (const prayer of prayerTimesData.prayerTimes) {
      // Clean time string - remove timezone info like "(MYT)"
      const cleanTime = prayer.time.replace(/[^\d:]/g, '');
      const [hours, minutes] = cleanTime.split(':').map(Number);
      
      if (isNaN(hours) || isNaN(minutes)) continue; // Skip invalid times
      
      const prayerTime = hours * 60 + minutes;
      
      // Check if we're within 5 minutes AFTER prayer time started
      const timeDiffAfterPrayer = currentTime - prayerTime;
      if (timeDiffAfterPrayer >= 0 && timeDiffAfterPrayer <= 5) {
        return { nextPrayer: prayer.key, shouldHighlight: true };
      }
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
    padding: 0
  } : {
    gridTemplateRows: 'auto 1fr',
    gridTemplateColumns: '65% 35%',
    gap: '0'
  };

  const wrapperClass = isFullscreen 
    ? "fixed inset-0 w-screen h-screen overflow-hidden bg-white text-gray-900 grid m-0 p-0"
    : "h-screen bg-white text-gray-900 grid";

  return (
    <div className={wrapperClass}
         style={containerStyle} 
         data-testid="tv-display">
      {/* Top Row - Advertisement Area with 16:9 ratio */}
      <div className={`${isFullscreen ? 'm-0 p-0 w-full h-full' : 'p-4 w-full'}`}>
        <div className="bg-gray-100 overflow-hidden flex items-center justify-center w-full h-full relative" style={{ aspectRatio: '16/9' }}>
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
             ...createGradientStyle(theme?.callingGradient, theme?.callingColor || '#1d4ed8')
           }}>
        {/* Header */}
        <div className={`text-center ${isFullscreen ? 'mb-2 pt-4 px-4' : 'mb-4'}`}>
          <div className="flex items-center justify-center space-x-3 mb-2">
            {clinicLogo ? (
              <img 
                src={clinicLogo} 
                alt="Logo Klinik" 
                className="h-16 w-auto object-contain bg-white rounded p-1"
                data-testid="clinic-logo"
              />
            ) : (
              <div className="w-16 h-16 bg-white rounded flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">KLINIK</span>
              </div>
            )}
          </div>
          <h1 className="font-bold text-[30px]" 
              style={{ 
                fontSize: 'clamp(2rem, 3.5vw, 3.5rem)',
                ...createTextGradientStyle(theme?.clinicNameGradient, theme?.clinicNameColor || '#facc15')
              }} 
              data-testid="clinic-name">
            {clinicName}
          </h1>
          <p className="text-yellow-400" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)' }}>
            TROPICANA AMAN
          </p>
          <div className="px-4 py-2 rounded-lg mt-2"
               style={{
                 ...createGradientStyle(theme?.callingGradient, theme?.callingColor || '#1e40af'),
                 color: theme?.callingGradient ? '#ffffff' : '#ffffff'
               }}>
            <h2 className="font-bold" style={{ fontSize: 'clamp(1.75rem, 2.5vw, 2.5rem)' }}>CALLING</h2>
          </div>
        </div>

        {/* Current Patient Display */}
        {currentPatient ? (
          <div className={`bg-blue-600 ${isFullscreen ? 'p-2 mx-4 rounded-md mb-2' : 'p-3 rounded-lg mb-3'} text-center`}>
            <div className="font-bold text-yellow-400"
                 style={{ 
                   fontSize: 'clamp(2.5rem, 4vw, 4rem)',
                   opacity: isBlinking ? (blinkVisible ? '1' : '0') : '1',
                   transition: isBlinking ? 'none' : 'opacity 300ms ease-in-out'
                 }} 
                 data-testid="current-patient-display">
              {currentPatient.name}
            </div>
            <div className="text-yellow-400"
                 style={{ 
                   fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)',
                   opacity: isBlinking ? (blinkVisible ? '1' : '0') : '1',
                   transition: isBlinking ? 'none' : 'opacity 300ms ease-in-out'
                 }} 
                 data-testid="current-room">
              {currentPatient.room}
            </div>
          </div>
        ) : (
          <div className={`${isFullscreen ? 'p-2 mx-4 rounded-md mb-2' : 'p-3 rounded-lg mb-3'} text-center`}
               style={{
                 ...createGradientStyle(theme?.highlightBoxGradient, theme?.highlightBoxColor || '#2563eb')
               }}>
            <div className="text-white" style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)' }}>N/A</div>
          </div>
        )}

      </div>

      {/* Second Row Left - Date & Prayer Times Expanded */}
      <div className={`${isFullscreen ? 'px-4 py-2 m-0' : 'px-4 py-2'} bg-blue-800 text-white w-full h-full flex flex-col justify-center`}>
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
              <span className="font-bold text-3xl text-yellow-400">PRAYER TIME</span>
            </div>
            
            {prayerTimesLoading ? (
              <div className="text-white text-xl">
                Loading prayer times...
              </div>
            ) : location ? (
              <div className="text-yellow-300 text-lg mb-4">
                📍 {locationError ? "Kuala Lumpur, Malaysia" : "Kawasan Tempatan"}
              </div>
            ) : null}
            
            {!prayerTimesLoading && displayPrayerTimes.length > 0 && (
              <div className="grid grid-cols-5 gap-4">
                {displayPrayerTimes.map((prayer, index) => {
                  const isCurrentPrayer = nextPrayer === prayer.key && shouldHighlight;
                  
                  return (
                    <div key={prayer.key || index} className="text-center">
                      <div className={`font-bold text-2xl ${isCurrentPrayer ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>
                        {prayer.name}
                      </div>
                      <div className={`text-2xl ${isCurrentPrayer ? 'text-red-300 font-bold' : 'text-white'}`}>
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
              <span className="font-bold text-3xl text-blue-400">WEATHER</span>
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
                    <div className="text-5xl font-bold text-white">
                      {weatherData.current.temperature}{weatherData.units.temperature}
                    </div>
                    <div className="text-xl text-blue-200">
                      {weatherData.current.description}
                    </div>
                  </div>
                </div>
                
                {/* Weather Details */}
                <div className="grid grid-cols-2 gap-6 text-white">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-200">Humidity</div>
                    <div className="text-2xl">{weatherData.current.humidity}{weatherData.units.humidity}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-200">Wind Speed</div>
                    <div className="text-2xl">{weatherData.current.windSpeed} {weatherData.units.windSpeed}</div>
                  </div>
                </div>
                
                {/* Location Info - improved labeling */}
                <div className="text-blue-300 text-lg">
                  📍 {locationError ? "Kuala Lumpur, Malaysia" : "Kawasan Tempatan"}
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
      <div className={`bg-blue-700 text-white ${isFullscreen ? 'p-4' : 'p-4'} flex flex-col w-full h-full`}>
        <div className="grid grid-cols-2 gap-1 text-center mb-2">
          <div className="font-bold text-yellow-400" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)' }}>NAME</div>
          <div className="font-bold text-yellow-400" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)' }}>ROOM</div>
        </div>
        <div className="space-y-1 overflow-y-auto flex-1" data-testid="queue-list">
          {queueHistory.length > 0 ? (
            queueHistory.slice(0, 4).map((item) => (
              <div key={item.id} className="bg-blue-600 p-3 rounded grid grid-cols-2 gap-1">
                <div className="font-bold" 
                     style={{ 
                       fontSize: 'clamp(1.25rem, 2vw, 2rem)',
                       ...createTextGradientStyle(theme?.historyNameGradient, theme?.historyNameColor || '#facc15')
                     }}>
                  {item.name}
                </div>
                <div className="text-yellow-400" 
                     style={{ fontSize: 'clamp(1.25rem, 2vw, 2rem)' }}>
                  {item.room}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-yellow-400 py-4">
              <p style={{ fontSize: 'clamp(1.25rem, 2vw, 2rem)' }}>Tiada dalam barisan</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Floating Marquee Overlay */}
      {isFullscreen && (
        <div className="fixed bottom-0 left-0 w-full bg-blue-800 bg-opacity-90 text-white py-2 z-50">
          <div className="overflow-hidden w-full">
            <div className="inline-flex whitespace-nowrap animate-marquee" data-testid="marquee-container" aria-hidden="false">
              <span className="px-8 font-bold text-2xl" style={{ fontSize: 'clamp(1.5rem, 2vw, 2rem)' }}>
                SELAMAT DATANG KE {clinicName} CAWANGAN TROPICANA AMAN, TERIMA KASIH
              </span>
              <span className="px-8 font-bold text-2xl" style={{ fontSize: 'clamp(1.5rem, 2vw, 2rem)' }} aria-hidden="true">
                SELAMAT DATANG KE {clinicName} CAWANGAN TROPICANA AMAN, TERIMA KASIH
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
          <div className="px-16 py-8 shadow-2xl border-4"
               style={{
                 ...createGradientStyle(theme?.highlightBoxGradient, theme?.highlightBoxColor || '#2563eb'),
                 borderColor: theme?.highlightBoxColor || '#facc15'
               }}>
            <div className="text-center space-y-4">
              <div className="text-white font-bold" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}
                   data-testid="highlight-patient-name">
                {currentPatient.name}
              </div>
              <div className="font-bold" 
                   style={{ 
                     fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                     color: theme?.highlightBoxGradient ? '#ffffff' : '#ffffff'
                   }}
                   data-testid="highlight-patient-room">
                {currentPatient.room}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}