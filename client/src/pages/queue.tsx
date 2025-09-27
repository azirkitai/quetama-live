import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PatientCard } from "@/components/patient-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Users, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Patient } from "@shared/schema";

interface Window {
  id: string;
  name: string;
  isActive: boolean;
  currentPatientId?: string;
}

interface QueuePatient extends Omit<Patient, 'status' | 'windowId' | 'trackingHistory'> {
  status: "waiting" | "called" | "in-progress" | "completed" | "requeue";
  windowId?: string;
  windowName?: string;
  lastWindowId?: string;
  lastWindowName?: string;
  trackingHistory?: string[];
}

export default function Queue() {
  const [selectedWindow, setSelectedWindow] = useState<string>("");
  const { toast } = useToast();

  // Fetch today's patients
  const { data: patients = [], isLoading: patientsLoading, refetch: refetchPatients } = useQuery<Patient[]>({
    queryKey: ['/api/patients/today'],
  });

  // Fetch windows
  const { data: windows = [], isLoading: windowsLoading, refetch: refetchWindows } = useQuery<Window[]>({
    queryKey: ['/api/windows'],
  });

  // Update patient status mutation
  const updatePatientStatusMutation = useMutation({
    mutationFn: async ({ patientId, status, windowId, requeueReason }: { patientId: string; status: string; windowId?: string; requeueReason?: string }) => {
      const response = await apiRequest("PATCH", `/api/patients/${patientId}/status`, { status, windowId, requeueReason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/windows'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/current-call'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/history'] });
      
      toast({
        title: "Berjaya",
        description: "Pesakit berjaya dipanggil",
      });
    },
    onError: (error) => {
      console.error("Error updating patient status:", error);
      toast({
        title: "Ralat",
        description: "Gagal mengemas kini status pesakit",
        variant: "destructive",
      });
    },
  });

  // Delete patient mutation
  const deletePatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const response = await apiRequest("DELETE", `/api/patients/${patientId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/windows'] });
      toast({
        title: "Berjaya",
        description: "Pesakit telah dipadam",
      });
    },
    onError: (error) => {
      console.error("Error deleting patient:", error);
      toast({
        title: "Ralat",
        description: "Gagal memadam pesakit",
        variant: "destructive",
      });
    },
  });

  // Enhanced patients with window names
  const enhancedPatients = useMemo((): QueuePatient[] => {
    return patients.map(patient => ({
      ...patient,
      status: patient.status as "waiting" | "called" | "in-progress" | "completed" | "requeue",
      windowId: patient.windowId || undefined,
      windowName: patient.windowId ? windows.find(w => w.id === patient.windowId)?.name : undefined,
      lastWindowId: patient.lastWindowId || undefined,
      lastWindowName: patient.lastWindowId ? windows.find(w => w.id === patient.lastWindowId)?.name : undefined,
      trackingHistory: patient.trackingHistory || undefined
    }));
  }, [patients, windows]);

  const handleCallPatient = (patientId: string) => {
    if (!selectedWindow) {
      toast({
        title: "Ralat",
        description: "Sila pilih bilik terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const window = windows.find(w => w.id === selectedWindow);
    if (!window) return;

    // Allow calling if:
    // 1. Window is empty (no currentPatientId), OR
    // 2. Same patient is being called again (recall scenario)
    if (window.currentPatientId && window.currentPatientId !== patientId) {
      toast({
        title: "Ralat",
        description: "Bilik ini sedang melayani pesakit lain",
        variant: "destructive",
      });
      return;
    }

    updatePatientStatusMutation.mutate({
      patientId,
      status: "called",
      windowId: selectedWindow
    });
  };

  const handleCallAgain = (patientId: string) => {
    // For call again, we don't need to change status or window
    // Just trigger a notification/sound (this could be enhanced later)
    toast({
      title: "Panggil Lagi",
      description: "Pesakit telah dipanggil semula",
    });
  };

  const handleRecall = (patientId: string) => {
    if (!selectedWindow) {
      toast({
        title: "Ralat",
        description: "Sila pilih bilik terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const window = windows.find(w => w.id === selectedWindow);
    if (!window) return;

    // Allow recall if:
    // 1. Window is empty (no currentPatientId), OR  
    // 2. Same patient is being recalled
    if (window.currentPatientId && window.currentPatientId !== patientId) {
      toast({
        title: "Ralat",
        description: "Bilik ini sedang melayani pesakit lain",
        variant: "destructive",
      });
      return;
    }

    updatePatientStatusMutation.mutate({
      patientId,
      status: "called",
      windowId: selectedWindow
    });
  };

  const handleDeletePatient = (patientId: string) => {
    deletePatientMutation.mutate(patientId);
  };

  const handleCompletePatient = (patientId: string) => {
    updatePatientStatusMutation.mutate({
      patientId,
      status: "completed"
    });
  };

  const handleRequeuePatient = (patientId: string, reason?: string) => {
    updatePatientStatusMutation.mutate({
      patientId,
      status: "requeue",
      requeueReason: reason
    });
  };

  const handleRefresh = () => {
    refetchPatients();
    refetchWindows();
  };

  const activeWindows = windows.filter(w => w.isActive);
  const waitingPatients = enhancedPatients.filter(p => p.status === "waiting" || p.status === "requeue");
  const activePatients = enhancedPatients.filter(p => p.status === "called" || p.status === "in-progress");

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
          onClick={handleRefresh}
          disabled={patientsLoading || windowsLoading}
          data-testid="button-refresh-queue"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {patientsLoading || windowsLoading ? "Loading..." : "Refresh"}
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
                onCallAgain={handleCallAgain}
                onRecall={handleRecall}
                onDelete={handleDeletePatient}
                onComplete={handleCompletePatient}
                onRequeue={handleRequeuePatient}
                disabled={updatePatientStatusMutation.isPending}
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
                onCallAgain={handleCallAgain}
                onRecall={handleRecall}
                onDelete={handleDeletePatient}
                onComplete={handleCompletePatient}
                onRequeue={handleRequeuePatient}
                disabled={!selectedWindow || updatePatientStatusMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}