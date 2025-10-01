import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, LogIn, QrCode, Smartphone, Timer } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { QRCodeSVG } from "qrcode.react";
import { io, Socket } from "socket.io-client";
import quetamaLogo from "@assets/QUEUE MANAGEMENT SYSTEM_1759210094923.png";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username diperlukan"),
  password: z.string().min(1, "Password diperlukan"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // QR Code functionality state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [qrStatus, setQrStatus] = useState<'loading' | 'active' | 'authorized' | 'expired'>('loading');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [verifierInput, setVerifierInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/auth/login", data);
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Login Berjaya",
          description: `Selamat datang, ${result.user.username}!`,
        });
        
        // Call the callback to update app state
        onLoginSuccess(result.user);
      } else {
        setError("Login gagal. Sila cuba lagi.");
      }
    } catch (err: any) {
      const errorMsg = err.message || "Ralat tidak dijangka berlaku";
      setError(errorMsg);
      
      toast({
        title: "Login Gagal",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // QR Code functionality
  const handleQrLogin = async () => {
    try {
      setIsQrModalOpen(true);
      setQrStatus('loading');
      
      // Generate QR session
      const response = await apiRequest("POST", "/api/qr/init");
      const result = await response.json();
      
      if (result.qrId) {
        const sessionId = result.qrId;
        setQrSessionId(sessionId);
        
        // Calculate countdown from expiresAt
        const expiresAt = new Date(result.expiresAt);
        const now = new Date();
        const expiresIn = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
        setCountdown(Math.max(0, expiresIn));
        setQrStatus('active');
        
        // Use QR URL from backend response
        setQrUrl(result.qrUrl);
        
        // Connect to WebSocket for real-time updates
        initializeQrWebSocket(sessionId);
        
        toast({
          title: "QR Code Dijana",
          description: "Imbas kod QR dengan telefon bimbit anda",
        });
      } else {
        throw new Error(result.error || "Gagal menjana QR code");
      }
    } catch (err: any) {
      const errorMsg = err.message || "Ralat tidak dijangka berlaku";
      setError(errorMsg);
      setIsQrModalOpen(false);
      
      toast({
        title: "QR Code Gagal",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const initializeQrWebSocket = (sessionId: string) => {
    const newSocket = io();
    
    newSocket.on('connect', () => {
      // Join QR session room
      newSocket.emit('qr:join', { qrId: sessionId });
    });
    
    newSocket.on('qr:authorization_complete', (data) => {
      setQrStatus('authorized');
      toast({
        title: "Pengesahan Berjaya",
        description: "Menunggu pengesahan akhir...",
      });
    });
    
    newSocket.on('qr:login_complete', (data) => {
      toast({
        title: "Login QR Berjaya",
        description: `Selamat datang, ${data.user.username}!`,
      });
      
      // Close modal and login
      setIsQrModalOpen(false);
      onLoginSuccess(data.user);
    });
    
    newSocket.on('qr:expired', () => {
      setQrStatus('expired');
      toast({
        title: "QR Code Tamat Tempoh",
        description: "Sila jana QR code baharu",
        variant: "destructive",
      });
    });
    
    newSocket.on('disconnect', () => {
      console.log('QR WebSocket disconnected');
    });
    
    setSocket(newSocket);
  };

  const handleVerifierSubmit = async () => {
    if (!qrSessionId || !verifierInput || verifierInput.length !== 6) {
      toast({
        title: "Kod Tidak Lengkap",
        description: "Sila masukkan 6-digit kod dari telefon anda",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsVerifying(true);
      const response = await apiRequest("POST", `/api/qr/${qrSessionId}/finalize`, {
        tvVerifier: verifierInput
      });
      const result = await response.json();

      if (result.success && result.userId) {
        toast({
          title: "Login QR Berjaya",
          description: "Mengalihkan ke dashboard...",
        });
        
        // Redirect to dashboard (which has fullscreen TV display mode)
        window.location.href = '/?fullscreen=1';
      } else {
        throw new Error(result.error || "Kod verifikasi tidak sah");
      }
    } catch (err: any) {
      toast({
        title: "Verifikasi Gagal",
        description: err.message || "Kod tidak sah. Sila cuba lagi.",
        variant: "destructive",
      });
      setVerifierInput('');
    } finally {
      setIsVerifying(false);
    }
  };

  const closeQrModal = () => {
    setIsQrModalOpen(false);
    setQrSessionId(null);
    setQrUrl(null);
    setQrStatus('loading');
    setCountdown(0);
    setVerifierInput('');
    
    // Disconnect WebSocket
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (countdown > 0 && qrStatus === 'active') {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setQrStatus('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown, qrStatus]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <img 
            src={quetamaLogo} 
            alt="QueTAMA System" 
            className="mx-auto mb-4 max-w-full h-auto"
            style={{ maxHeight: '180px' }}
          />
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Log Masuk</CardTitle>
            <CardDescription className="text-center">
              Masukkan maklumat akaun anda untuk mengakses sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-username"
                          placeholder="Masukkan username anda"
                          disabled={isLoading}
                          autoComplete="username"
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-password"
                          type="password"
                          placeholder="Masukkan password anda"
                          disabled={isLoading}
                          autoComplete="current-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  data-testid="button-login"
                  className="w-full text-white border-0"
                  disabled={isLoading}
                  style={{
                    background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
                    backgroundImage: 'linear-gradient(180deg, #1e293b 0%, #0f172a 50%, #020617 100%)'
                  }}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Sedang log masuk...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Log Masuk
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* QR Code Login Separator */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Atau
                </span>
              </div>
            </div>

            {/* QR Code Login Button */}
            <Button
              type="button"
              variant="outline"
              data-testid="button-qr-login"
              className="w-full"
              onClick={handleQrLogin}
              disabled={isLoading}
            >
              <QrCode className="w-4 h-4 mr-2" />
              Log Masuk dengan QR Code
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          © 2025 Sistem Panggilan Klinik. Hak cipta terpelihara.
        </div>
      </div>

      {/* QR Code Modal */}
      <Dialog open={isQrModalOpen} onOpenChange={closeQrModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Login dengan QR Code
            </DialogTitle>
            <DialogDescription>
              Imbas kod QR di bawah dengan telefon bimbit anda untuk log masuk dengan mudah
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-4">
            {qrStatus === 'loading' && (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Menjana QR Code...</p>
              </div>
            )}

            {qrStatus === 'active' && qrUrl && (
              <>
                {/* QR Code */}
                <div className="p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
                  <QRCodeSVG 
                    value={qrUrl}
                    size={200}
                    level="M"
                    data-testid="qr-code"
                  />
                </div>
                
                {/* Countdown and Instructions */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Timer className="w-4 h-4" />
                    <span data-testid="text-countdown">
                      Tamat tempoh dalam {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    1. Imbas QR code dengan kamera telefon
                  </p>
                  <p className="text-sm text-muted-foreground">
                    2. Log masuk pada halaman yang terbuka
                  </p>
                  <p className="text-sm text-muted-foreground">
                    3. Sistem akan mengalihkan anda secara automatik
                  </p>
                </div>
              </>
            )}

            {qrStatus === 'authorized' && (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-green-600 dark:text-green-400">
                    Pengesahan Berjaya!
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Masukkan kod 6-digit yang dipaparkan di telefon anda
                  </p>
                </div>

                {/* Verifier Input Field */}
                <div className="w-full max-w-xs space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Kod Pengesahan</label>
                    <Input
                      type="text"
                      maxLength={6}
                      value={verifierInput}
                      onChange={(e) => setVerifierInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="000000"
                      className="text-center text-2xl font-mono tracking-widest"
                      disabled={isVerifying}
                      data-testid="input-verifier"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && verifierInput.length === 6) {
                          handleVerifierSubmit();
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleVerifierSubmit}
                    disabled={verifierInput.length !== 6 || isVerifying}
                    className="w-full"
                    data-testid="button-verify"
                  >
                    {isVerifying ? "Mengesahkan..." : "Sahkan"}
                  </Button>
                </div>

                {/* Countdown if still active */}
                {countdown > 0 && (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Timer className="w-3 h-3" />
                    <span>
                      Tamat tempoh dalam {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {qrStatus === 'expired' && (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <Timer className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-red-600 dark:text-red-400">
                    QR Code Tamat Tempoh
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sila tutup dan cuba lagi untuk menjana QR code baharu
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={closeQrModal}
                  data-testid="button-close-qr"
                >
                  Tutup
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}