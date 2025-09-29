import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Settings as SettingsIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Setting } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();
  
  // Fetch current settings from database
  const { data: settings = [], isLoading, refetch } = useQuery<Setting[]>({
    queryKey: ['/api/settings'],
    staleTime: 0, // Always fetch fresh data
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Settings have been refreshed successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure your clinic calling system</p>
        </div>
        
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading}
          data-testid="button-refresh-settings"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Settings Cards */}
      <div className="grid gap-6">
        
        {/* Media Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Media Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Settings for media files and gallery management will be available here.
            </p>
          </CardContent>
        </Card>

        {/* Theme Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Theme & Color Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Customize colors and visual themes for your display system.
            </p>
          </CardContent>
        </Card>

        {/* Audio Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Audio Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Configure sound and audio settings for patient calling.
            </p>
          </CardContent>
        </Card>

        {/* Display Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Information Display Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Settings for information display and marquee text configuration.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}