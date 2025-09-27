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
    <div className="min-h-screen bg-white text-gray-900" data-testid="tv-display">
      {/* Top Row - Clinic Info and Patient Calling */}
      <div className="bg-white border-b-2 border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {/* Left: Clinic Logo and Name */}
          <div className="flex items-center space-x-4">
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

          {/* Right: Current Patient Calling */}
          <div className="flex items-center">
            {currentPatient ? (
              <div className="bg-blue-600 text-white px-6 py-3 rounded-lg text-center">
                <div className="text-sm font-bold">SEDANG DIPANGGIL</div>
                <div className="text-xl font-bold" data-testid="current-patient-display">
                  {currentPatient.name}
                </div>
                <div className="text-sm" data-testid="current-room">
                  {currentPatient.room}
                </div>
              </div>
            ) : (
              <div className="bg-gray-400 text-white px-6 py-3 rounded-lg text-center">
                <div className="text-sm font-bold">TIADA PANGGILAN</div>
                <div className="text-lg">N/A</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-160px)]">
        {/* Main Content Area - Media Display (Smaller) */}
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
                  <div className="text-5xl font-bold mb-4" data-testid="no-display-message">
                    NO DISPLAY
                  </div>
                  <p className="text-lg">Tiada media dimuatnaik</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Patient Names Only */}
        <div className="w-72 p-6">
          <Card className="bg-white h-full">
            <CardContent className="p-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-blue-800">SENARAI PESAKIT</h3>
              </div>
              <div className="space-y-3 max-h-full overflow-y-auto" data-testid="queue-list">
                {queueHistory.length > 0 ? (
                  queueHistory.slice(-20).map((item, index) => (
                    <div key={item.id} className="p-3 bg-yellow-100 rounded-lg text-center">
                      <div className="text-lg font-bold text-yellow-800">{item.name}</div>
                      <div className="text-sm text-gray-600">{item.room}</div>
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

      {/* Bottom Row - Date, Time and Prayer Times (One Long Line) */}
      <div className="bg-blue-800 text-white p-4">
        <div className="flex items-center justify-between space-x-8">
          {/* Date */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <div className="text-lg font-bold">
              {dateInfo.dayName}, {dateInfo.day} {dateInfo.month} {dateInfo.year}
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <div className="text-xl font-mono font-bold" data-testid="display-time">
              {formatTime(currentTime)}
            </div>
          </div>

          {/* Prayer Times */}
          <div className="flex items-center space-x-6">
            <span className="font-bold">WAKTU SOLAT:</span>
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