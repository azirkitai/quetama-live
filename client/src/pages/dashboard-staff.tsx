import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TVDisplay } from "@/components/tv-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, Users, Clock, User } from "lucide-react";
import { type Patient } from "@shared/schema";

interface QueueItem {
  id: string;
  name: string;
  number: string;
  room: string;
  status: "waiting" | "calling" | "completed";
  timestamp: Date;
}

interface DashboardStats {
  totalWaiting: number;
  totalCalled: number;
  totalCompleted: number;
  activeWindows: number;
}

export default function StaffDashboard() {
  const [fullscreen, setFullscreen] = useState(false);

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats & { totalWindows: number }>({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 3000, // Refresh every 3 seconds for real-time dashboard updates
  });

  // Fetch current call
  const { data: currentCall } = useQuery<Patient | null>({
    queryKey: ['/api/dashboard/current-call'],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  // Fetch recent history 
  const { data: history = [] } = useQuery<Patient[]>({
    queryKey: ['/api/dashboard/history'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch windows data to map window IDs to names
  const { data: windows = [] } = useQuery<any[]>({
    queryKey: ['/api/windows'],
    refetchInterval: 5000, // Refresh every 5 seconds to stay in sync with patient calls
  });

  // Fetch active media for display
  const { data: activeMedia = [] } = useQuery<any[]>({
    queryKey: ['/api/display'],
    refetchInterval: 10000, // Refresh every 10 seconds to get updated media
  });

  // Fetch display settings
  const { data: settingsData = [] } = useQuery<Array<{key: string; value: string}>>({
    queryKey: ['/api/settings'],
  });

  // Convert settings array to object and parse booleans
  const settings = settingsData.reduce((acc: Record<string, any>, setting) => {
    acc[setting.key] = setting.value === "true" ? true : setting.value === "false" ? false : setting.value;
    return acc;
  }, {});

  const showPrayerTimes = settings.showPrayerTimes === true;
  const showWeather = settings.showWeather === true;
  const clinicName = settings.clinicName || "KLINIK UTAMA 24 JAM";
  const clinicLogo = settings.clinicLogo || "";
  const showClinicLogo = settings.showClinicLogo === "true";

  // Convert Patient to QueueItem for TV display
  const convertToQueueItem = (patient: Patient): QueueItem => {
    // Map windowId to window name
    const window = windows.find(w => w.id === patient.windowId);
    const windowName = window?.name || "Tidak tersedia";
    
    return {
      id: patient.id,
      name: patient.name || `No. ${patient.number}`,
      number: patient.number.toString(),
      room: windowName,
      status: patient.status === "called" ? "calling" : patient.status === "completed" ? "completed" : "waiting",
      timestamp: new Date()
    };
  };

  const toggleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
    setFullscreen(!fullscreen);
  };

  if (fullscreen) {
    return (
      <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-white m-0 p-0" style={{ width: "100vw", height: "100vh" }}>
        <TVDisplay
          currentPatient={currentCall ? convertToQueueItem(currentCall) : undefined}
          queueHistory={history.map(convertToQueueItem)}
          clinicName={clinicName}
          mediaItems={activeMedia.map(media => ({
            url: media.url,
            type: media.url.includes('youtube') || media.url.includes('youtu.be') ? 'youtube' : media.type,
            name: media.name
          }))}
          isFullscreen={true}
          showPrayerTimes={showPrayerTimes}
          showWeather={showWeather}
        />
        {/* Floating Exit Button - Always visible with high z-index */}
        <div className="fixed top-4 right-4 z-[9999]">
          <Button
            onClick={toggleFullscreen}
            className="bg-black/70 text-white border-white/20 hover:bg-black/90"
            variant="outline"
            size="sm"
            data-testid="button-exit-fullscreen"
          >
            Exit Fullscreen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Papan Pemuka Kakitangan</h1>
          <p className="text-muted-foreground">Paparan barisan pesakit dan kawalan panggilan</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium">Kakitangan</span>
          </div>
          <Button
            onClick={toggleFullscreen}
            data-testid="button-fullscreen-tv"
            className="btn-gradient"
          >
            <Monitor className="h-4 w-4 mr-2" />
            Paparan TV Penuh
          </Button>
        </div>
      </div>

      {/* Queue Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu</CardTitle>
            <Users className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600" data-testid="text-waiting-count">
              {statsLoading ? "..." : (stats?.totalWaiting || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              pesakit dalam barisan
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dipanggil</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600" data-testid="text-called-count">
              {statsLoading ? "..." : (stats?.totalCalled || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              pesakit sedang dipanggil
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai Hari Ini</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600" data-testid="text-completed-count">
              {statsLoading ? "..." : (stats?.totalCompleted || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              pesakit selesai
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Patient Display */}
      {currentCall && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200">Pesakit Sedang Dipanggil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100" data-testid="current-patient-name">
                  {currentCall.name || `No. ${currentCall.number}`}
                </div>
                <div className="text-lg text-blue-700 dark:text-blue-300" data-testid="current-patient-room">
                  {windows.find(w => w.id === currentCall.windowId)?.name || "Tidak tersedia"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">No. Barisan</div>
                <div className="text-3xl font-bold text-blue-600">{currentCall.number}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TV Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Pratonton Paparan TV</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden max-w-2xl mx-auto" style={{ aspectRatio: '16/9' }}>
            <div className="h-full scale-[0.42] origin-top-left" style={{ width: '238%', height: '238%' }}>
              <TVDisplay
                currentPatient={currentCall ? convertToQueueItem(currentCall) : undefined}
                queueHistory={history.slice(0, 4).map(convertToQueueItem)}
                clinicName={clinicName}
                mediaItems={activeMedia.map(media => ({
                  url: media.url,
                  type: media.url.includes('youtube') || media.url.includes('youtu.be') ? 'youtube' : media.type,
                  name: media.name
                }))}
                showPrayerTimes={showPrayerTimes}
                showWeather={showWeather}
              />
            </div>
          </div>
          <div className="mt-4 text-center">
            <Button 
              onClick={toggleFullscreen}
              variant="outline"
              data-testid="button-preview-fullscreen"
            >
              <Monitor className="h-4 w-4 mr-2" />
              Lihat Paparan Penuh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aktiviti Terkini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.slice(0, 5).map((patient) => {
                const window = windows.find(w => w.id === patient.windowId);
                return (
                  <div key={patient.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div>
                      <span className="font-medium">{patient.name || `No. ${patient.number}`}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        - {window?.name || "Tidak tersedia"}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      No. {patient.number}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}