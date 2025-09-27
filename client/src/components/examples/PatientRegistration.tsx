import { PatientRegistration } from '../patient-registration';

export default function PatientRegistrationExample() {
  // TODO: Remove mock functionality - replace with real registration logic
  const mockNextNumber = 16;

  const handleRegister = async (patient: { name: string | null; number: number; type: "name" | "number" }) => {
    console.log("Registered patient:", patient);
    // Mock API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <div className="p-4 flex justify-center">
      <PatientRegistration
        onRegister={handleRegister}
        nextNumber={mockNextNumber}
      />
    </div>
  );
}