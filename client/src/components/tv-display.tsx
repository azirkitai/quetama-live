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
           gridTemplateRows: '1fr minmax(160px, 22vh)',
           gridTemplateColumns: '70% 30%'
         }} 
         data-testid="tv-display">
      {/* Main Content Area - Media Display */}
      <div className="px-6 flex items-center">
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

      {/* Right Sidebar - Grid Layout */}
      <div className="pr-6 grid" style={{ gridTemplateRows: 'auto auto 1fr' }}>
        {/* Div 1: Clinic Logo and Name */}
        <Card className="bg-blue-600 text-white mb-2">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              {clinicLogo ? (
                <img 
                  src={clinicLogo} 
                  alt="Logo Klinik" 
                  className="h-12 w-auto object-contain bg-white rounded p-1"
                  data-testid="clinic-logo"
                />
              ) : (
                <div className="w-12 h-12 bg-white rounded flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-xs">KLINIK</span>
                </div>
              )}
              <div>
                <h1 className="font-bold leading-tight" 
                    style={{ fontSize: 'clamp(1.5rem, 3vw, 3rem)' }} 
                    data-testid="clinic-name">
                  {clinicName}
                </h1>
                <p className="text-blue-200" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.5rem)' }}>
                  TROPICANA AMAN
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Div 2: Current Patient Being Called */}
        <Card className="bg-red-600 text-white mb-2">
          <CardContent className="p-3">
            <div className="text-center">
              <h3 className="font-bold mb-2" style={{ fontSize: 'clamp(1.125rem, 2vw, 2rem)' }}>
                SEDANG DIPANGGIL
              </h3>
              {currentPatient ? (
                <>
                  <div className="font-bold mb-2 leading-tight" 
                       style={{ fontSize: 'clamp(2rem, 4vw, 4rem)' }} 
                       data-testid="current-patient-display">
                    {currentPatient.name}
                  </div>
                  <div style={{ fontSize: 'clamp(1rem, 1.5vw, 1.5rem)' }} data-testid="current-room">
                    {currentPatient.room}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)' }}>TIADA PANGGILAN</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Div 3: Patient History - Scrollable */}
        <Card className="bg-white">
          <CardContent className="p-2">
            <div className="text-center mb-2">
              <h3 className="font-bold text-blue-800" style={{ fontSize: 'clamp(1rem, 1.5vw, 1.5rem)' }}>
                SEJARAH PANGGILAN
              </h3>
            </div>
            <div className="space-y-2 overflow-y-auto" 
                 style={{ maxHeight: '200px' }} 
                 data-testid="queue-list">
              {queueHistory.length > 0 ? (
                queueHistory.slice(-4).map((item) => (
                  <div key={item.id} className="p-2 bg-gray-100 rounded text-center">
                    <div className="font-bold text-gray-800" 
                         style={{ fontSize: 'clamp(0.875rem, 1.2vw, 1.25rem)' }}>
                      {item.name}
                    </div>
                    <div className="text-gray-600" 
                         style={{ fontSize: 'clamp(0.75rem, 1vw, 1rem)' }}>
                      {item.room}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-2">
                  <p style={{ fontSize: 'clamp(0.875rem, 1.2vw, 1.25rem)' }}>Tiada sejarah panggilan</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section - Spans Both Columns */}
      <div className="px-6 space-y-1 flex flex-col justify-center" style={{ gridColumn: 'span 2' }}>
        {/* Date & Time Section */}
        <div className="bg-blue-800 text-white p-3 rounded-lg">
          <div className="flex items-center justify-center space-x-4">
            <Calendar className="h-6 w-6" />
            <div className="font-bold" style={{ fontSize: 'clamp(1.25rem, 2vw, 2rem)' }}>
              {dateInfo.dayName}, {dateInfo.day} {dateInfo.month} {dateInfo.year}
            </div>
            <Clock className="h-6 w-6" />
            <div className="font-mono font-bold" 
                 style={{ fontSize: 'clamp(2rem, 4vw, 4rem)' }} 
                 data-testid="display-time">
              {formatTime(currentTime)}
            </div>
          </div>
        </div>
        
        {/* Prayer Times Section */}
        <div className="bg-green-800 text-white p-2 rounded-lg">
          <div className="flex items-center justify-center space-x-4 flex-wrap gap-2">
            <span className="font-bold" style={{ fontSize: 'clamp(1rem, 1.5vw, 1.5rem)' }}>WAKTU SOLAT:</span>
            {prayerTimes.map((prayer, index) => (
              <div key={index} className="text-center">
                <div className="font-bold text-yellow-300" 
                     style={{ fontSize: 'clamp(0.875rem, 1.2vw, 1.25rem)' }}>
                  {prayer.name}
                </div>
                <div style={{ fontSize: 'clamp(0.875rem, 1.2vw, 1.25rem)' }}>
                  {prayer.time}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Welcome Message with Marquee */}
        <div className="bg-gray-800 text-white p-2 rounded-lg overflow-hidden">
          <div className="whitespace-nowrap">
            <div className="inline-block animate-marquee font-bold" 
                 style={{ fontSize: 'clamp(1rem, 1.5vw, 1.5rem)' }}>
              SELAMAT DATANG KE {clinicName} CAWANGAN TROPICANA AMAN, TERIMA KASIH ★ SELAMAT DATANG KE {clinicName} CAWANGAN TROPICANA AMAN, TERIMA KASIH ★ 
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}