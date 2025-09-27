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
    <div className="min-h-screen bg-white text-gray-900 relative" data-testid="tv-display">
      {/* Floating Clinic Logo and Name - Top Right */}
      <div className="absolute top-6 right-6 z-20 flex items-center space-x-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
        {clinicLogo ? (
          <img 
            src={clinicLogo} 
            alt="Logo Klinik" 
            className="h-16 w-auto object-contain"
            data-testid="clinic-logo"
          />
        ) : (
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">KLINIK</span>
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold text-blue-800" data-testid="clinic-name">
            {clinicName}
          </h1>
          <p className="text-sm text-gray-600">TROPICANA AMAN</p>
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Main Content Area - Full Height Media Display */}
        <div className="flex-1 p-6">
          <div className="h-full bg-gray-100 rounded-lg overflow-hidden">
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
                  <div className="text-6xl font-bold mb-4" data-testid="no-display-message">
                    NO DISPLAY
                  </div>
                  <p className="text-xl">Tiada media dimuatnaik</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Queue and Information */}
        <div className="w-80 p-6 space-y-4">
          {/* Current Calling Display */}
          <Card className="bg-blue-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className="text-lg font-bold mb-2">CALLING</h3>
                {currentPatient ? (
                  <>
                    <div className="text-2xl font-bold mb-2" data-testid="current-patient-display">
                      {currentPatient.name}
                    </div>
                    <div className="text-lg" data-testid="current-room">
                      {currentPatient.room}
                    </div>
                  </>
                ) : (
                  <div className="text-xl text-blue-200">N/A</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Queue List */}
          <Card className="bg-white flex-1">
            <CardContent className="p-4">
              <div className="flex justify-between text-sm font-bold mb-3 pb-2 border-b">
                <span>NAME</span>
                <span>ROOM</span>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto" data-testid="queue-list">
                {queueHistory.length > 0 ? (
                  queueHistory.slice(-15).map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 px-2 bg-yellow-100 rounded text-sm">
                      <span className="font-medium text-yellow-800">{item.name}</span>
                      <span className="text-gray-600">{item.room}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>Tiada senarai giliran</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section - Date, Time and Prayer Times */}
      <div className="bg-blue-800 text-white p-4">
        <div className="flex items-center justify-between">
          {/* Left: Date and Time */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-4">
              <Calendar className="h-6 w-6" />
              <div>
                <div className="text-lg font-bold">{dateInfo.dayName}, {dateInfo.day} {dateInfo.month} {dateInfo.year}</div>
                <div className="text-sm text-blue-200">Tarikh Hari Ini</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Clock className="h-6 w-6" />
              <div>
                <div className="text-2xl font-mono font-bold" data-testid="display-time">
                  {formatTime(currentTime)}
                </div>
                <div className="text-sm text-blue-200">Waktu Semasa</div>
              </div>
            </div>
          </div>

          {/* Right: Prayer Times */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <span className="font-bold">WAKTU SOLAT</span>
            </div>
            {prayerTimes.map((prayer, index) => (
              <div key={index} className="text-center">
                <div className="text-sm font-bold text-yellow-300">{prayer.name}</div>
                <div className="text-xs">{prayer.time}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 text-center text-sm">
          <span>SELAMAT DATANG KE {clinicName} CAWANGAN TROPICANA AMAN, TERIMA KASIH</span>
        </div>
      </div>
    </div>
  );
}