import { useState } from "react";
import { Bell, Trash2, RotateCcw, CheckCircle, X, Volume2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  onCallAgain: (patientId: string) => void;
  onDelete: (patientId: string) => void;
  onComplete: (patientId: string) => void;
  onRequeue: (patientId: string, reason?: string) => void;
  disabled?: boolean;
}

export function PatientCard({
  patient,
  onCall,
  onCallAgain,
  onDelete,
  onComplete,
  onRequeue,
  disabled = false
}: PatientCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRequeueDropdown, setShowRequeueDropdown] = useState(false);

  const handleCall = () => {
    console.log(`Calling patient ${patient.id}`);
    onCall(patient.id);
  };

  const handleCallAgain = () => {
    console.log(`Calling again patient ${patient.id}`);
    onCallAgain(patient.id);
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
    setShowRequeueDropdown(true);
  };

  const handleRequeueWithReason = (reason: string) => {
    console.log(`Requeueing patient ${patient.id} with reason: ${reason}`);
    onRequeue(patient.id, reason);
    setShowRequeueDropdown(false);
  };

  const handleCancelRequeue = () => {
    setShowRequeueDropdown(false);
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
          {(patient.status === "waiting" || patient.status === "requeue") && (
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

          {(patient.status === "called" || patient.status === "in-progress") && (
            <>
              <Button
                onClick={handleCallAgain}
                disabled={disabled}
                size="sm"
                variant="secondary"
                className="flex-1"
                data-testid={`button-call-again-${patient.id}`}
              >
                <Volume2 className="h-4 w-4 mr-1" />
                Panggil Lagi
              </Button>
              
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
              
              {!showRequeueDropdown ? (
                <Button
                  onClick={handleRequeue}
                  disabled={disabled}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  data-testid={`button-requeue-${patient.id}`}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reque
                </Button>
              ) : (
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pilih sebab reque:</span>
                    <Button
                      onClick={handleCancelRequeue}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      data-testid={`button-cancel-requeue-${patient.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Select onValueChange={handleRequeueWithReason}>
                    <SelectTrigger className="w-full" data-testid={`select-requeue-reason-${patient.id}`}>
                      <SelectValue placeholder="Pilih sebab..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEBULISER">NEBULISER</SelectItem>
                      <SelectItem value="AMBIL UBATAN">AMBIL UBATAN</SelectItem>
                      <SelectItem value="MENUNGGU KEPUTUSAN UJIAN">MENUNGGU KEPUTUSAN UJIAN</SelectItem>
                      <SelectItem value="MGTT">MGTT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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