import { useState, useEffect } from "react";
import { PatientCard } from "@/components/patient-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Users, RefreshCw } from "lucide-react";

interface Patient {
  id: string;
  name: string | null;
  number: number;
  status: "waiting" | "called" | "in-progress" | "completed" | "requeue";
  windowId?: string;
  windowName?: string;
  trackingHistory?: string[];
}

interface Window {
  id: string;
  name: string;
  isActive: boolean;
  currentPatientId?: string;
}

export default function Queue() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [windows, setWindows] = useState<Window[]>([]);
  const [selectedWindow, setSelectedWindow] = useState<string>("");

  // TODO: Remove mock functionality - replace with real-time data from backend
  useEffect(() => {
    const mockPatients: Patient[] = [
      {
        id: "p1",
        name: "Ahmad bin Rahman",
        number: 16,
        status: "waiting",
        trackingHistory: ["Registered at 9:45 AM"]
      },
      {
        id: "p2",
        name: null,
        number: 17,
        status: "waiting",
        trackingHistory: ["Registered at 9:50 AM"]
      },
      {
        id: "p3",
        name: "Siti Aishah",
        number: 18,
        status: "called",
        windowId: "w1",
        windowName: "Bilik 1 - Dr. Sarah",
        trackingHistory: ["Registered at 9:55 AM", "Called to Bilik 1 at 10:00 AM"]
      },
      {
        id: "p4",
        name: null,
        number: 15,
        status: "in-progress",
        windowId: "w2",
        windowName: "Bilik 2 - Dr. Ahmad",
        trackingHistory: [
          "Registered at 9:30 AM", 
          "Called to Bilik 2 at 9:45 AM",
          "Consultation started at 9:50 AM"
        ]
      },
      {
        id: "p5",
        name: "Rahman Abdullah",
        number: 19,
        status: "requeue",
        trackingHistory: [
          "Registered at 10:00 AM",
          "Called to Bilik 3 at 10:15 AM",
          "Consultation completed at 10:30 AM",
          "Requeued for follow-up at 10:35 AM"
        ]
      },
    ];

    const mockWindows: Window[] = [
      { id: "w1", name: "Bilik 1 - Dr. Sarah", isActive: true, currentPatientId: "p3" },
      { id: "w2", name: "Bilik 2 - Dr. Ahmad", isActive: true, currentPatientId: "p4" },
      { id: "w3", name: "Bilik 3 - Nurse Linda", isActive: true },
      { id: "w4", name: "Bilik 4 - Dr. Aisyah", isActive: false },
    ];

    setPatients(mockPatients);
    setWindows(mockWindows);
  }, []);

  const handleCallPatient = (patientId: string) => {
    if (!selectedWindow) {
      alert("Sila pilih bilik terlebih dahulu");
      return;
    }

    const window = windows.find(w => w.id === selectedWindow);
    if (!window) return;

    if (window.currentPatientId) {
      alert("Bilik ini sedang melayani pesakit lain");
      return;
    }

    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        const newTracking = [...(p.trackingHistory || []), `Called to ${window.name} at ${new Date().toLocaleTimeString()}`];
        return {
          ...p,
          status: "called" as const,
          windowId: selectedWindow,
          windowName: window.name,
          trackingHistory: newTracking
        };
      }
      return p;
    }));

    setWindows(prev => prev.map(w => 
      w.id === selectedWindow ? { ...w, currentPatientId: patientId } : w
    ));

    console.log(`Patient ${patientId} called to ${window.name}`);
  };

  const handleDeletePatient = (patientId: string) => {
    setPatients(prev => prev.filter(p => p.id !== patientId));
    console.log(`Patient ${patientId} deleted`);
  };

  const handleCompletePatient = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    setPatients(prev => prev.filter(p => p.id !== patientId));
    
    if (patient.windowId) {
      setWindows(prev => prev.map(w => 
        w.id === patient.windowId ? { ...w, currentPatientId: undefined } : w
      ));
    }

    console.log(`Patient ${patientId} completed`);
  };

  const handleRequeuePatient = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    const newTracking = [...(patient.trackingHistory || []), `Requeued at ${new Date().toLocaleTimeString()}`];
    
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          status: "requeue" as const,
          windowId: undefined,
          windowName: undefined,
          trackingHistory: newTracking
        };
      }
      return p;
    }));

    if (patient.windowId) {
      setWindows(prev => prev.map(w => 
        w.id === patient.windowId ? { ...w, currentPatientId: undefined } : w
      ));
    }

    console.log(`Patient ${patientId} requeued`);
  };

  const activeWindows = windows.filter(w => w.isActive);
  const waitingPatients = patients.filter(p => p.status === "waiting" || p.status === "requeue");
  const activePatients = patients.filter(p => p.status === "called" || p.status === "in-progress");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Queue Management</h1>
          <p className="text-muted-foreground">Urus panggilan pesakit dan bilik rawatan</p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          data-testid="button-refresh-queue"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Window Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardList className="h-5 w-5 mr-2" />
            Pilih Bilik untuk Panggilan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Select value={selectedWindow} onValueChange={setSelectedWindow}>
              <SelectTrigger className="w-64" data-testid="select-window">
                <SelectValue placeholder="Pilih bilik..." />
              </SelectTrigger>
              <SelectContent>
                {activeWindows.map((window) => (
                  <SelectItem 
                    key={window.id} 
                    value={window.id}
                    disabled={!!window.currentPatientId}
                  >
                    {window.name} {window.currentPatientId && "(Sedang Digunakan)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedWindow && (
              <Badge variant="outline" data-testid="badge-selected-window">
                {windows.find(w => w.id === selectedWindow)?.name}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Patients */}
      {activePatients.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Pesakit Aktif ({activePatients.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePatients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onCall={handleCallPatient}
                onDelete={handleDeletePatient}
                onComplete={handleCompletePatient}
                onRequeue={handleRequeuePatient}
                disabled={patient.status === "called"}
              />
            ))}
          </div>
        </div>
      )}

      {/* Waiting Patients */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Pesakit Menunggu ({waitingPatients.length})
        </h2>
        {waitingPatients.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                Tiada pesakit dalam barisan menunggu
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {waitingPatients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onCall={handleCallPatient}
                onDelete={handleDeletePatient}
                onComplete={handleCompletePatient}
                onRequeue={handleRequeuePatient}
                disabled={!selectedWindow}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}