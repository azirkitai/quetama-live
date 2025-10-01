import { useState } from "react";
import { Bell, Trash2, RotateCcw, CheckCircle, X, Volume2, PhoneCall, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface JourneyEvent {
  timestamp: string;
  action: 'registered' | 'called' | 'in-progress' | 'completed' | 'requeued';
  roomName?: string;
  requeueReason?: string;
  fromRoom?: string;
}

interface Patient {
  id: string;
  name: string | null;
  number: number;
  status: "waiting" | "called" | "in-progress" | "completed" | "requeue";
  windowId?: string;
  windowName?: string;
  lastWindowId?: string;
  lastWindowName?: string;
  trackingHistory?: JourneyEvent[];
  registeredAt: Date | string;
  calledAt?: Date | string | null;
  completedAt?: Date | string | null;
  requeueReason?: string | null;
}

interface PatientCardProps {
  patient: Patient;
  onCall: (patientId: string) => void;
  onCallAgain: (patientId: string) => void;
  onRecall: (patientId: string) => void;
  onDelete: (patientId: string) => void;
  onComplete: (patientId: string) => void;
  onRequeue: (patientId: string, reason?: string) => void;
  disabled?: boolean;
  selectedWindow?: string; // Current selected window by user
}

export function PatientCard({
  patient,
  onCall,
  onCallAgain,
  onRecall,
  onDelete,
  onComplete,
  onRequeue,
  disabled = false,
  selectedWindow
}: PatientCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRequeueDropdown, setShowRequeueDropdown] = useState(false);
  const [showCustomReasonInput, setShowCustomReasonInput] = useState(false);
  const [customReason, setCustomReason] = useState("");

  // Check if this patient is assigned to a different room than selected
  // BUT allow all rooms to call requeued patients
  const isAssignedToOtherRoom = Boolean(patient.windowId && selectedWindow && patient.windowId !== selectedWindow && patient.status !== "requeue");
  const shouldDisableButtons = disabled || isAssignedToOtherRoom;

  const handleCall = () => {
    console.log(`Calling patient ${patient.id}`);
    onCall(patient.id);
  };

  const handleCallAgain = () => {
    console.log(`Calling again patient ${patient.id}`);
    onCallAgain(patient.id);
  };

  const handleRecall = () => {
    console.log(`Recalling patient ${patient.id}`);
    onRecall(patient.id);
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
    if (reason === "OTHER") {
      setShowCustomReasonInput(true);
      return;
    }
    console.log(`Requeueing patient ${patient.id} with reason: ${reason}`);
    onRequeue(patient.id, reason);
    setShowRequeueDropdown(false);
    setShowCustomReasonInput(false);
    setCustomReason("");
  };

  const handleSubmitCustomReason = () => {
    if (!customReason.trim()) return;
    console.log(`Requeueing patient ${patient.id} with custom reason: ${customReason}`);
    onRequeue(patient.id, customReason.trim());
    setShowRequeueDropdown(false);
    setShowCustomReasonInput(false);
    setCustomReason("");
  };

  const handleCancelRequeue = () => {
    setShowRequeueDropdown(false);
    setShowCustomReasonInput(false);
    setCustomReason("");
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
        return "Waiting";
      case "called":
        return "Called";
      case "in-progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "requeue":
        return "Requeued";
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
        {(patient.windowName || patient.lastWindowName) && (
          <div className="text-sm text-muted-foreground" data-testid={`text-window-${patient.id}`}>
            {patient.windowName || patient.lastWindowName}
            {patient.lastWindowName && !patient.windowName && (
              <span className="text-xs text-gray-400 ml-1">(Last Room)</span>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {/* Enhanced Journey History - Timeline View */}
        <div className="mb-4 space-y-2">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Patient Journey
          </div>
          
          {/* Display all journey events from trackingHistory */}
          {patient.trackingHistory && patient.trackingHistory.length > 0 ? (
            patient.trackingHistory.map((event, index) => {
              const getEventIcon = (action: string) => {
                switch (action) {
                  case 'registered':
                    return 'bg-blue-500';
                  case 'called':
                    return 'bg-green-500';
                  case 'in-progress':
                    return 'bg-purple-500';
                  case 'requeued':
                    return 'bg-yellow-500';
                  case 'completed':
                    return 'bg-gray-500';
                  default:
                    return 'bg-gray-400';
                }
              };

              const getEventLabel = (event: JourneyEvent) => {
                switch (event.action) {
                  case 'registered':
                    return 'Registration';
                  case 'called':
                    return `Called to ${event.roomName || 'Room'}`;
                  case 'in-progress':
                    return 'Consultation Started';
                  case 'requeued':
                    return 'Requeued';
                  case 'completed':
                    return 'Completed';
                  default:
                    return event.action;
                }
              };

              return (
                <div key={index} className="flex items-start gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${getEventIcon(event.action)} mt-1 flex-shrink-0`} />
                  <div className="flex-1">
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                      {getEventLabel(event)}
                    </div>
                    {event.action === 'requeued' && event.requeueReason && (
                      <div className="text-yellow-700 dark:text-yellow-500 font-medium text-xs">
                        Reason: {event.requeueReason}
                      </div>
                    )}
                    {event.action === 'requeued' && event.fromRoom && (
                      <div className="text-gray-500 dark:text-gray-400 text-xs">
                        From: {event.fromRoom}
                      </div>
                    )}
                    <div className="text-gray-500 dark:text-gray-400">
                      {new Date(event.timestamp).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              No journey history available
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {patient.status === "waiting" && (
            <Button
              onClick={handleCall}
              disabled={shouldDisableButtons}
              size="sm"
              className="flex-1"
              data-testid={`button-call-${patient.id}`}
            >
              <Bell className="h-4 w-4 mr-1" />
              Call
            </Button>
          )}

          {patient.status === "requeue" && (
            <>
              <Button
                onClick={handleCall}
                disabled={shouldDisableButtons}
                size="sm"
                variant="default"
                className="flex-1"
                data-testid={`button-call-${patient.id}`}
              >
                <Bell className="h-4 w-4 mr-1" />
                Call
              </Button>
              <Button
                onClick={handleRecall}
                disabled={shouldDisableButtons}
                size="sm"
                variant="secondary"
                className="flex-1"
                data-testid={`button-recall-${patient.id}`}
              >
                <PhoneCall className="h-4 w-4 mr-1" />
                Recall to Last Room
              </Button>
            </>
          )}

          {(patient.status === "called" || patient.status === "in-progress") && (
            <>
              <Button
                onClick={handleCallAgain}
                disabled={shouldDisableButtons}
                size="sm"
                variant="secondary"
                className="flex-1"
                data-testid={`button-call-again-${patient.id}`}
              >
                <Volume2 className="h-4 w-4 mr-1" />
                Call Again
              </Button>
              
              <Button
                onClick={handleComplete}
                disabled={shouldDisableButtons}
                size="sm"
                variant="default"
                className="flex-1"
                data-testid={`button-complete-${patient.id}`}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete
              </Button>
              
              {!showRequeueDropdown ? (
                <Button
                  onClick={handleRequeue}
                  disabled={shouldDisableButtons}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  data-testid={`button-requeue-${patient.id}`}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Requeue
                </Button>
              ) : (
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {showCustomReasonInput ? "Enter reason:" : "Select requeue reason:"}
                    </span>
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
                  
                  {!showCustomReasonInput ? (
                    <Select onValueChange={handleRequeueWithReason}>
                      <SelectTrigger className="w-full" data-testid={`select-requeue-reason-${patient.id}`}>
                        <SelectValue placeholder="Select reason..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEBULISER">NEBULISER</SelectItem>
                        <SelectItem value="GET MEDICATION">GET MEDICATION</SelectItem>
                        <SelectItem value="WAITING FOR TEST RESULTS">WAITING FOR TEST RESULTS</SelectItem>
                        <SelectItem value="MGTT">MGTT</SelectItem>
                        <SelectItem value="OTHER">OTHER</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="Enter requeue reason..."
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customReason.trim()) {
                            handleSubmitCustomReason();
                          }
                        }}
                        className="w-full"
                        data-testid={`input-custom-reason-${patient.id}`}
                        autoFocus
                      />
                      <Button
                        onClick={handleSubmitCustomReason}
                        disabled={!customReason.trim()}
                        size="sm"
                        className="w-full"
                        data-testid={`button-submit-custom-reason-${patient.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Requeue
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <Button
            onClick={handleDelete}
            disabled={shouldDisableButtons}
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