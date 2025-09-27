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
      <div className="flex h-auto">
        {/* Main Content Area - Media Display (Larger for TV) */}
        <div className="w-3/4 px-6 flex items-center">
          <div className="w-full bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
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
        <div className="w-1/4 pr-6 space-y-3 flex flex-col" style={{ height: 'calc(100vw * 3/4 * 9/16)' }}>
          {/* Div 1: Clinic Logo and Name */}
          <Card className="bg-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
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
                <div>
                  <h1 className="text-5xl font-bold leading-tight" data-testid="clinic-name">
                    {clinicName}
                  </h1>
                  <p className="text-3xl text-blue-200">TROPICANA AMAN</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Div 2: Current Patient Being Called */}
          <Card className="bg-red-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className="text-4xl font-bold mb-4">SEDANG DIPANGGIL</h3>
                {currentPatient ? (
                  <>
                    <div className="text-7xl font-bold mb-4 leading-tight" data-testid="current-patient-display">
                      {currentPatient.name}
                    </div>
                    <div className="text-3xl" data-testid="current-room">
                      {currentPatient.room}
                    </div>
                  </>
                ) : (
                  <div className="text-4xl">TIADA PANGGILAN</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Div 3: Patient History */}
          <Card className="bg-white flex-1 overflow-hidden">
            <CardContent className="p-3">
              <div className="text-center mb-3">
                <h3 className="text-3xl font-bold text-blue-800">SEJARAH PANGGILAN</h3>
              </div>
              <div className="space-y-3" data-testid="queue-list">
                {queueHistory.length > 0 ? (
                  queueHistory.slice(-4).map((item) => (
                    <div key={item.id} className="p-3 bg-gray-100 rounded text-center">
                      <div className="text-2xl font-bold text-gray-800">{item.name}</div>
                      <div className="text-lg text-gray-600">{item.room}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-3">
                    <p className="text-2xl">Tiada sejarah panggilan</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section - Date and Time (Separated) */}
      <div className="flex">
        <div className="w-3/4 px-6 space-y-1">
          {/* Date Section */}
          <div className="bg-blue-800 text-white p-3 rounded-lg">
            <div className="flex items-center justify-center space-x-6">
              <Calendar className="h-8 w-8" />
              <div className="text-3xl font-bold">
                {dateInfo.dayName}, {dateInfo.day} {dateInfo.month} {dateInfo.year}
              </div>
              <Clock className="h-8 w-8" />
              <div className="text-6xl font-mono font-bold" data-testid="display-time">
                {formatTime(currentTime)}
              </div>
            </div>
          </div>
          
          {/* Prayer Times Section */}
          <div className="bg-green-800 text-white p-3 rounded-lg">
            <div className="flex items-center justify-center space-x-8">
              <span className="font-bold text-2xl">WAKTU SOLAT:</span>
              {prayerTimes.map((prayer, index) => (
                <div key={index} className="text-center">
                  <div className="text-xl font-bold text-yellow-300">{prayer.name}</div>
                  <div className="text-xl">{prayer.time}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Welcome Message with Marquee */}
          <div className="bg-gray-800 text-white p-3 rounded-lg overflow-hidden">
            <div className="whitespace-nowrap">
              <div className="inline-block animate-marquee text-2xl font-bold">
                SELAMAT DATANG KE {clinicName} CAWANGAN TROPICANA AMAN, TERIMA KASIH ★ SELAMAT DATANG KE {clinicName} CAWANGAN TROPICANA AMAN, TERIMA KASIH ★ 
              </div>
            </div>
          </div>
        </div>
        <div className="w-1/4 pr-6"></div>
      </div>
    </div>
  );
}