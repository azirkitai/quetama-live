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
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  tvVerifier: z.string().min(4, "TV verification code must be at least 4 characters"),
});

type QrAuthFormData = z.infer<typeof qrAuthSchema>;

interface QrAuthPageProps {
  sessionId: string;
}

export default function QrAuthPage({ sessionId }: QrAuthPageProps) {
  // IMMEDIATE debug log - before any hooks
  console.log('🔥 QR AUTH PAGE RENDERING! SessionId:', sessionId);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'login' | 'verify' | 'success' | 'expired'>('login');
  const [authorizedUser, setAuthorizedUser] = useState<any>(null);
  const { toast } = useToast();

  // Debug: Check if sessionId is received
  useEffect(() => {
    console.log('🔥 QR Auth useEffect - sessionId:', sessionId);
    if (!sessionId) {
      console.error('❌ ERROR: sessionId is empty!');
      setStep('expired');
      setError('Invalid QR session. No sessionId received.');
    }
  }, [sessionId]);

  const form = useForm<QrAuthFormData>({
    resolver: zodResolver(qrAuthSchema),
    defaultValues: {
      username: "",
      password: "",
      tvVerifier: "",
    },
  });

  // Note: Session validity is checked naturally when user submits credentials
  // No need for pre-validation as it causes unnecessary API calls and errors

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
          title: "Authorization Successful",
          description: "Please enter the verification code from the TV",
        });
      } else {
        throw new Error(authResult.error || "Invalid username or password");
      }
    } catch (err: any) {
      let errorMsg = err.message || "Unexpected error occurred";
      
      // Handle specific error cases
      if (errorMsg.includes("invalid") || errorMsg.includes("expired") || errorMsg.includes("tidak sah") || errorMsg.includes("tamat tempoh")) {
        setStep('expired');
        errorMsg = "QR session has expired. Please generate a new QR code.";
      }
      
      setError(errorMsg);
      toast({
        title: "Authorization Failed",
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
          title: "QR Login Successful!",
          description: "You will be redirected to the system in a few moments",
        });

        // Auto redirect after 3 seconds
        setTimeout(() => {
          window.close(); // Close mobile browser tab
        }, 3000);
      } else {
        throw new Error(finalizeResult.error || "Invalid TV verification code");
      }
    } catch (err: any) {
      let errorMsg = err.message || "Unexpected error occurred";
      
      if (errorMsg.includes("invalid") || errorMsg.includes("expired") || errorMsg.includes("tidak sah") || errorMsg.includes("tamat tempoh")) {
        setStep('expired');
        errorMsg = "QR session has expired. Please generate a new QR code.";
      }
      
      setError(errorMsg);
      toast({
        title: "Verification Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (data: QrAuthFormData) => {
    console.log('🚀 FORM SUBMIT! Step:', step, 'Data:', data);
    if (step === 'login') {
      console.log('🔑 Calling handleLogin...');
      handleLogin(data);
    } else if (step === 'verify') {
      console.log('✅ Calling handleVerification...');
      handleVerification(data);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-sm">
        {/* Debug: Show version and sessionId */}
        <div className="mb-2 p-2 bg-yellow-200 text-black text-xs rounded">
          <div>VERSION: v3.0-HASH</div>
          <div>SessionID: {sessionId || 'KOSONG!'}</div>
          <div>Step: {step}</div>
        </div>
        
        {/* Logo and Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-full mb-3">
            <Smartphone className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            QR Login
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Clinic Calling System
          </p>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="pb-4">
            {step === 'login' && (
              <>
                <CardTitle className="text-lg text-center flex items-center justify-center gap-2">
                  <Shield className="w-5 h-5" />
                  Authorization Required
                </CardTitle>
                <CardDescription className="text-center text-sm">
                  Enter your account information to complete QR login
                </CardDescription>
              </>
            )}
            
            {step === 'verify' && (
              <>
                <CardTitle className="text-lg text-center flex items-center justify-center gap-2">
                  <Timer className="w-5 h-5" />
                  TV Verification Code
                </CardTitle>
                <CardDescription className="text-center text-sm">
                  Enter the 4-6 digit code displayed on the TV screen
                </CardDescription>
              </>
            )}

            {step === 'success' && (
              <>
                <CardTitle className="text-lg text-center flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  Login Successful!
                </CardTitle>
                <CardDescription className="text-center text-sm">
                  You have successfully logged in. The TV system will redirect automatically.
                </CardDescription>
              </>
            )}

            {step === 'expired' && (
              <>
                <CardTitle className="text-lg text-center flex items-center justify-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  Session Expired
                </CardTitle>
                <CardDescription className="text-center text-sm">
                  This QR session has expired. Please generate a new QR code from the TV.
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
                            placeholder="Your username"
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
                            placeholder="Your password"
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
                    onClick={() => console.log('👆 BUTTON CLICKED!')}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Authorizing...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Next
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
                      Authorized as: {authorizedUser.username}
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
                          <FormLabel className="text-sm">TV Verification Code</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              data-testid="input-tv-verifier"
                              placeholder="Example: 1234"
                              disabled={isLoading}
                              maxLength={6}
                              className="text-base text-center font-mono tracking-widest" // Prevent iOS zoom, center digits
                              style={{ letterSpacing: '0.5em' }}
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground mt-1">
                            See the 4-6 digit code displayed on the TV screen
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
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete Login
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
                  QR login successful for <strong>{authorizedUser?.username}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  This tab will close automatically in a few moments...
                </p>
              </div>
            )}

            {step === 'expired' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Timer className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  This QR session is no longer valid or has expired
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => window.close()}
                  data-testid="button-close-expired"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        {(step === 'login' || step === 'verify') && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <h4 className="text-xs font-medium mb-2 text-muted-foreground">
              Steps:
            </h4>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div className={step === 'login' ? 'font-medium text-foreground' : ''}>
                1. Enter your username and password
              </div>
              <div className={step === 'verify' ? 'font-medium text-foreground' : ''}>
                2. Enter the verification code from TV
              </div>
              <div>3. System will login automatically</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500 dark:text-gray-400">
          © 2025 Clinic Calling System
        </div>
      </div>
    </div>
  );
}