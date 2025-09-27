import { PatientCard } from '../patient-card';

export default function PatientCardExample() {
  // TODO: Remove mock functionality - replace with real patient data
  const mockPatient = {
    id: "patient-1",
    name: "Ahmad bin Rahman",
    number: 15,
    status: "waiting" as const,
    windowName: "Bilik 1 - Dr. Sarah",
    trackingHistory: [
      "Registered at 9:15 AM",
      "Moved to waiting queue at 9:16 AM"
    ]
  };

  const mockInProgressPatient = {
    id: "patient-2",
    name: null,
    number: 12,
    status: "in-progress" as const,
    windowName: "Bilik 2 - Dr. Ahmad",
    trackingHistory: [
      "Registered at 8:45 AM",
      "Called at 9:30 AM",
      "In consultation since 9:35 AM"
    ]
  };

  const handleCall = (patientId: string) => {
    console.log(`Called patient: ${patientId}`);
  };

  const handleDelete = (patientId: string) => {
    console.log(`Deleted patient: ${patientId}`);
  };

  const handleComplete = (patientId: string) => {
    console.log(`Completed patient: ${patientId}`);
  };

  const handleRequeue = (patientId: string) => {
    console.log(`Requeued patient: ${patientId}`);
  };

  return (
    <div className="space-y-4 p-4">
      <PatientCard
        patient={mockPatient}
        onCall={handleCall}
        onDelete={handleDelete}
        onComplete={handleComplete}
        onRequeue={handleRequeue}
      />
      <PatientCard
        patient={mockInProgressPatient}
        onCall={handleCall}
        onDelete={handleDelete}
        onComplete={handleComplete}
        onRequeue={handleRequeue}
      />
    </div>
  );
}