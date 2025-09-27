import { useState } from "react";
import { PatientRegistration } from "@/components/patient-registration";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users, Hash, Clock } from "lucide-react";

interface RecentPatient {
  id: string;
  name: string | null;
  number: number;
  registeredAt: string;
  type: "name" | "number";
}

export default function Register() {
  const [nextNumber, setNextNumber] = useState(1);
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [todayStats, setTodayStats] = useState({
    totalRegistered: 0,
    nameRegistrations: 0,
    numberRegistrations: 0
  });

  const handleRegister = (patient: { name: string | null; number: number; type: "name" | "number" }) => {
    console.log("Registering patient:", patient);
    
    const newPatient: RecentPatient = {
      id: `p${Date.now()}`,
      name: patient.name,
      number: patient.number,
      registeredAt: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      type: patient.type
    };

    // Add to recent patients
    setRecentPatients(prev => [newPatient, ...prev.slice(0, 9)]);
    
    // Update next number
    setNextNumber(prev => prev + 1);
    
    // Update stats
    setTodayStats(prev => ({
      totalRegistered: prev.totalRegistered + 1,
      nameRegistrations: prev.nameRegistrations + (patient.type === "name" ? 1 : 0),
      numberRegistrations: prev.numberRegistrations + (patient.type === "number" ? 1 : 0)
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Register</h1>
        <p className="text-muted-foreground">Daftar pesakit baru ke dalam sistem</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Form */}
        <div className="lg:col-span-1">
          <PatientRegistration
            onRegister={handleRegister}
            nextNumber={nextNumber}
          />
        </div>

        {/* Stats and Recent Patients */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Stats */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Statistik Hari Ini
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Total Daftar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary" data-testid="text-total-registered">
                    {todayStats.totalRegistered}
                  </div>
                  <p className="text-xs text-muted-foreground">pesakit</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Dengan Nama
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600" data-testid="text-name-registrations">
                    {todayStats.nameRegistrations}
                  </div>
                  <p className="text-xs text-muted-foreground">pesakit</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Hash className="h-4 w-4 mr-2" />
                    Nombor Sahaja
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600" data-testid="text-number-registrations">
                    {todayStats.numberRegistrations}
                  </div>
                  <p className="text-xs text-muted-foreground">pesakit</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Registrations */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Pendaftaran Terkini
            </h2>
            <Card>
              <CardContent className="p-0">
                {recentPatients.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Belum ada pendaftaran hari ini
                  </div>
                ) : (
                  <div className="divide-y">
                    {recentPatients.map((patient) => (
                      <div 
                        key={patient.id} 
                        className="p-4 flex items-center justify-between hover:bg-muted/50"
                        data-testid={`recent-patient-${patient.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-lg font-bold text-primary">
                            #{patient.number.toString().padStart(3, '0')}
                          </div>
                          <div>
                            <div className="font-medium">
                              {patient.name || "Tanpa Nama"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {patient.registeredAt}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={patient.type === "name" ? "default" : "outline"}
                            data-testid={`badge-type-${patient.id}`}
                          >
                            {patient.type === "name" ? "Nama" : "Nombor"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}