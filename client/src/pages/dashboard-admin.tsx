import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Settings, Monitor, Activity, Shield, Database } from "lucide-react";

interface DashboardStats {
  totalWaiting: number;
  totalCalled: number;
  totalCompleted: number;
  activeWindows: number;
  totalWindows: number;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
}

export default function AdminDashboard() {
  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch user statistics
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Calculate user stats
  const userStats: UserStats = {
    totalUsers: users.length,
    activeUsers: users.filter(user => user.isActive).length,
    adminUsers: users.filter(user => user.role === 'admin').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Paparan pentadbiran sistem pengurusan klinik</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Administrator</span>
        </div>
      </div>

      {/* System Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-total-users">
              {userStats.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              {userStats.activeUsers} aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pentadbir</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600" data-testid="text-admin-users">
              {userStats.adminUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              pengguna admin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bilik Sistem</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary" data-testid="text-system-windows">
              {statsLoading ? "..." : (stats?.totalWindows || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {statsLoading ? "..." : (stats?.activeWindows || 0)} aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiviti Hari Ini</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-daily-activity">
              {statsLoading ? "..." : (stats?.totalCompleted || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              pesakit selesai
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Queue Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-admin-waiting">
              {statsLoading ? "..." : (stats?.totalWaiting || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              pesakit dalam barisan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dipanggil</CardTitle>
            <Monitor className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-admin-called">
              {statsLoading ? "..." : (stats?.totalCalled || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              pesakit sedang dipanggil
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <Database className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-admin-completed">
              {statsLoading ? "..." : (stats?.totalCompleted || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              pesakit hari ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Tindakan Cepat Pentadbir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              data-testid="button-user-management"
            >
              <Users className="h-6 w-6" />
              <span>Pengguna</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              data-testid="button-system-settings"
            >
              <Settings className="h-6 w-6" />
              <span>Tetapan</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              data-testid="button-windows-management"
            >
              <Monitor className="h-6 w-6" />
              <span>Bilik</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              data-testid="button-system-monitor"
            >
              <Activity className="h-6 w-6" />
              <span>Monitor</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>Maklumat Sistem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Status Pengguna</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Total Akaun: {userStats.totalUsers}</li>
                <li>• Akaun Aktif: {userStats.activeUsers}</li>
                <li>• Pentadbir: {userStats.adminUsers}</li>
                <li>• Kakitangan: {userStats.totalUsers - userStats.adminUsers}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Status Sistem</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Bilik Dikonfigurasi: {stats?.totalWindows || 0}</li>
                <li>• Bilik Aktif: {stats?.activeWindows || 0}</li>
                <li>• Barisan Menunggu: {stats?.totalWaiting || 0}</li>
                <li>• Status: Berfungsi Normal</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}