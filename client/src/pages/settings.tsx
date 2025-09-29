import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Monitor, Volume2, Palette, Upload, Save, RefreshCw, CheckCircle, Plus, ChevronLeft, ChevronRight, Eye, Trash2, Edit, Star, Upload as UploadIcon, Building, User, Calendar, Users, MessageSquare, Settings2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Setting, Media, Theme } from "@shared/schema";
import { audioSystem } from "@/lib/audio-system";
import { GradientPicker } from "@/components/ui/gradient-picker";

import type { PresetSoundKeyType } from "@shared/schema";

interface SettingsState {
  mediaType: string;
  dashboardMediaType: string; // "own" or "youtube"
  youtubeUrl: string; // YouTube video URL
  theme: string;
  showPrayerTimes: boolean;
  showWeather: boolean;
  marqueeText: string;
  marqueeColor: string;
  marqueeBackgroundColor: string;
  enableSound: boolean;
  volume: number;
  soundMode: 'preset';
  presetKey: PresetSoundKeyType;
}

export default function Settings() {
  const { toast } = useToast();
  const [unsavedChanges, setUnsavedChanges] = useState<string[]>([]);
  
  // Fetch current settings from database
  const { data: settings = [], isLoading, refetch } = useQuery<Setting[]>({
    queryKey: ['/api/settings'],
    staleTime: 0,
  });

  // Convert settings array to object for easier access
  const settingsObj = settings.reduce((acc: Record<string, string>, setting: Setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});

  // Current settings state
  const [currentSettings, setCurrentSettings] = useState<SettingsState>({
    mediaType: "image",
    dashboardMediaType: "own",
    youtubeUrl: "",
    theme: "blue",
    showPrayerTimes: true,
    showWeather: false,
    marqueeText: "Selamat datang ke Klinik Kesihatan",
    marqueeColor: "#ffffff",
    marqueeBackgroundColor: "#1e40af",
    enableSound: true,
    volume: 70,
    soundMode: 'preset',
    presetKey: 'airport_call'
  });

  // Fetch themes from API
  const { data: themes = [], isLoading: themesLoading } = useQuery<Theme[]>({
    queryKey: ['/api/themes'],
    staleTime: 5 * 60 * 1000,
  });

  // Get active theme
  const { data: activeTheme } = useQuery<Theme>({
    queryKey: ['/api/themes/active'],
    staleTime: 0,
  });

  // Fetch media files from API
  const { data: mediaFiles = [], isLoading: mediaLoading, refetch: refetchMedia } = useQuery<Media[]>({
    queryKey: ['/api/media'],
    staleTime: 5 * 60 * 1000,
  });

  // Gradient picker states
  const [gradientPickerOpen, setGradientPickerOpen] = useState(false);
  const [gradientPickerTarget, setGradientPickerTarget] = useState<string>("");
  const [gradientPickerTitle, setGradientPickerTitle] = useState("");
  const [gradientPickerCurrentValue, setGradientPickerCurrentValue] = useState("");

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: async ({ themeId, updates }: { themeId: string; updates: Partial<Theme> }) => {
      return await fetch(`/api/themes/${themeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/themes/active'] });
      toast({
        title: "Theme Updated",
        description: "Theme settings have been saved successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating theme:', error);
      toast({
        title: "Error",
        description: "Failed to update theme settings.",
        variant: "destructive",
      });
    }
  });

  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetchMedia();
      setSelectedFile(null);
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      toast({
        title: "Upload Successful",
        description: "Image has been uploaded successfully.",
      });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Initialize settings from database when data loads
  useEffect(() => {
    if (settings.length > 0) {
      setCurrentSettings(prev => ({
        ...prev,
        mediaType: settingsObj.mediaType || prev.mediaType,
        dashboardMediaType: settingsObj.dashboardMediaType || prev.dashboardMediaType,
        youtubeUrl: settingsObj.youtubeUrl || prev.youtubeUrl,
        theme: settingsObj.theme || prev.theme,
        showPrayerTimes: settingsObj.showPrayerTimes === 'true',
        showWeather: settingsObj.showWeather === 'true',
        marqueeText: settingsObj.marqueeText || prev.marqueeText,
        marqueeColor: settingsObj.marqueeColor || prev.marqueeColor,
        marqueeBackgroundColor: settingsObj.marqueeBackgroundColor || prev.marqueeBackgroundColor,
        enableSound: settingsObj.enableSound !== 'false',
        volume: parseInt(settingsObj.volume) || prev.volume,
        presetKey: (settingsObj.presetKey as PresetSoundKeyType) || prev.presetKey,
      }));
    }
  }, [settings, settingsObj]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle image upload
  const handleUploadImage = () => {
    if (selectedFile) {
      uploadImageMutation.mutate(selectedFile);
    }
  };

  // Open gradient picker
  const openGradientPicker = (target: string, title: string, currentValue: string = "") => {
    console.log("Opening gradient picker for:", target);
    setGradientPickerTarget(target);
    setGradientPickerTitle(title);
    setGradientPickerCurrentValue(currentValue);
    setGradientPickerOpen(true);
  };

  // Handle gradient picker apply
  const handleGradientApply = (gradient: string) => {
    if (!activeTheme) return;
    
    const updates: Partial<Theme> = {
      [gradientPickerTarget]: gradient
    };
    
    updateThemeMutation.mutate({
      themeId: activeTheme.id,
      updates
    });
  };

  if (isLoading || themesLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Settings</h1>
          <p className="text-muted-foreground">Customize your clinic display system</p>
        </div>
      </div>

      <Tabs defaultValue="header" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="header" className="flex items-center gap-2" data-testid="tab-header">
            <Building className="h-4 w-4" />
            Header
          </TabsTrigger>
          <TabsTrigger value="patient" className="flex items-center gap-2" data-testid="tab-patient">
            <User className="h-4 w-4" />
            Patient Display
          </TabsTrigger>
          <TabsTrigger value="datetime" className="flex items-center gap-2" data-testid="tab-datetime">
            <Calendar className="h-4 w-4" />
            Date & Prayer
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-2" data-testid="tab-queue">
            <Users className="h-4 w-4" />
            Queue
          </TabsTrigger>
          <TabsTrigger value="modal" className="flex items-center gap-2" data-testid="tab-modal">
            <Monitor className="h-4 w-4" />
            Highlight Modal
          </TabsTrigger>
          <TabsTrigger value="marquee" className="flex items-center gap-2" data-testid="tab-marquee">
            <MessageSquare className="h-4 w-4" />
            Marquee
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2" data-testid="tab-general">
            <Settings2 className="h-4 w-4" />
            General
          </TabsTrigger>
        </TabsList>

        {/* Header Section Settings */}
        <TabsContent value="header">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Header Section - Clinic Name & Calling Title
              </CardTitle>
              <p className="text-muted-foreground">Customize the clinic name area and calling title display</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Clinic Name Styling */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Clinic Name Styling</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Clinic Name Color/Gradient</Label>
                    <Button
                      variant="outline"
                      onClick={() => openGradientPicker('clinicNameGradient', 'Clinic Name Gradient', activeTheme?.clinicNameGradient || '')}
                      className="w-full justify-start"
                      data-testid="button-clinic-name-gradient"
                    >
                      <div 
                        className="w-6 h-6 rounded mr-2 border"
                        style={{ 
                          background: activeTheme?.clinicNameGradient || activeTheme?.clinicNameColor || '#facc15'
                        }}
                      />
                      Set Gradient/Color
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Clinic Name Solid Color (Fallback)</Label>
                    <Input
                      type="color"
                      value={activeTheme?.clinicNameColor || '#facc15'}
                      onChange={(e) => {
                        if (activeTheme) {
                          updateThemeMutation.mutate({
                            themeId: activeTheme.id,
                            updates: { clinicNameColor: e.target.value }
                          });
                        }
                      }}
                      className="w-full h-10"
                      data-testid="input-clinic-name-color"
                    />
                  </div>
                </div>
              </div>

              {/* Calling Title Styling */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Calling Title Styling</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Calling Title Background</Label>
                    <Button
                      variant="outline"
                      onClick={() => openGradientPicker('callingGradient', 'Calling Title Gradient', activeTheme?.callingGradient || '')}
                      className="w-full justify-start"
                      data-testid="button-calling-gradient"
                    >
                      <div 
                        className="w-6 h-6 rounded mr-2 border"
                        style={{ 
                          background: activeTheme?.callingGradient || activeTheme?.callingColor || '#1e40af'
                        }}
                      />
                      Set Gradient/Color
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Calling Background Solid Color</Label>
                    <Input
                      type="color"
                      value={activeTheme?.callingColor || '#1e40af'}
                      onChange={(e) => {
                        if (activeTheme) {
                          updateThemeMutation.mutate({
                            themeId: activeTheme.id,
                            updates: { callingColor: e.target.value }
                          });
                        }
                      }}
                      className="w-full h-10"
                      data-testid="input-calling-color"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patient Display Settings */}
        <TabsContent value="patient">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Current Patient Display
              </CardTitle>
              <p className="text-muted-foreground">Customize the current patient being called display area</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Patient Display Background</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Patient Display Gradient</Label>
                    <Button
                      variant="outline"
                      onClick={() => openGradientPicker('callingGradient', 'Patient Display Gradient', activeTheme?.callingGradient || '')}
                      className="w-full justify-start"
                      data-testid="button-patient-gradient"
                    >
                      <div 
                        className="w-6 h-6 rounded mr-2 border"
                        style={{ 
                          background: activeTheme?.callingGradient || activeTheme?.callingColor || '#2563eb'
                        }}
                      />
                      Set Gradient/Color
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Patient Display Solid Color</Label>
                    <Input
                      type="color"
                      value={activeTheme?.callingColor || '#2563eb'}
                      onChange={(e) => {
                        if (activeTheme) {
                          updateThemeMutation.mutate({
                            themeId: activeTheme.id,
                            updates: { callingColor: e.target.value }
                          });
                        }
                      }}
                      className="w-full h-10"
                      data-testid="input-patient-color"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Highlight Box Styling</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Highlight Box Gradient</Label>
                    <Button
                      variant="outline"
                      onClick={() => openGradientPicker('highlightBoxGradient', 'Highlight Box Gradient', activeTheme?.highlightBoxGradient || '')}
                      className="w-full justify-start"
                      data-testid="button-highlight-gradient"
                    >
                      <div 
                        className="w-6 h-6 rounded mr-2 border"
                        style={{ 
                          background: activeTheme?.highlightBoxGradient || activeTheme?.highlightBoxColor || '#2563eb'
                        }}
                      />
                      Set Gradient/Color
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Highlight Box Solid Color</Label>
                    <Input
                      type="color"
                      value={activeTheme?.highlightBoxColor || '#2563eb'}
                      onChange={(e) => {
                        if (activeTheme) {
                          updateThemeMutation.mutate({
                            themeId: activeTheme.id,
                            updates: { highlightBoxColor: e.target.value }
                          });
                        }
                      }}
                      className="w-full h-10"
                      data-testid="input-highlight-color"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Date & Prayer Times Settings */}
        <TabsContent value="datetime">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date & Prayer Times Panel
              </CardTitle>
              <p className="text-muted-foreground">Customize the left panel with date, time, and prayer information</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Date & Prayer Panel Background</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Panel Background Gradient</Label>
                    <Button
                      variant="outline"
                      onClick={() => openGradientPicker('historyNameGradient', 'Date Panel Gradient', activeTheme?.historyNameGradient || '')}
                      className="w-full justify-start"
                      data-testid="button-datetime-gradient"
                    >
                      <div 
                        className="w-6 h-6 rounded mr-2 border"
                        style={{ 
                          background: activeTheme?.historyNameGradient || activeTheme?.historyNameColor || '#1e40af'
                        }}
                      />
                      Set Gradient/Color
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Panel Background Solid Color</Label>
                    <Input
                      type="color"
                      value={activeTheme?.historyNameColor || '#1e40af'}
                      onChange={(e) => {
                        if (activeTheme) {
                          updateThemeMutation.mutate({
                            themeId: activeTheme.id,
                            updates: { historyNameColor: e.target.value }
                          });
                        }
                      }}
                      className="w-full h-10"
                      data-testid="input-datetime-color"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Display Options</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-prayer-times"
                      checked={currentSettings.showPrayerTimes}
                      onCheckedChange={(checked) => {
                        setCurrentSettings(prev => ({ ...prev, showPrayerTimes: checked }));
                        // Save to database
                      }}
                      data-testid="switch-prayer-times"
                    />
                    <Label htmlFor="show-prayer-times">Show Prayer Times</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-weather"
                      checked={currentSettings.showWeather}
                      onCheckedChange={(checked) => {
                        setCurrentSettings(prev => ({ ...prev, showWeather: checked }));
                        // Save to database
                      }}
                      data-testid="switch-weather"
                    />
                    <Label htmlFor="show-weather">Show Weather</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queue Settings */}
        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Patient Queue Panel
              </CardTitle>
              <p className="text-muted-foreground">Customize the right panel showing patient queue history</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Queue Panel Background</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Queue Panel Gradient</Label>
                    <Button
                      variant="outline"
                      onClick={() => openGradientPicker('historyNameGradient', 'Queue Panel Gradient', activeTheme?.historyNameGradient || '')}
                      className="w-full justify-start"
                      data-testid="button-queue-gradient"
                    >
                      <div 
                        className="w-6 h-6 rounded mr-2 border"
                        style={{ 
                          background: activeTheme?.historyNameGradient || activeTheme?.historyNameColor || '#1d4ed8'
                        }}
                      />
                      Set Gradient/Color
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Queue Panel Solid Color</Label>
                    <Input
                      type="color"
                      value={activeTheme?.historyNameColor || '#1d4ed8'}
                      onChange={(e) => {
                        if (activeTheme) {
                          updateThemeMutation.mutate({
                            themeId: activeTheme.id,
                            updates: { historyNameColor: e.target.value }
                          });
                        }
                      }}
                      className="w-full h-10"
                      data-testid="input-queue-color"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Patient Name Styling in Queue</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Patient Name Gradient</Label>
                    <Button
                      variant="outline"
                      onClick={() => openGradientPicker('historyNameGradient', 'Patient Name Gradient', activeTheme?.historyNameGradient || '')}
                      className="w-full justify-start"
                      data-testid="button-queue-name-gradient"
                    >
                      <div 
                        className="w-6 h-6 rounded mr-2 border"
                        style={{ 
                          background: activeTheme?.historyNameGradient || activeTheme?.historyNameColor || '#facc15'
                        }}
                      />
                      Set Gradient/Color
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Patient Name Solid Color</Label>
                    <Input
                      type="color"
                      value={activeTheme?.historyNameColor || '#facc15'}
                      onChange={(e) => {
                        if (activeTheme) {
                          updateThemeMutation.mutate({
                            themeId: activeTheme.id,
                            updates: { historyNameColor: e.target.value }
                          });
                        }
                      }}
                      className="w-full h-10"
                      data-testid="input-queue-name-color"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Highlight Modal Settings */}
        <TabsContent value="modal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Highlight Modal Overlay
              </CardTitle>
              <p className="text-muted-foreground">Customize the modal that appears when highlighting a patient call</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Modal Background & Border</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Modal Background Color</Label>
                    <Input
                      type="color"
                      value={activeTheme?.modalBackgroundColor || '#1e293b'}
                      onChange={(e) => {
                        if (activeTheme) {
                          updateThemeMutation.mutate({
                            themeId: activeTheme.id,
                            updates: { modalBackgroundColor: e.target.value }
                          });
                        }
                      }}
                      className="w-full h-10"
                      data-testid="input-modal-bg-color"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Modal Border/Lines Color</Label>
                    <Input
                      type="color"
                      value={activeTheme?.modalBorderColor || '#fbbf24'}
                      onChange={(e) => {
                        if (activeTheme) {
                          updateThemeMutation.mutate({
                            themeId: activeTheme.id,
                            updates: { modalBorderColor: e.target.value }
                          });
                        }
                      }}
                      className="w-full h-10"
                      data-testid="input-modal-border-color"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Modal Text</h3>
                <div className="space-y-2">
                  <Label>Modal Text Color</Label>
                  <Input
                    type="color"
                    value={activeTheme?.modalTextColor || '#ffffff'}
                    onChange={(e) => {
                      if (activeTheme) {
                        updateThemeMutation.mutate({
                          themeId: activeTheme.id,
                          updates: { modalTextColor: e.target.value }
                        });
                      }
                    }}
                    className="w-full h-10"
                    data-testid="input-modal-text-color"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marquee Settings */}
        <TabsContent value="marquee">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Marquee Text Banner
              </CardTitle>
              <p className="text-muted-foreground">Customize the scrolling text banner at the bottom of the display</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Marquee Text Content</h3>
                <div className="space-y-2">
                  <Label>Marquee Text</Label>
                  <Textarea
                    value={currentSettings.marqueeText}
                    onChange={(e) => setCurrentSettings(prev => ({ ...prev, marqueeText: e.target.value }))}
                    placeholder="Enter scrolling text message..."
                    className="min-h-[80px]"
                    data-testid="textarea-marquee-text"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Marquee Styling</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <Input
                      type="color"
                      value={currentSettings.marqueeColor}
                      onChange={(e) => setCurrentSettings(prev => ({ ...prev, marqueeColor: e.target.value }))}
                      className="w-full h-10"
                      data-testid="input-marquee-text-color"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <Input
                      type="color"
                      value={currentSettings.marqueeBackgroundColor}
                      onChange={(e) => setCurrentSettings(prev => ({ ...prev, marqueeBackgroundColor: e.target.value }))}
                      className="w-full h-10"
                      data-testid="input-marquee-bg-color"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general">
          <div className="space-y-6">
            {/* Audio Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Audio Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable-sound"
                    checked={currentSettings.enableSound}
                    onCheckedChange={(checked) => setCurrentSettings(prev => ({ ...prev, enableSound: checked }))}
                    data-testid="switch-enable-sound"
                  />
                  <Label htmlFor="enable-sound">Enable Sound</Label>
                </div>
                
                {currentSettings.enableSound && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Volume: {currentSettings.volume}%</Label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={currentSettings.volume}
                        onChange={(e) => setCurrentSettings(prev => ({ ...prev, volume: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        data-testid="slider-volume"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Sound Type</Label>
                      <Select
                        value={currentSettings.presetKey}
                        onValueChange={(value: PresetSoundKeyType) => setCurrentSettings(prev => ({ ...prev, presetKey: value }))}
                      >
                        <SelectTrigger data-testid="select-sound-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="airport_call">Airport Call</SelectItem>
                          <SelectItem value="hospital_call">Hospital Call</SelectItem>
                          <SelectItem value="office_call">Office Call</SelectItem>
                          <SelectItem value="gentle_bell">Gentle Bell</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Media Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Background Media
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <Label className="text-sm font-medium">Upload Background Images</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: PNG or JPEG only
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Input
                      id="image-upload"
                      type="file"
                      accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                      onChange={handleFileSelect}
                      className="flex-1"
                      data-testid="input-image-upload"
                    />
                    <Button
                      onClick={handleUploadImage}
                      disabled={!selectedFile || uploadImageMutation.isPending}
                      variant="default"
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid="button-upload-image"
                    >
                      {uploadImageMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Upload
                    </Button>
                  </div>
                  
                  {selectedFile && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                      File selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Gradient Picker Component */}
      <GradientPicker
        isOpen={gradientPickerOpen}
        onClose={() => setGradientPickerOpen(false)}
        onApply={handleGradientApply}
        title={gradientPickerTitle}
        currentValue={gradientPickerCurrentValue}
      />
    </div>
  );
}