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
        title: "Error",
        description: "New password does not match",
        variant: "destructive"
      });
      return;
    }

    if (userInfo.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
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
        title: "Success",
        description: "Password successfully updated"
      });
    } catch (error) {
      console.error("Password change failed:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password",
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
        <p className="text-muted-foreground">Manage account information and password</p>
      </div>

      <div className="max-w-2xl">
        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
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
                <Label htmlFor="newPassword">New Password</Label>
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
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
                {isChangingPassword ? "Saving..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle>Security Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Password must be at least 6 characters</p>
            <p>• Use combination of uppercase, lowercase, and numbers for better security</p>
            <p>• Do not share your login information with others</p>
            <p>• Logout after finishing using the system</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}