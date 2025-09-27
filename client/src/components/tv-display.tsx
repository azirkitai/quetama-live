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
      <div className="flex h-[calc(100vh-120px)]">
        {/* Main Content Area - Media Display (Smaller) */}
        <div className="w-2/3 p-6">
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

        {/* Right Sidebar - 3 Vertical Divs */}
        <div className="w-1/3 p-6 space-y-4">
          {/* Div 1: Clinic Logo and Name */}
          <Card className="bg-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
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
                  <h1 className="text-4xl font-bold" data-testid="clinic-name">
                    {clinicName}
                  </h1>
                  <p className="text-2xl text-blue-200">TROPICANA AMAN</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Div 2: Current Patient Being Called */}
          <Card className="bg-red-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className="text-3xl font-bold mb-4">SEDANG DIPANGGIL</h3>
                {currentPatient ? (
                  <>
                    <div className="text-6xl font-bold mb-4" data-testid="current-patient-display">
                      {currentPatient.name}
                    </div>
                    <div className="text-2xl" data-testid="current-room">
                      {currentPatient.room}
                    </div>
                  </>
                ) : (
                  <div className="text-3xl">TIADA PANGGILAN</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Div 3: Patient History */}
          <Card className="bg-white flex-1">
            <CardContent className="p-4">
              <div className="text-center mb-4">
                <h3 className="text-3xl font-bold text-blue-800">SEJARAH PANGGILAN</h3>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto" data-testid="queue-list">
                {queueHistory.length > 0 ? (
                  queueHistory.slice(-15).map((item) => (
                    <div key={item.id} className="p-4 bg-gray-100 rounded text-center">
                      <div className="text-2xl font-bold text-gray-800">{item.name}</div>
                      <div className="text-lg text-gray-600">{item.room}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <p className="text-2xl">Tiada sejarah panggilan</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section - Date, Time and Prayer Times (Same Width as Display Only) */}
      <div className="flex">
        <div className="w-2/3 px-6">
          <div className="bg-blue-800 text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between space-x-6">
              {/* Date */}
              <div className="flex items-center space-x-3">
                <Calendar className="h-8 w-8" />
                <div className="text-2xl font-bold">
                  {dateInfo.dayName}, {dateInfo.day} {dateInfo.month} {dateInfo.year}
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center space-x-3">
                <Clock className="h-8 w-8" />
                <div className="text-5xl font-mono font-bold" data-testid="display-time">
                  {formatTime(currentTime)}
                </div>
              </div>

              {/* Prayer Times */}
              <div className="flex items-center space-x-4">
                <span className="font-bold text-2xl">WAKTU SOLAT:</span>
                {prayerTimes.map((prayer, index) => (
                  <div key={index} className="text-center">
                    <div className="text-lg font-bold text-yellow-300">{prayer.name}</div>
                    <div className="text-lg">{prayer.time}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 text-center text-2xl">
              <span>SELAMAT DATANG KE {clinicName} CAWANGAN TROPICANA AMAN, TERIMA KASIH</span>
            </div>
          </div>
        </div>
        <div className="w-1/3"></div>
      </div>
    </div>
  );
}