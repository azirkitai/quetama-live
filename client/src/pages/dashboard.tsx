import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TVDisplay } from "@/components/tv-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, Settings, Users, Clock } from "lucide-react";
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

export default function Dashboard() {
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
  });

  // Fetch active media for display
  const { data: activeMedia = [] } = useQuery<any[]>({
    queryKey: ['/api/display'],
    refetchInterval: 10000, // Refresh every 10 seconds to get updated media
  });

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
          clinicName="KLINIK UTAMA 24 JAM"
          clinicLogo={undefined}
          mediaItems={activeMedia.map(media => ({
            url: media.url,
            type: media.url.includes('youtube') || media.url.includes('youtu.be') ? 'youtube' : media.type,
            name: media.name
          }))}
          isFullscreen={true}
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
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Paparan utama sistem panggilan klinik</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-waiting-count">
              {statsLoading ? "..." : (stats?.totalWaiting || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              pesakit dalam barisan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dipanggil</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-called-count">
              {statsLoading ? "..." : (stats?.totalCalled || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              pesakit sedang dipanggil
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-completed-count">
              {statsLoading ? "..." : (stats?.totalCompleted || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              pesakit hari ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bilik Aktif</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary" data-testid="text-active-windows">
              {statsLoading ? "..." : (stats?.activeWindows || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              daripada {stats?.totalWindows || 0} bilik
            </p>
          </CardContent>
        </Card>
      </div>

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
                clinicName="KLINIK UTAMA 24 JAM"
                clinicLogo={undefined}
                mediaItems={activeMedia.map(media => ({
                  url: media.url,
                  type: media.url.includes('youtube') || media.url.includes('youtu.be') ? 'youtube' : media.type,
                  name: media.name
                }))}
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
    </div>
  );
}