import { useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PatientRegistration } from "@/components/patient-registration";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users, Hash, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Patient } from "@shared/schema";

export default function Register() {
  const { toast } = useToast();

  // Fetch all patients (24-hour clinic operation)
  const { data: todayPatients = [], isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  // Fetch next patient number
  const { data: nextNumberData, isLoading: nextNumberLoading } = useQuery<{ nextNumber: number }>({
    queryKey: ['/api/patients/next-number'],
  });

  // Create patient mutation
  const createPatientMutation = useMutation({
    mutationFn: async (patientData: { name: string | null; number: number }) => {
      const response = await apiRequest("POST", "/api/patients", patientData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/patients/next-number'] });
      
      toast({
        title: "Pendaftaran Berjaya",
        description: "Pesakit telah didaftarkan ke dalam sistem",
      });
    },
    onError: (error) => {
      console.error("Error registering patient:", error);
      toast({
        title: "Ralat Pendaftaran",
        description: "Gagal mendaftarkan pesakit. Sila cuba semula.",
        variant: "destructive",
      });
    },
  });

  // Calculate stats from today's patients (client-side filtering for 24-hour clinics)
  const todayStats = useMemo(() => {
    if (!todayPatients) {
      return {
        totalRegistered: 0,
        nameRegistrations: 0,
        numberRegistrations: 0
      };
    }

    // Filter patients registered today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const actualTodayPatients = todayPatients.filter(p => {
      const regDate = new Date(p.registeredAt);
      return regDate >= today && regDate < tomorrow;
    });

    return {
      totalRegistered: actualTodayPatients.length,
      nameRegistrations: actualTodayPatients.filter(p => p.name).length,
      numberRegistrations: actualTodayPatients.filter(p => !p.name).length
    };
  }, [todayPatients]);

  // Transform patients for recent list display
  const recentPatients = useMemo(() => {
    if (!todayPatients) return [];
    
    return todayPatients
      .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
      .slice(0, 10)
      .map(patient => ({
        id: patient.id,
        name: patient.name,
        number: patient.number,
        registeredAt: new Date(patient.registeredAt).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        type: patient.name ? "name" as const : "number" as const
      }));
  }, [todayPatients]);

  const handleRegister = (patient: { name: string | null; number: number; type: "name" | "number" }) => {
    console.log("Registering patient:", patient);
    createPatientMutation.mutate(patient);
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
            nextNumber={nextNumberData?.nextNumber || 1}
            isRegistering={createPatientMutation.isPending}
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