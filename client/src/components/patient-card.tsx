import { useState } from "react";
import { Bell, Trash2, RotateCcw, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: string;
  name: string | null;
  number: number;
  status: "waiting" | "called" | "in-progress" | "completed" | "requeue";
  windowId?: string;
  windowName?: string;
  trackingHistory?: string[];
}

interface PatientCardProps {
  patient: Patient;
  onCall: (patientId: string) => void;
  onDelete: (patientId: string) => void;
  onComplete: (patientId: string) => void;
  onRequeue: (patientId: string) => void;
  disabled?: boolean;
}

export function PatientCard({
  patient,
  onCall,
  onDelete,
  onComplete,
  onRequeue,
  disabled = false
}: PatientCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCall = () => {
    console.log(`Calling patient ${patient.id}`);
    onCall(patient.id);
  };

  const handleDelete = () => {
    if (isDeleting) {
      console.log(`Deleting patient ${patient.id}`);
      onDelete(patient.id);
    } else {
      setIsDeleting(true);
      // Reset delete confirmation after 3 seconds
      setTimeout(() => setIsDeleting(false), 3000);
    }
  };

  const handleComplete = () => {
    console.log(`Completing patient ${patient.id}`);
    onComplete(patient.id);
  };

  const handleRequeue = () => {
    console.log(`Requeueing patient ${patient.id}`);
    onRequeue(patient.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "called":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in-progress":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "requeue":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "waiting":
        return "Menunggu";
      case "called":
        return "Dipanggil";
      case "in-progress":
        return "Sedang Diperiksa";
      case "completed":
        return "Selesai";
      case "requeue":
        return "Baris Semula";
      default:
        return status;
    }
  };

  return (
    <Card className="w-full hover-elevate">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold text-primary">
              #{patient.number.toString().padStart(3, '0')}
            </div>
            {patient.name && (
              <div className="text-lg font-medium" data-testid={`text-patient-name-${patient.id}`}>
                {patient.name}
              </div>
            )}
          </div>
          <Badge 
            className={getStatusColor(patient.status)}
            data-testid={`badge-status-${patient.id}`}
          >
            {getStatusLabel(patient.status)}
          </Badge>
        </div>
        {patient.windowName && (
          <div className="text-sm text-muted-foreground" data-testid={`text-window-${patient.id}`}>
            {patient.windowName}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {/* Tracking History */}
        {patient.trackingHistory && patient.trackingHistory.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-600 mb-2">Tracking:</div>
            <div className="space-y-1">
              {patient.trackingHistory.slice(-3).map((track, index) => (
                <div 
                  key={index} 
                  className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1"
                  data-testid={`text-tracking-${patient.id}-${index}`}
                >
                  {track}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {patient.status === "waiting" && (
            <Button
              onClick={handleCall}
              disabled={disabled}
              size="sm"
              className="flex-1"
              data-testid={`button-call-${patient.id}`}
            >
              <Bell className="h-4 w-4 mr-1" />
              Panggil
            </Button>
          )}

          {patient.status === "in-progress" && (
            <>
              <Button
                onClick={handleComplete}
                disabled={disabled}
                size="sm"
                variant="default"
                className="flex-1"
                data-testid={`button-complete-${patient.id}`}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Selesai
              </Button>
              <Button
                onClick={handleRequeue}
                disabled={disabled}
                size="sm"
                variant="outline"
                className="flex-1"
                data-testid={`button-requeue-${patient.id}`}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Baris Semula
              </Button>
            </>
          )}

          <Button
            onClick={handleDelete}
            disabled={disabled}
            size="sm"
            variant={isDeleting ? "destructive" : "outline"}
            data-testid={`button-delete-${patient.id}`}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {isDeleting ? "Confirm Delete" : "Delete"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}