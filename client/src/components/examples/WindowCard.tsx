import { WindowCard } from '../window-card';

export default function WindowCardExample() {
  // TODO: Remove mock functionality - replace with real window data
  const mockActiveWindow = {
    id: "window-1",
    name: "Bilik 1 - Dr. Sarah Ahmad",
    isActive: true,
    currentPatientId: "patient-123",
    currentPatientName: "Ahmad bin Rahman",
    currentPatientNumber: 15
  };

  const mockInactiveWindow = {
    id: "window-2", 
    name: "Bilik 2 - Dr. Azman",
    isActive: false
  };

  const mockEmptyWindow = {
    id: "window-3",
    name: "Bilik 3 - Nurse Linda",
    isActive: true
  };

  const handleEdit = (windowId: string, newName: string) => {
    console.log(`Edited window ${windowId} to: ${newName}`);
  };

  const handleDelete = (windowId: string) => {
    console.log(`Deleted window: ${windowId}`);
  };

  const handleToggleStatus = (windowId: string) => {
    console.log(`Toggled status for window: ${windowId}`);
  };

  return (
    <div className="space-y-4 p-4 max-w-md">
      <WindowCard
        window={mockActiveWindow}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />
      <WindowCard
        window={mockInactiveWindow}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />
      <WindowCard
        window={mockEmptyWindow}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
}