import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Smartphone, Shield, Timer } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// QR Auth form schema
const qrAuthSchema = z.object({
  username: z.string().min(1, "Username diperlukan"),
  password: z.string().min(1, "Password diperlukan"),
  tvVerifier: z.string().min(4, "Kod pengesahan TV mesti sekurang-kurangnya 4 aksara"),
});

type QrAuthFormData = z.infer<typeof qrAuthSchema>;

interface QrAuthPageProps {
  sessionId: string;
}

export default function QrAuthPage({ sessionId }: QrAuthPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'login' | 'verify' | 'success' | 'expired'>('login');
  const [authorizedUser, setAuthorizedUser] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<QrAuthFormData>({
    resolver: zodResolver(qrAuthSchema),
    defaultValues: {
      username: "",
      password: "",
      tvVerifier: "",
    },
  });

  // Check QR session validity on mount
  useEffect(() => {
    checkSessionValidity();
  }, [sessionId]);

  const checkSessionValidity = async () => {
    try {
      // Check if session exists and is still valid
      const response = await apiRequest("POST", `/api/qr/${sessionId}/authorize`, {
        username: "",
        password: "",
      });
      const result = await response.json();
      
      // If we get a specific "session not found" or "expired" error, set to expired
      if (result.error && (
        result.error.includes("tidak dijumpai") || 
        result.error.includes("tamat tempoh") ||
        result.error.includes("expired")
      )) {
        setStep('expired');
      }
      // Otherwise, session exists (even if credentials are wrong, which is expected)
    } catch (err: any) {
      // If we get network error or server error, assume session might be expired
      if (err.message && (
        err.message.includes("tidak dijumpai") ||
        err.message.includes("tamat tempoh") ||
        err.message.includes("expired") ||
        err.message.includes("404")
      )) {
        setStep('expired');
      }
    }
  };

  const handleLogin = async (data: QrAuthFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Authorize with username/password
      const authResponse = await apiRequest("POST", `/api/qr/${sessionId}/authorize`, {
        username: data.username,
        password: data.password,
      });
      const authResult = await authResponse.json();

      if (authResult.success) {
        setAuthorizedUser(authResult.user);
        setStep('verify');
        
        toast({
          title: "Pengesahan Berjaya",
          description: "Sila masukkan kod pengesahan dari TV",
        });
      } else {
        throw new Error(authResult.error || "Username atau password tidak sah");
      }
    } catch (err: any) {
      let errorMsg = err.message || "Ralat tidak dijangka berlaku";
      
      // Handle specific error cases
      if (errorMsg.includes("tidak sah") || errorMsg.includes("tamat tempoh")) {
        setStep('expired');
        errorMsg = "Sesi QR telah tamat tempoh. Sila jana QR code baharu.";
      }
      
      setError(errorMsg);
      toast({
        title: "Pengesahan Gagal",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (data: QrAuthFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 2: Finalize with TV verifier
      const finalizeResponse = await apiRequest("POST", `/api/qr/${sessionId}/finalize`, {
        tvVerifier: data.tvVerifier,
      });
      const finalizeResult = await finalizeResponse.json();

      if (finalizeResult.success) {
        setStep('success');
        
        toast({
          title: "Login QR Berjaya!",
          description: "Anda akan dialihkan ke sistem dalam beberapa saat",
        });

        // Auto redirect after 3 seconds
        setTimeout(() => {
          window.close(); // Close mobile browser tab
        }, 3000);
      } else {
        throw new Error(finalizeResult.error || "Kod pengesahan TV tidak sah");
      }
    } catch (err: any) {
      let errorMsg = err.message || "Ralat tidak dijangka berlaku";
      
      if (errorMsg.includes("tidak sah") || errorMsg.includes("tamat tempoh")) {
        setStep('expired');
        errorMsg = "Sesi QR telah tamat tempoh. Sila jana QR code baharu.";
      }
      
      setError(errorMsg);
      toast({
        title: "Pengesahan Gagal",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (data: QrAuthFormData) => {
    if (step === 'login') {
      handleLogin(data);
    } else if (step === 'verify') {
      handleVerification(data);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-sm">
        {/* Logo and Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-full mb-3">
            <Smartphone className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            Login QR
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Sistem Panggilan Klinik
          </p>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="pb-4">
            {step === 'login' && (
              <>
                <CardTitle className="text-lg text-center flex items-center justify-center gap-2">
                  <Shield className="w-5 h-5" />
                  Pengesahan Diperlukan
                </CardTitle>
                <CardDescription className="text-center text-sm">
                  Masukkan maklumat akaun anda untuk melengkapkan login QR
                </CardDescription>
              </>
            )}
            
            {step === 'verify' && (
              <>
                <CardTitle className="text-lg text-center flex items-center justify-center gap-2">
                  <Timer className="w-5 h-5" />
                  Kod Pengesahan TV
                </CardTitle>
                <CardDescription className="text-center text-sm">
                  Masukkan kod 4-6 digit yang terpapar pada skrin TV
                </CardDescription>
              </>
            )}

            {step === 'success' && (
              <>
                <CardTitle className="text-lg text-center flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  Login Berjaya!
                </CardTitle>
                <CardDescription className="text-center text-sm">
                  Anda telah berjaya log masuk. Sistem TV akan dialihkan secara automatik.
                </CardDescription>
              </>
            )}

            {step === 'expired' && (
              <>
                <CardTitle className="text-lg text-center flex items-center justify-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  Sesi Tamat Tempoh
                </CardTitle>
                <CardDescription className="text-center text-sm">
                  Sesi QR ini telah tamat tempoh. Sila jana QR code baharu dari TV.
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="pt-0">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {step === 'login' && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Username</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-qr-username"
                            placeholder="Username anda"
                            disabled={isLoading}
                            autoComplete="username"
                            className="text-base" // Prevent iOS zoom
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-qr-password"
                            type="password"
                            placeholder="Password anda"
                            disabled={isLoading}
                            autoComplete="current-password"
                            className="text-base" // Prevent iOS zoom
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    data-testid="button-qr-authorize"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Mengesahkan...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Seterusnya
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            )}

            {step === 'verify' && authorizedUser && (
              <>
                {/* User Info */}
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Dipengesahkan sebagai: {authorizedUser.username}
                    </span>
                  </div>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="tvVerifier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Kod Pengesahan TV</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              data-testid="input-tv-verifier"
                              placeholder="Contoh: 1234"
                              disabled={isLoading}
                              maxLength={6}
                              className="text-base text-center font-mono tracking-widest" // Prevent iOS zoom, center digits
                              style={{ letterSpacing: '0.5em' }}
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground mt-1">
                            Lihat kod 4-6 digit yang terpapar pada skrin TV
                          </p>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      data-testid="button-qr-finalize"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Mengesahkan...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Selesaikan Login
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </>
            )}

            {step === 'success' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Login QR berjaya untuk <strong>{authorizedUser?.username}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Tab ini akan ditutup secara automatik dalam beberapa saat...
                </p>
              </div>
            )}

            {step === 'expired' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Timer className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Sesi QR ini tidak lagi sah atau telah tamat tempoh
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => window.close()}
                  data-testid="button-close-expired"
                  className="w-full"
                >
                  Tutup
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        {(step === 'login' || step === 'verify') && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <h4 className="text-xs font-medium mb-2 text-muted-foreground">
              Langkah-langkah:
            </h4>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div className={step === 'login' ? 'font-medium text-foreground' : ''}>
                1. Masukkan username dan password anda
              </div>
              <div className={step === 'verify' ? 'font-medium text-foreground' : ''}>
                2. Masukkan kod pengesahan dari TV
              </div>
              <div>3. Sistem akan login secara automatik</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500 dark:text-gray-400">
          © 2025 Sistem Panggilan Klinik
        </div>
      </div>
    </div>
  );
}