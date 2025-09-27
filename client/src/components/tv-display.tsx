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
  logoUrl?: string;
  adContent?: string;
  prayerTimes?: PrayerTime[];
}

export function TVDisplay({ 
  currentPatient,
  queueHistory = [],
  clinicName = "KLINIK UTAMA 24 JAM TROPICANA AMAN",
  logoUrl,
  adContent,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 text-gray-900" data-testid="tv-display">
      {/* Top Header with Logo and Patient Name */}
      <div className="bg-white shadow-sm border-b-2 border-blue-600 p-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo and System Name */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">QueTA</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-red-600" data-testid="system-name">
                QueTA System
              </h1>
              <p className="text-sm text-gray-600">{clinicName}</p>
            </div>
          </div>

          {/* Center: Current Patient Display */}
          {currentPatient && (
            <div className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg">
              <Volume2 className="h-5 w-5 mr-2 animate-pulse" />
              <div>
                <span className="text-sm">CALLING:</span>
                <div className="text-xl font-bold" data-testid="header-patient-name">
                  {currentPatient.name}
                </div>
              </div>
            </div>
          )}

          {/* Right: System Logo */}
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">UTA</span>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-100px)]">
        {/* Main Content Area - Advertisement */}
        <div className="flex-1 p-6">
          <Card className="h-full bg-white shadow-lg">
            <CardContent className="p-8 h-full flex flex-col justify-center">
              {adContent ? (
                <div className="text-center">
                  <img 
                    src={adContent} 
                    alt="Advertisement" 
                    className="w-full h-full object-contain"
                    data-testid="ad-content"
                  />
                </div>
              ) : (
                <div className="text-center">
                  <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white p-8 rounded-lg">
                    <h2 className="text-4xl font-bold mb-4">ECG SCREENING</h2>
                    <p className="text-xl mb-2">KNOW YOUR HEART'S RHYTHM</p>
                    <div className="text-left mt-6 space-y-2">
                      <p>✓ Detects irregular heart rhythms</p>
                      <p>✓ Simple & non-invasive procedure</p>
                    </div>
                    <div className="mt-6">
                      <h3 className="text-lg text-orange-300">Elevate Your Health With</h3>
                      <h3 className="text-xl font-bold">{clinicName}</h3>
                    </div>
                    <div className="mt-4">
                      <button className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-full font-bold">
                        Get Your Result Instantly!
                      </button>
                    </div>
                    <div className="mt-4 text-sm">
                      <p>For more inquiries, kindly contact us at</p>
                      <p className="text-orange-300 font-bold">+603-86824091</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
                  <div className="text-xl text-blue-200">FARISH ASYRA...</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Counter Display */}
          <Card className="bg-blue-700 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className="text-lg font-bold">KAUNTER UBAT</h3>
              </div>
            </CardContent>
          </Card>

          {/* Queue List */}
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex justify-between text-sm font-bold mb-3 pb-2 border-b">
                <span>NAME</span>
                <span>ROOM</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto" data-testid="queue-list">
                {queueHistory.length > 0 ? (
                  queueHistory.slice(-8).map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 px-2 bg-gray-100 rounded text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-600">{item.room}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex justify-between items-center py-2 px-2 bg-yellow-100 rounded text-sm">
                      <span className="font-medium text-yellow-800">ALEENA DALEELA</span>
                      <span className="text-gray-600">N/A</span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-2 bg-yellow-100 rounded text-sm">
                      <span className="font-medium text-yellow-800">ALI MD JAMSHER</span>
                      <span className="text-gray-600">BILIK 3</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Date and Time Display */}
          <Card className="bg-teal-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{dateInfo.day}</div>
                <div className="text-sm">{dateInfo.dayName}</div>
                <div className="text-xs">{dateInfo.month} {dateInfo.year}</div>
                <div className="text-lg font-mono mt-2" data-testid="display-time">
                  {formatTime(currentTime)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section - Prayer Times */}
      <div className="bg-blue-800 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span className="font-bold">PRAYER TIME</span>
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
          <span>SELAMAT DATANG KE {clinicName}, CAWANGAN TROPICANA AMAN, TELUR DAGING</span>
        </div>
      </div>
    </div>
  );
}