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
  ]
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

  return (
    <div className="h-screen bg-white text-gray-900 grid" 
         style={{ 
           gridTemplateRows: '1fr 180px',
           gridTemplateColumns: '65% 35%',
           gap: '0'
         }} 
         data-testid="tv-display">
      {/* Main Content Area - Media Display */}
      <div className="p-4 flex items-center">
        <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            {mediaContent ? (
              mediaType === "image" ? (
                <img 
                  src={mediaContent} 
                  alt="Media Content" 
                  className="w-full h-full object-contain"
                  data-testid="media-content"
                />
              ) : (
                <video 
                  src={mediaContent} 
                  className="w-full h-full object-contain"
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

      {/* Right Panel - Queue Board Style */}
      <div className="bg-blue-700 text-white p-4 flex flex-col">
        {/* Header */}
        <div className="text-center mb-4">
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
          <h1 className="font-bold text-yellow-400" 
              style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)' }} 
              data-testid="clinic-name">
            {clinicName}
          </h1>
          <p className="text-yellow-400" style={{ fontSize: 'clamp(1rem, 1.5vw, 1.5rem)' }}>
            TROPICANA AMAN
          </p>
          <div className="bg-blue-800 text-yellow-400 px-4 py-2 rounded-lg mt-2">
            <h2 className="font-bold" style={{ fontSize: 'clamp(1.25rem, 2vw, 2rem)' }}>CALLING</h2>
          </div>
        </div>

        {/* Current Patient Display */}
        {currentPatient ? (
          <div className="bg-blue-600 p-3 rounded-lg mb-3 text-center">
            <div className="font-bold text-yellow-400" 
                 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)' }} 
                 data-testid="current-patient-display">
              {currentPatient.name}
            </div>
            <div className="text-yellow-400" style={{ fontSize: 'clamp(1rem, 1.5vw, 1.5rem)' }} data-testid="current-room">
              {currentPatient.room}
            </div>
          </div>
        ) : (
          <div className="bg-blue-600 p-3 rounded-lg mb-3 text-center">
            <div className="text-yellow-400" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)' }}>N/A</div>
          </div>
        )}

        {/* Queue List */}
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-1 text-center mb-2">
            <div className="font-bold text-yellow-400" style={{ fontSize: 'clamp(1rem, 1.5vw, 1.5rem)' }}>NAME</div>
            <div className="font-bold text-yellow-400" style={{ fontSize: 'clamp(1rem, 1.5vw, 1.5rem)' }}>ROOM</div>
          </div>
          <div className="space-y-1 overflow-y-auto" style={{ maxHeight: '300px' }} data-testid="queue-list">
            {queueHistory.length > 0 ? (
              queueHistory.slice(-6).map((item) => (
                <div key={item.id} className="bg-blue-600 p-2 rounded grid grid-cols-2 gap-1">
                  <div className="font-bold text-yellow-400" 
                       style={{ fontSize: 'clamp(0.875rem, 1.2vw, 1.25rem)' }}>
                    {item.name}
                  </div>
                  <div className="text-yellow-400" 
                       style={{ fontSize: 'clamp(0.875rem, 1.2vw, 1.25rem)' }}>
                    {item.room}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-yellow-300 py-4">
                <p style={{ fontSize: 'clamp(0.875rem, 1.2vw, 1.25rem)' }}>Tiada dalam barisan</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section - Spans Both Columns */}
      <div className="px-4 py-2 bg-blue-800 text-white" style={{ gridColumn: 'span 2' }}>
        <div className="flex items-center justify-between">
          {/* Left - Calendar Widget */}
          <div className="bg-white text-gray-900 p-3 rounded-lg flex items-center space-x-3">
            <div className="bg-teal-500 text-white p-2 rounded">
              <div className="text-center">
                <div className="text-xs">Today</div>
                <div className="text-2xl font-bold">{dateInfo.day}</div>
                <div className="text-xs">Sep</div>
              </div>
            </div>
            <div>
              <div className="font-bold text-lg">{dateInfo.dayName}</div>
              <div className="text-sm text-gray-600">{dateInfo.month} {dateInfo.year}</div>
              <div className="font-mono font-bold text-lg" data-testid="display-time">
                {formatTime(currentTime)}
              </div>
            </div>
          </div>

          {/* Center - Prayer Times */}
          <div className="flex-1 mx-8">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-yellow-400">🏠</span>
              <span className="font-bold text-lg text-yellow-400">PRAYER TIME</span>
            </div>
            <div className="flex justify-center space-x-6">
              {prayerTimes.map((prayer, index) => (
                <div key={index} className="text-center">
                  <div className="font-bold text-yellow-400 text-sm">{prayer.name}</div>
                  <div className="text-white text-sm">{prayer.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Empty space for balance */}
          <div className="w-48"></div>
        </div>
        
        {/* Bottom Marquee */}
        <div className="mt-3 overflow-hidden">
          <div className="whitespace-nowrap">
            <div className="inline-block animate-marquee font-bold text-lg">
              SELAMAT DATANG KE {clinicName} CAWANGAN TROPICANA AMAN, TERIMA KASIH
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}