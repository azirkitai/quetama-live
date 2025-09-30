import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Account() {
  const { toast } = useToast();
  const [userInfo, setUserInfo] = useState({
    username: "admin",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userInfo.newPassword !== userInfo.confirmPassword) {
      toast({
        title: "Ralat",
        description: "Kata laluan baru tidak sepadan",
        variant: "destructive"
      });
      return;
    }

    if (userInfo.newPassword.length < 6) {
      toast({
        title: "Ralat",
        description: "Kata laluan mestilah sekurang-kurangnya 6 aksara",
        variant: "destructive"
      });
      return;
    }

    setIsChangingPassword(true);
    
    try {
      await apiRequest("POST", "/api/auth/change-password", {
        currentPassword: userInfo.currentPassword,
        newPassword: userInfo.newPassword
      });
      
      // Clear password fields
      setUserInfo(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
      
      toast({
        title: "Berjaya",
        description: "Kata laluan berjaya dikemaskini"
      });
    } catch (error) {
      console.error("Password change failed:", error);
      toast({
        title: "Ralat",
        description: error instanceof Error ? error.message : "Gagal menukar kata laluan",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Account</h1>
        <p className="text-muted-foreground">Urus maklumat akaun dan kata laluan</p>
      </div>

      <div className="max-w-2xl">
        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Tukar Kata Laluan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Kata Laluan Semasa</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={userInfo.currentPassword}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                  data-testid="input-current-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Kata Laluan Baru</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={userInfo.newPassword}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                  minLength={6}
                  data-testid="input-new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Sahkan Kata Laluan Baru</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={userInfo.confirmPassword}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  minLength={6}
                  data-testid="input-confirm-password"
                />
              </div>

              <Button
                type="submit"
                disabled={isChangingPassword || !userInfo.currentPassword || !userInfo.newPassword || !userInfo.confirmPassword}
                className="w-full"
                data-testid="button-change-password"
              >
                <Save className="h-4 w-4 mr-2" />
                {isChangingPassword ? "Menyimpan..." : "Tukar Kata Laluan"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle>Maklumat Keselamatan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Kata laluan mestilah sekurang-kurangnya 6 aksara</p>
            <p>• Gunakan kombinasi huruf besar, huruf kecil, dan nombor untuk keselamatan yang lebih baik</p>
            <p>• Jangan kongsikan maklumat login anda dengan orang lain</p>
            <p>• Log keluar selepas selesai menggunakan sistem</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}