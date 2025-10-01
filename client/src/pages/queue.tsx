import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PatientCard } from "@/components/patient-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Users, RefreshCw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Patient, type Setting } from "@shared/schema";
import { audioSystem } from "@/lib/audio-system";

interface Window {
  id: string;
  name: string;
  isActive: boolean;
  currentPatientId?: string;
}

interface QueuePatient extends Omit<Patient, 'status' | 'trackingHistory'> {
  status: "waiting" | "called" | "in-progress" | "completed" | "requeue";
  windowName?: string;
  lastWindowName?: string;
  trackingHistory?: string[];
}

export default function Queue() {
  const [selectedWindow, setSelectedWindow] = useState<string>("");
  const { toast } = useToast();

  // Fetch all patients (24-hour clinic operation)
  const { data: patients = [], isLoading: patientsLoading, refetch: refetchPatients } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  // Fetch windows
  const { data: windows = [], isLoading: windowsLoading, refetch: refetchWindows } = useQuery<Window[]>({
    queryKey: ['/api/windows'],
  });

  // Fetch audio settings
  const { data: settings = [] } = useQuery<Setting[]>({
    queryKey: ['/api/settings'],
  });

  // Update patient status mutation
  const updatePatientStatusMutation = useMutation({
    mutationFn: async ({ patientId, status, windowId, requeueReason }: { patientId: string; status: string; windowId?: string; requeueReason?: string }) => {
      const response = await apiRequest("PATCH", `/api/patients/${patientId}/status`, { status, windowId, requeueReason });
      return response.json();
    },
    onMutate: async ({ patientId, status, windowId }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['/api/patients'] });
      await queryClient.cancelQueries({ queryKey: ['/api/windows'] });

      // Snapshot the previous values
      const previousPatients = queryClient.getQueryData(['/api/patients']);
      const previousWindows = queryClient.getQueryData(['/api/windows']);

      // Optimistically update patients
      queryClient.setQueryData(['/api/patients'], (old: any) => {
        if (!old) return old;
        return old.map((patient: any) => 
          patient.id === patientId 
            ? { ...patient, status, windowId: windowId || patient.windowId, calledAt: status === 'called' ? new Date().toISOString() : patient.calledAt }
            : patient
        );
      });

      // Optimistically update windows - clear currentPatientId if patient completed
      if (status === 'completed') {
        queryClient.setQueryData(['/api/windows'], (old: any) => {
          if (!old) return old;
          return old.map((window: any) => 
            window.currentPatientId === patientId 
              ? { ...window, currentPatientId: null }
              : window
          );
        });
      }
      // Or set currentPatientId if patient called to new window
      else if (status === 'called' && windowId) {
        queryClient.setQueryData(['/api/windows'], (old: any) => {
          if (!old) return old;
          return old.map((window: any) => 
            window.id === windowId 
              ? { ...window, currentPatientId: patientId }
              : window.currentPatientId === patientId 
                ? { ...window, currentPatientId: null }
                : window
          );
        });
      }

      // Return a context object with the snapshotted values
      return { previousPatients, previousWindows };
    },
    onError: (err, { patientId, status, windowId }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPatients) {
        queryClient.setQueryData(['/api/patients'], context.previousPatients);
      }
      if (context?.previousWindows) {
        queryClient.setQueryData(['/api/windows'], context.previousWindows);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/windows'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/current-call'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/history'] });
      
      toast({
        title: "Success",
        description: "Patient successfully called",
      });
    },
    onSettled: () => {
      // Always refetch after mutation settles, whether success or error
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/windows'] });
    },
  });

  // Delete patient mutation
  const deletePatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const response = await apiRequest("DELETE", `/api/patients/${patientId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/windows'] });
      toast({
        title: "Success",
        description: "Patient has been deleted",
      });
    },
    onError: (error) => {
      console.error("Error deleting patient:", error);
      toast({
        title: "Error",
        description: "Failed to delete patient",
        variant: "destructive",
      });
    },
  });

  // Manual reset/clear queue mutation (for 24-hour clinics)
  const resetQueueMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/patients/reset-queue");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/windows'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Queue Reset Success",
        description: `${data.archivedCount || 0} completed patient(s) archived`,
      });
    },
    onError: (error) => {
      console.error("Error resetting queue:", error);
      toast({
        title: "Queue Reset Error",
        description: "Failed to reset queue. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Extract audio settings with all required fields
  const audioSettings = useMemo(() => {
    const settingsObj = settings.reduce((acc: Record<string, string>, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    return {
      enableSound: settingsObj.enableSound === "true",
      soundType: settingsObj.soundType || "beep",
      enableTTS: settingsObj.enableTTS === "true",
      ttsLanguage: settingsObj.ttsLanguage || "ms",
      volume: parseInt(settingsObj.volume || "70"),
      // Enhanced audio system fields
      soundMode: (settingsObj.soundMode as 'synth' | 'preset' | 'file') || 'synth',
      presetKey: settingsObj.presetKey || undefined,
      customAudioId: settingsObj.customAudioId || undefined
    };
  }, [settings]);

  // Enhanced patients with window names
  const enhancedPatients = useMemo((): QueuePatient[] => {
    return patients.map(patient => ({
      ...patient,
      status: patient.status as "waiting" | "called" | "in-progress" | "completed" | "requeue",
      windowName: patient.windowId ? windows.find(w => w.id === patient.windowId)?.name : undefined,
      lastWindowName: patient.lastWindowId ? windows.find(w => w.id === patient.lastWindowId)?.name : undefined,
      trackingHistory: patient.trackingHistory || undefined
    }));
  }, [patients, windows]);

  const handleCallPatient = async (patientId: string) => {
    if (!selectedWindow) {
      toast({
        title: "Error",
        description: "Please select room first",
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
        title: "Error",
        description: "This room is serving another patient",
        variant: "destructive",
      });
      return;
    }

    // Get patient information for audio
    const patient = enhancedPatients.find(p => p.id === patientId);
    if (!patient) return;

    // Update patient status first (non-blocking)
    updatePatientStatusMutation.mutate({
      patientId,
      status: "called",
      windowId: selectedWindow
    });

    // Audio will be played by TV Display only (not from Queue page)
  };

  const handleCallAgain = (patientId: string) => {
    const patient = enhancedPatients.find(p => p.id === patientId);
    if (!patient || !patient.windowId) return;

    const window = windows.find(w => w.id === patient.windowId);
    if (!window) return;

    // Update patient's calledAt time to make them the current call
    updatePatientStatusMutation.mutate({
      patientId,
      status: "called",
      windowId: patient.windowId // Keep existing window assignment
    });

    // Show toast immediately for responsive UI feedback
    toast({
      title: "Call Again",
      description: "Patient has been recalled",
    });

    // Audio will be played by TV Display only (not from Queue page)
  };

  const handleRecall = async (patientId: string) => {
    if (!selectedWindow) {
      toast({
        title: "Error",
        description: "Please select room first",
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
        title: "Error",
        description: "This room is serving another patient",
        variant: "destructive",
      });
      return;
    }

    // Get patient information for audio
    const patient = enhancedPatients.find(p => p.id === patientId);
    if (!patient) return;

    // Update patient status first
    updatePatientStatusMutation.mutate({
      patientId,
      status: "called",
      windowId: selectedWindow
    });

    // Audio will be played by TV Display only (not from Queue page)
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

  const handleResetQueue = () => {
    if (confirm("Are you sure you want to reset queue? All 'Completed' patients will be archived. This action cannot be undone.")) {
      resetQueueMutation.mutate();
    }
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
          <p className="text-muted-foreground">Manage patient calls and treatment rooms</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={patientsLoading || windowsLoading}
            data-testid="button-refresh-queue"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {patientsLoading || windowsLoading ? "Loading..." : "Refresh"}
          </Button>
          <Button
            variant="destructive"
            onClick={handleResetQueue}
            disabled={resetQueueMutation.isPending}
            data-testid="button-reset-queue"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {resetQueueMutation.isPending ? "Resetting..." : "Reset Queue"}
          </Button>
        </div>
      </div>

      {/* Window Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardList className="h-5 w-5 mr-2" />
            Select Room for Call
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Select value={selectedWindow} onValueChange={setSelectedWindow}>
              <SelectTrigger className="w-64" data-testid="select-window">
                <SelectValue placeholder="Select room..." />
              </SelectTrigger>
              <SelectContent>
                {activeWindows.map((window) => (
                  <SelectItem 
                    key={window.id} 
                    value={window.id}
                  >
                    {window.name}
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
            Active Patients ({activePatients.length})
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
                selectedWindow={selectedWindow}
              />
            ))}
          </div>
        </div>
      )}

      {/* Waiting Patients */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Waiting Patients ({waitingPatients.length})
        </h2>
        {waitingPatients.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                No patients in waiting queue
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
                selectedWindow={selectedWindow}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}