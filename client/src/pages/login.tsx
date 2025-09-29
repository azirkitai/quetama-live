import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, LogIn, Stethoscope } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Stethoscope className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Sistem Panggilan Klinik
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sistem pengurusan barisan pesakit yang komprehensif
          </p>
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
                  className="w-full"
                  disabled={isLoading}
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

            {/* Demo Users Info */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                Akaun Demo Tersedia:
              </h4>
              <div className="text-xs space-y-1 text-muted-foreground">
                <div><strong>Admin:</strong> admin / password123</div>
                <div><strong>User:</strong> user / userpass</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          © 2025 Sistem Panggilan Klinik. Hak cipta terpelihara.
        </div>
      </div>
    </div>
  );
}