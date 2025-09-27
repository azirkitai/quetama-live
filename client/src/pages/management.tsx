import { useState, useEffect } from "react";
import { WindowCard } from "@/components/window-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Settings } from "lucide-react";

interface Window {
  id: string;
  name: string;
  isActive: boolean;
  currentPatientId?: string;
  currentPatientName?: string;
  currentPatientNumber?: number;
}

export default function Management() {
  const [windows, setWindows] = useState<Window[]>([]);
  const [newWindowName, setNewWindowName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // TODO: Remove mock functionality - replace with real data from backend
  useEffect(() => {
    const mockWindows: Window[] = [
      {
        id: "w1",
        name: "Bilik 1 - Dr. Sarah Ahmad",
        isActive: true,
        currentPatientId: "p1",
        currentPatientName: "Ahmad bin Rahman",
        currentPatientNumber: 15
      },
      {
        id: "w2",
        name: "Bilik 2 - Dr. Azman",
        isActive: false
      },
      {
        id: "w3",
        name: "Bilik 3 - Nurse Linda",
        isActive: true
      },
      {
        id: "w4",
        name: "Bilik 4 - Dr. Aisyah",
        isActive: true
      },
      {
        id: "w5",
        name: "Bilik Kecemasan",
        isActive: false
      }
    ];

    setWindows(mockWindows);
  }, []);

  const handleAddWindow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWindowName.trim()) return;

    setIsAdding(true);
    try {
      const newWindow: Window = {
        id: `w${Date.now()}`,
        name: newWindowName.trim(),
        isActive: true
      };

      console.log("Adding new window:", newWindow);
      setWindows(prev => [...prev, newWindow]);
      setNewWindowName("");
      
      // TODO: Remove mock functionality - send to backend
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error("Failed to add window:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditWindow = async (windowId: string, newName: string) => {
    console.log(`Editing window ${windowId} to: ${newName}`);
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, name: newName } : w
    ));
    
    // TODO: Remove mock functionality - send to backend
  };

  const handleDeleteWindow = async (windowId: string) => {
    console.log(`Deleting window: ${windowId}`);
    setWindows(prev => prev.filter(w => w.id !== windowId));
    
    // TODO: Remove mock functionality - send to backend
  };

  const handleToggleStatus = async (windowId: string) => {
    console.log(`Toggling status for window: ${windowId}`);
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, isActive: !w.isActive } : w
    ));
    
    // TODO: Remove mock functionality - send to backend
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Management</h1>
        <p className="text-muted-foreground">Urus bilik rawatan dan tetapan window</p>
      </div>

      {/* Add New Window */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Tambah Bilik Baru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddWindow} className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="windowName" className="sr-only">
                Nama Bilik
              </Label>
              <Input
                id="windowName"
                type="text"
                value={newWindowName}
                onChange={(e) => setNewWindowName(e.target.value)}
                placeholder="Masukkan nama bilik (cth: Bilik 6 - Dr. Ahmad)"
                data-testid="input-new-window-name"
              />
            </div>
            <Button
              type="submit"
              disabled={isAdding || !newWindowName.trim()}
              data-testid="button-add-window"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isAdding ? "Menambah..." : "Tambah"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Windows List */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Senarai Bilik ({windows.length})
        </h2>
        
        {windows.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                Belum ada bilik yang didaftarkan
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {windows.map((window) => (
              <WindowCard
                key={window.id}
                window={window}
                onEdit={handleEditWindow}
                onDelete={handleDeleteWindow}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Bilik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-windows">
              {windows.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Bilik Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-active-windows">
              {windows.filter(w => w.isActive).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Sedang Digunakan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-occupied-windows">
              {windows.filter(w => w.currentPatientId).length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}