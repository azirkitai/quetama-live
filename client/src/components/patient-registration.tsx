import { useState } from "react";
import { UserPlus, Hash, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

interface PatientRegistrationProps {
  onRegister: (patient: { name: string | null; number: number; type: "name" | "number" }) => void;
  nextNumber: number;
}

export function PatientRegistration({ onRegister, nextNumber }: PatientRegistrationProps) {
  const [registrationType, setRegistrationType] = useState<"name" | "number">("name");
  const [patientName, setPatientName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const patientData = {
        name: registrationType === "name" ? patientName.trim() || null : null,
        number: nextNumber,
        type: registrationType
      };

      console.log("Registering patient:", patientData);
      await onRegister(patientData);

      // Reset form
      setPatientName("");
      
      // Mock printing number for number-based registration
      if (registrationType === "number") {
        console.log("Printing number slip for patient:", nextNumber);
        // TODO: Remove mock functionality - integrate with actual printing machine
      }
      
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateNumber = () => {
    if (registrationType === "number") {
      console.log("Generating number:", nextNumber);
      handleSubmit(new Event('submit') as any);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserPlus className="h-5 w-5 mr-2" />
          Daftar Pesakit
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Registration Type Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Jenis Pendaftaran</Label>
          <RadioGroup
            value={registrationType}
            onValueChange={(value: "name" | "number") => setRegistrationType(value)}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem 
                value="name" 
                id="name"
                data-testid="radio-registration-name"
              />
              <Label htmlFor="name" className="flex items-center cursor-pointer">
                <UserPlus className="h-4 w-4 mr-2" />
                Daftar dengan Nama
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem 
                value="number" 
                id="number"
                data-testid="radio-registration-number"
              />
              <Label htmlFor="number" className="flex items-center cursor-pointer">
                <Hash className="h-4 w-4 mr-2" />
                Daftar dengan Nombor Sahaja
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Next Number Display */}
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Nombor Seterusnya:
          </span>
          <Badge 
            variant="outline" 
            className="text-lg font-bold px-3 py-1 border-blue-300 text-blue-700"
            data-testid="badge-next-number"
          >
            #{nextNumber.toString().padStart(3, '0')}
          </Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Name Input (only for name registration) */}
          {registrationType === "name" && (
            <div className="space-y-2">
              <Label htmlFor="patientName">Nama Pesakit</Label>
              <Input
                id="patientName"
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Masukkan nama pesakit"
                data-testid="input-patient-name"
              />
            </div>
          )}

          {/* Submit Buttons */}
          <div className="space-y-2">
            {registrationType === "name" ? (
              <Button
                type="submit"
                disabled={isSubmitting || !patientName.trim()}
                className="w-full"
                data-testid="button-register-patient"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {isSubmitting ? "Mendaftar..." : "Daftar Pesakit"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleGenerateNumber}
                disabled={isSubmitting}
                className="w-full"
                data-testid="button-generate-number"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isSubmitting ? "Menjana..." : "Jana Nombor & Cetak"}
              </Button>
            )}
          </div>
        </form>

        {/* Information Box */}
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
          <p>
            <strong>Panduan:</strong>
          </p>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Pilih "Nama" untuk pesakit yang ingin memberikan nama lengkap</li>
            <li>Pilih "Nombor" untuk sistem nombor berjujukan sahaja</li>
            <li>Nombor akan dicetak secara automatik untuk pendaftaran nombor</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}