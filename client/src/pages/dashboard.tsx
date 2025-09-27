import { useState, useEffect } from "react";
import { TVDisplay } from "@/components/tv-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, Settings, Users, Clock } from "lucide-react";

interface Patient {
  id: string;
  name: string | null;
  number: number;
  windowName: string;
  status: string;
}

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
  const [currentCall, setCurrentCall] = useState<Patient | undefined>();
  const [history, setHistory] = useState<Patient[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalWaiting: 8,
    totalCalled: 2,
    totalCompleted: 15,
    activeWindows: 3
  });

  // Convert Patient to QueueItem for TV display
  const convertToQueueItem = (patient: Patient): QueueItem => ({
    id: patient.id,
    name: patient.name || `No. ${patient.number}`,
    number: patient.number.toString(),
    room: patient.windowName,
    status: patient.status === "called" ? "calling" : patient.status === "completed" ? "completed" : "waiting",
    timestamp: new Date()
  });

  // TODO: Remove mock functionality - replace with real-time data from backend
  useEffect(() => {
    const mockCurrentCall: Patient = {
      id: "1",
      name: "Ahmad bin Ali",
      number: 15,
      windowName: "Bilik 1 - Dr. Sarah",
      status: "called"
    };

    const mockHistory: Patient[] = [
      { id: "2", name: null, number: 14, windowName: "Bilik 2 - Dr. Ahmad", status: "completed" },
      { id: "3", name: "Siti Nurhaliza", number: 13, windowName: "Bilik 1 - Dr. Sarah", status: "completed" },
      { id: "4", name: null, number: 12, windowName: "Bilik 3 - Nurse Linda", status: "completed" },
      { id: "5", name: "Rahman Abdullah", number: 11, windowName: "Bilik 2 - Dr. Ahmad", status: "completed" },
    ];

    setCurrentCall(mockCurrentCall);
    setHistory(mockHistory);
  }, []);

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
      <div className="relative group">
        <TVDisplay
          currentPatient={currentCall ? convertToQueueItem(currentCall) : undefined}
          queueHistory={history.map(convertToQueueItem)}
          clinicName="KLINIK UTAMA 24 JAM"
          clinicLogo={undefined}
          mediaContent={undefined}
          mediaType="image"
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
              {stats.totalWaiting}
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
              {stats.totalCalled}
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
              {stats.totalCompleted}
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
              {stats.activeWindows}
            </div>
            <p className="text-xs text-muted-foreground">
              daripada 5 bilik
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
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <div className="h-full scale-50 origin-top-left" style={{ width: '200%', height: '200%' }}>
              <TVDisplay
                currentPatient={currentCall ? convertToQueueItem(currentCall) : undefined}
                queueHistory={history.slice(0, 3).map(convertToQueueItem)}
                clinicName="KLINIK UTAMA 24 JAM"
                clinicLogo={undefined}
                mediaContent={undefined}
                mediaType="image"
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