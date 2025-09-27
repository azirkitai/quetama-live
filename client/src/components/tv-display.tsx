import { useState, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";

interface Patient {
  id: string;
  name: string | null;
  number: number;
  windowName: string;
  status: string;
}

interface TVDisplayProps {
  currentCall?: Patient;
  history?: Patient[];
  logo?: string;
  backgroundMedia?: string;
  mediaType?: "image" | "youtube";
  showPrayerTimes?: boolean;
  showWeather?: boolean;
  marqueeText?: string;
  marqueeColor?: string;
}

export function TVDisplay({
  currentCall,
  history = [],
  logo,
  backgroundMedia,
  mediaType = "image",
  showPrayerTimes = true,
  showWeather = false,
  marqueeText = "Selamat datang ke Klinik Kami",
  marqueeColor = "#3b82f6"
}: TVDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ms-MY', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ms-MY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // TODO: Remove mock functionality - replace with real prayer times API
  const prayerTimes = [
    { name: "Subuh", time: "5:45" },
    { name: "Zohor", time: "13:15" },
    { name: "Asar", time: "16:30" },
    { name: "Maghrib", time: "19:20" },
    { name: "Isyak", time: "20:35" }
  ];

  return (
    <div className="h-screen w-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Background Media */}
      <div className="absolute inset-0 z-0">
        {mediaType === "youtube" && backgroundMedia ? (
          <iframe
            src={backgroundMedia}
            className="w-full h-full object-cover"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : backgroundMedia ? (
          <img
            src={backgroundMedia}
            alt="Background"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 opacity-20" />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex flex-col text-white">
        {/* Header */}
        <div className="flex justify-between items-start p-8">
          <div className="text-4xl font-bold text-white drop-shadow-lg">
            SISTEM PANGGILAN KLINIK
          </div>
          {logo && (
            <div className="bg-white/90 rounded-lg p-4 shadow-lg">
              <img 
                src={logo} 
                alt="Logo Klinik" 
                className="h-16 w-auto"
                data-testid="img-clinic-logo"
              />
            </div>
          )}
        </div>

        {/* Current Call Section */}
        <div className="flex-1 flex flex-col justify-center items-center px-8">
          {currentCall ? (
            <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-2xl max-w-4xl w-full">
              <div className="text-2xl font-semibold text-gray-600 mb-4">
                SEKARANG DIPANGGIL
              </div>
              <div 
                className="text-8xl font-bold text-blue-600 mb-6"
                data-testid="text-current-patient"
              >
                {currentCall.name || `No. ${currentCall.number}`}
              </div>
              <div className="text-4xl font-semibold text-gray-700">
                {currentCall.windowName}
              </div>
            </div>
          ) : (
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-2xl max-w-4xl w-full">
              <div className="text-6xl font-bold text-gray-600 mb-4">
                TIADA PANGGILAN
              </div>
              <div className="text-2xl text-gray-500">
                Sila tunggu panggilan seterusnya
              </div>
            </div>
          )}
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <div className="px-8 mb-8">
            <div className="bg-white/85 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                PANGGILAN TERKINI
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {history.slice(0, 5).map((patient, index) => (
                  <div 
                    key={patient.id} 
                    className="flex justify-between items-center text-gray-600"
                    data-testid={`text-history-${index}`}
                  >
                    <span className="font-medium">
                      {patient.name || `No. ${patient.number}`}
                    </span>
                    <span className="text-sm">{patient.windowName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Section */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Date and Time */}
          <div className="bg-white/85 backdrop-blur-sm rounded-xl p-6 shadow-lg">
            <div className="flex items-center mb-2">
              <Calendar className="h-6 w-6 text-blue-600 mr-2" />
              <span className="font-semibold text-gray-700">Tarikh</span>
            </div>
            <div className="text-lg text-gray-600" data-testid="text-current-date">
              {formatDate(currentTime)}
            </div>
            <div className="flex items-center mt-4 mb-2">
              <Clock className="h-6 w-6 text-blue-600 mr-2" />
              <span className="font-semibold text-gray-700">Masa</span>
            </div>
            <div className="text-2xl font-mono text-gray-800" data-testid="text-current-time">
              {formatTime(currentTime)}
            </div>
          </div>

          {/* Prayer Times */}
          {showPrayerTimes && (
            <div className="bg-white/85 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-700 mb-4">Waktu Solat</h3>
              <div className="space-y-2">
                {prayerTimes.map((prayer) => (
                  <div 
                    key={prayer.name} 
                    className="flex justify-between text-sm text-gray-600"
                    data-testid={`text-prayer-${prayer.name.toLowerCase()}`}
                  >
                    <span>{prayer.name}</span>
                    <span className="font-mono">{prayer.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weather or Additional Info */}
          <div className="bg-white/85 backdrop-blur-sm rounded-xl p-6 shadow-lg">
            {showWeather ? (
              <div>
                <h3 className="font-semibold text-gray-700 mb-4">Cuaca</h3>
                <div className="text-center">
                  <div className="text-3xl text-gray-600" data-testid="text-weather-temp">
                    28°C
                  </div>
                  <div className="text-sm text-gray-500" data-testid="text-weather-condition">
                    Cerah
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-gray-700 mb-4">Maklumat</h3>
                <div className="text-sm text-gray-600">
                  Sila ikut arahan dari kaunter pendaftaran
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Marquee Text */}
        {marqueeText && (
          <div 
            className="bg-black/80 text-white py-3 overflow-hidden"
            style={{ color: marqueeColor }}
          >
            <div className="animate-marquee whitespace-nowrap text-lg font-medium">
              {marqueeText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}