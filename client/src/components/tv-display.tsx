import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Volume2, Calendar } from "lucide-react";

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
}

interface TVDisplayProps {
  currentPatient?: QueueItem;
  queueHistory?: QueueItem[];
  clinicName?: string;
  clinicLogo?: string;
  mediaContent?: string;
  mediaType?: "image" | "video";
  prayerTimes?: PrayerTime[];
  isFullscreen?: boolean;
}

export function TVDisplay({ 
  currentPatient,
  queueHistory = [],
  clinicName = "KLINIK UTAMA 24 JAM",
  clinicLogo,
  mediaContent,
  mediaType = "image",
  prayerTimes = [
    { name: "SUBUH", time: "05:46 AM" },
    { name: "ZOHOR", time: "13:05 PM" },
    { name: "ASAR", time: "16:15 PM" },
    { name: "MAGHRIB", time: "19:08 PM" },
    { name: "ISYAK", time: "20:17 PM" }
  ],
  isFullscreen = false
}: TVDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
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
        <div className="bg-gray-100 overflow-hidden flex items-center justify-center w-full h-full" style={{ aspectRatio: '16/9' }}>
          {mediaContent ? (
            mediaType === "image" ? (
              <img 
                src={mediaContent} 
                alt="Media Content" 
                className="w-full h-full object-cover"
                data-testid="media-content"
              />
            ) : (
              <video 
                src={mediaContent} 
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                data-testid="media-content"
              />
            )
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
        </div>
      </div>

      {/* Top Right - Patient Names Header */}
      <div className={`bg-blue-700 text-white ${isFullscreen ? 'p-0 m-0' : 'p-4'} flex flex-col w-full`}>
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
          <h1 className="font-bold text-yellow-400 text-[30px]" 
              style={{ fontSize: 'clamp(2rem, 3.5vw, 3.5rem)' }} 
              data-testid="clinic-name">
            {clinicName}
          </h1>
          <p className="text-yellow-400" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)' }}>
            TROPICANA AMAN
          </p>
          <div className="bg-blue-800 text-yellow-400 px-4 py-2 rounded-lg mt-2">
            <h2 className="font-bold" style={{ fontSize: 'clamp(1.75rem, 2.5vw, 2.5rem)' }}>CALLING</h2>
          </div>
        </div>

        {/* Current Patient Display */}
        {currentPatient ? (
          <div className={`bg-blue-600 ${isFullscreen ? 'p-2 mx-4 rounded-md mb-2' : 'p-3 rounded-lg mb-3'} text-center`}>
            <div className="font-bold text-yellow-400" 
                 style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)' }} 
                 data-testid="current-patient-display">
              {currentPatient.name}
            </div>
            <div className="text-yellow-400" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)' }} data-testid="current-room">
              {currentPatient.room}
            </div>
          </div>
        ) : (
          <div className={`bg-blue-600 ${isFullscreen ? 'p-2 mx-4 rounded-md mb-2' : 'p-3 rounded-lg mb-3'} text-center`}>
            <div className="text-yellow-400" style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)' }}>N/A</div>
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

        {/* Prayer Times Section - Larger */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <span className="text-yellow-400 text-3xl">🏠</span>
            <span className="font-bold text-3xl text-yellow-400">PRAYER TIME</span>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {prayerTimes.map((prayer, index) => (
              <div key={index} className="text-center">
                <div className="font-bold text-yellow-400 text-2xl">{prayer.name}</div>
                <div className="text-white text-2xl">{prayer.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row Right - Patient Queue */}
      <div className={`bg-blue-700 text-white ${isFullscreen ? 'p-4' : 'p-4'} flex flex-col w-full h-full`}>
        <div className="grid grid-cols-2 gap-1 text-center mb-2">
          <div className="font-bold text-yellow-400" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)' }}>NAME</div>
          <div className="font-bold text-yellow-400" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)' }}>ROOM</div>
        </div>
        <div className="space-y-1 overflow-y-auto flex-1" data-testid="queue-list">
          {queueHistory.length > 0 ? (
            queueHistory.slice(-4).map((item) => (
              <div key={item.id} className="bg-blue-600 p-3 rounded grid grid-cols-2 gap-1">
                <div className="font-bold text-yellow-400" 
                     style={{ fontSize: 'clamp(1.25rem, 2vw, 2rem)' }}>
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
    </div>
  );
}