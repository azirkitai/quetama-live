import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Monitor, Volume2, Palette, Upload, Save, RefreshCw, CheckCircle, Plus, ChevronLeft, ChevronRight, Eye, Trash2, Edit } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Setting, Media, Theme } from "@shared/schema";

interface SettingsState {
  mediaType: string;
  dashboardMediaType: string; // "own" or "youtube"
  youtubeUrl: string; // YouTube video URL
  theme: string;
  showPrayerTimes: boolean;
  showWeather: boolean;
  marqueeText: string;
  marqueeColor: string;
  enableSound: boolean;
  soundType: string;
  enableTTS: boolean;
  volume: number;
}

// Using Media type from shared schema instead of local interface

export default function Settings() {
  const { toast } = useToast();
  const [unsavedChanges, setUnsavedChanges] = useState<string[]>([]);
  
  // Fetch current settings from database
  const { data: settings = [], isLoading, refetch } = useQuery<Setting[]>({
    queryKey: ['/api/settings'],
    staleTime: 0, // Always fetch fresh data
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
    enableSound: true,
    soundType: "beep",
    enableTTS: false,
    volume: 70
  });

  // Fetch media files from API
  const { data: mediaFiles = [], isLoading: mediaLoading, refetch: refetchMedia } = useQuery<Media[]>({
    queryKey: ['/api/media'],
  });

  // Fetch active theme from API
  const { data: activeTheme, isLoading: themeLoading, refetch: refetchTheme } = useQuery<Theme>({
    queryKey: ['/api/themes/active'],
  });

  // Theme color state
  const [themeColors, setThemeColors] = useState({
    callingColor: "#3b82f6",
    callingGradient: "",
    highlightBoxColor: "#ef4444", 
    highlightBoxGradient: "",
    historyNameColor: "#6b7280",
    historyNameGradient: "",
    clinicNameColor: "#1f2937",
    clinicNameGradient: "",
  });

  // Update state when settings are loaded from database
  useEffect(() => {
    if (settings.length > 0) {
      const newSettings = {
        mediaType: settingsObj.mediaType || "image",
        dashboardMediaType: settingsObj.dashboardMediaType || "own",
        youtubeUrl: settingsObj.youtubeUrl || "",
        theme: settingsObj.theme || "blue",
        showPrayerTimes: settingsObj.showPrayerTimes === "true",
        showWeather: settingsObj.showWeather === "true",
        marqueeText: settingsObj.marqueeText || "Selamat datang ke Klinik Kesihatan",
        marqueeColor: settingsObj.marqueeColor || "#ffffff",
        enableSound: settingsObj.enableSound === "true",
        soundType: settingsObj.soundType || "beep",
        enableTTS: settingsObj.enableTTS === "true",
        volume: parseInt(settingsObj.volume || "70")
      };
      
      setCurrentSettings(newSettings);
      setUnsavedChanges([]); // Clear unsaved changes when loading fresh data
    }
  }, [settings, settingsObj.mediaType, settingsObj.dashboardMediaType, settingsObj.youtubeUrl, settingsObj.theme, settingsObj.showPrayerTimes, settingsObj.showWeather, settingsObj.marqueeText, settingsObj.marqueeColor, settingsObj.enableSound, settingsObj.soundType, settingsObj.enableTTS, settingsObj.volume]);

  // Update theme colors when active theme is loaded
  useEffect(() => {
    if (activeTheme) {
      setThemeColors({
        callingColor: activeTheme.callingColor,
        callingGradient: activeTheme.callingGradient || "",
        highlightBoxColor: activeTheme.highlightBoxColor,
        highlightBoxGradient: activeTheme.highlightBoxGradient || "",
        historyNameColor: activeTheme.historyNameColor,
        historyNameGradient: activeTheme.historyNameGradient || "",
        clinicNameColor: activeTheme.clinicNameColor,
        clinicNameGradient: activeTheme.clinicNameGradient || "",
      });
    }
  }, [activeTheme]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsToSave: Array<{key: string, value: string, category: string}>) => {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: settingsToSave })
      });
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tetapan Berjaya Disimpan",
        description: "Semua perubahan telah disimpan ke pangkalan data",
      });
      setUnsavedChanges([]);
      // Force refresh of settings
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      // Refetch to ensure we get the latest data
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Ralat Menyimpan Tetapan",
        description: "Gagal menyimpan tetapan. Sila cuba lagi.",
        variant: "destructive"
      });
      console.error('Error saving settings:', error);
    }
  });

  // Update theme colors mutation
  const updateThemeMutation = useMutation({
    mutationFn: async (themeData: Partial<Theme>) => {
      if (!activeTheme) {
        throw new Error('No active theme found');
      }
      return await apiRequest("PATCH", `/api/themes/${activeTheme.id}`, themeData);
    },
    onSuccess: () => {
      toast({
        title: "Tema Berjaya Dikemas Kini",
        description: "Warna tema telah disimpan dan digunakan pada sistem",
      });
      // Refresh theme data
      queryClient.invalidateQueries({ queryKey: ['/api/themes/active'] });
      refetchTheme();
    },
    onError: (error) => {
      toast({
        title: "Ralat Mengemas Kini Tema",
        description: "Gagal menyimpan warna tema. Sila cuba lagi.",
        variant: "destructive"
      });
      console.error('Error updating theme:', error);
    }
  });

  const trackChange = (key: string) => {
    if (!unsavedChanges.includes(key)) {
      setUnsavedChanges([...unsavedChanges, key]);
    }
  };

  // Handle theme color changes
  const handleThemeColorChange = (field: keyof typeof themeColors, value: string) => {
    setThemeColors(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save theme colors
  const handleSaveTheme = () => {
    const themeData = {
      callingColor: themeColors.callingColor,
      callingGradient: themeColors.callingGradient || null,
      highlightBoxColor: themeColors.highlightBoxColor,
      highlightBoxGradient: themeColors.highlightBoxGradient || null,
      historyNameColor: themeColors.historyNameColor,
      historyNameGradient: themeColors.historyNameGradient || null,
      clinicNameColor: themeColors.clinicNameColor,
      clinicNameGradient: themeColors.clinicNameGradient || null,
    };
    updateThemeMutation.mutate(themeData);
  };

  const updateDisplaySetting = (key: keyof SettingsState, value: any) => {
    setCurrentSettings(prev => ({ ...prev, [key]: value }));
    trackChange(key);
  };

  const updateSoundSetting = (key: keyof SettingsState, value: any) => {
    setCurrentSettings(prev => ({ ...prev, [key]: value }));
    trackChange(key);
  };

  const handleSaveDisplay = () => {
    const displaySettingsToSave = [
      { key: 'mediaType', value: currentSettings.mediaType, category: 'display' },
      { key: 'dashboardMediaType', value: currentSettings.dashboardMediaType, category: 'display' },
      { key: 'youtubeUrl', value: currentSettings.youtubeUrl, category: 'display' },
      { key: 'theme', value: currentSettings.theme, category: 'display' },
      { key: 'showPrayerTimes', value: currentSettings.showPrayerTimes.toString(), category: 'display' },
      { key: 'showWeather', value: currentSettings.showWeather.toString(), category: 'display' },
      { key: 'marqueeText', value: currentSettings.marqueeText, category: 'display' },
      { key: 'marqueeColor', value: currentSettings.marqueeColor, category: 'display' }
    ];
    saveSettingsMutation.mutate(displaySettingsToSave);
  };

  const handleSaveSound = () => {
    const soundSettingsToSave = [
      { key: 'enableSound', value: currentSettings.enableSound.toString(), category: 'sound' },
      { key: 'soundType', value: currentSettings.soundType, category: 'sound' },
      { key: 'enableTTS', value: currentSettings.enableTTS.toString(), category: 'sound' },
      { key: 'volume', value: currentSettings.volume.toString(), category: 'sound' }
    ];
    saveSettingsMutation.mutate(soundSettingsToSave);
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Tetapan Dimuat Semula",
      description: "Tetapan terkini telah diambil dari pangkalan data"
    });
  };

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const handleFileUpload = (type: "logo" | "background") => {
    toast({
      title: "Muat Naik Fail",
      description: `Fungsi muat naik ${type} akan dilaksanakan tidak lama lagi`,
    });
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is PNG or JPEG
      if (file.type === 'image/png' || file.type === 'image/jpeg') {
        setSelectedFile(file);
        toast({
          title: "Fail Dipilih",
          description: `${file.name} siap untuk dimuat naik`,
        });
      } else {
        toast({
          title: "Format Fail Tidak Sah",
          description: "Sila pilih fail dalam format PNG atau JPEG sahaja",
          variant: "destructive"
        });
      }
    }
  };

  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      formData.append('type', 'image');

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Gambar Berjaya Dimuat Naik",
        description: "Gambar telah disimpan dan ditambah ke galeri media",
      });
      setSelectedFile(null);
      // Clear file input
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      // Refresh media list
      queryClient.invalidateQueries({ queryKey: ['/api/media'] });
      refetchMedia();
    },
    onError: (error) => {
      toast({
        title: "Ralat Muat Naik",
        description: "Gagal memuat naik gambar. Sila cuba lagi.",
        variant: "destructive"
      });
      console.error('Error uploading image:', error);
    }
  });

  // Handle upload button click
  const handleUploadImage = () => {
    if (selectedFile) {
      uploadImageMutation.mutate(selectedFile);
    }
  };

  // Add media mutation
  const addMediaMutation = useMutation({
    mutationFn: async ({ name, type }: { name: string, type: 'image' | 'video' }) => {
      const response = await apiRequest("POST", "/api/media", { name, type });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/media'] });
      toast({
        title: "Media Ditambah",
        description: "Media baru telah ditambah ke koleksi",
      });
    },
    onError: (error) => {
      console.error("Error adding media:", error);
      toast({
        title: "Ralat",
        description: "Gagal menambah media",
        variant: "destructive",
      });
    },
  });

  // Delete media mutation
  const deleteMediaMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/media/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/media'] });
      toast({
        title: "Media Dipadam",
        description: "Media telah dipadam dari koleksi",
      });
    },
    onError: (error) => {
      console.error("Error deleting media:", error);
      toast({
        title: "Ralat",
        description: "Gagal memadam media",
        variant: "destructive",
      });
    },
  });

  // Rename media mutation
  const renameMediaMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string, name: string }) => {
      const response = await apiRequest("PATCH", `/api/media/${id}`, { name });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/media'] });
      toast({
        title: "Media Dinamakan Semula",
        description: "Nama media telah dikemaskini",
      });
      setEditingMediaId(null);
    },
    onError: (error) => {
      console.error("Error renaming media:", error);
      toast({
        title: "Ralat",
        description: "Gagal mengemas kini nama media",
        variant: "destructive",
      });
    },
  });

  const handleAddMedia = () => {
    const mediaCount = mediaFiles.length + 1;
    addMediaMutation.mutate({
      name: `Media Baru ${mediaCount}`,
      type: 'image'
    });
  };

  const handleDeleteMedia = (id: string) => {
    deleteMediaMutation.mutate(id);
  };

  const handleStartRename = (id: string, currentName: string) => {
    setEditingMediaId(id);
    setEditingName(currentName);
  };

  const handleSaveRename = () => {
    if (editingMediaId && editingName.trim()) {
      renameMediaMutation.mutate({
        id: editingMediaId,
        name: editingName.trim()
      });
    }
  };

  const handleCancelRename = () => {
    setEditingMediaId(null);
    setEditingName("");
  };

  // Media carousel state with safe pagination
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  // Rename functionality state
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  
  const totalPages = Math.max(1, Math.ceil(mediaFiles.length / 4));
  
  // Clamp currentMediaIndex to valid range
  useEffect(() => {
    if (currentMediaIndex >= totalPages) {
      setCurrentMediaIndex(Math.max(0, totalPages - 1));
    }
  }, [mediaFiles.length, totalPages, currentMediaIndex]);
  
  const nextMedia = () => {
    setCurrentMediaIndex((prev) => Math.min(prev + 1, totalPages - 1));
  };
  
  const prevMedia = () => {
    setCurrentMediaIndex((prev) => Math.max(prev - 1, 0));
  };

  if (isLoading || mediaLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Memuatkan tetapan...</span>
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
          <p className="text-muted-foreground">Konfigurasi paparan, bunyi dan tetapan sistem</p>
          
          {/* Current Settings Status */}
          <div className="mt-2 flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Tetapan Semasa: {(settings as Setting[]).length} konfigurasi aktif</span>
            </div>
            
            {unsavedChanges.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-orange-600">
                <Save className="h-4 w-4" />
                <span>{unsavedChanges.length} perubahan belum disimpan</span>
              </div>
            )}
          </div>
        </div>
        
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading}
          data-testid="button-refresh-settings"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Muat Semula
        </Button>
      </div>

      <Tabs defaultValue="display" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="display" data-testid="tab-display-settings">
            <Monitor className="h-4 w-4 mr-2" />
            Display
          </TabsTrigger>
          <TabsTrigger value="sound" data-testid="tab-sound-settings">
            <Volume2 className="h-4 w-4 mr-2" />
            Sound
          </TabsTrigger>
        </TabsList>

        {/* Display Settings */}
        <TabsContent value="display" className="space-y-6">
          {/* MEDIA CARD */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Media Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Show in Dashboard Section */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Pilihan Media untuk Dashboard:</Label>
                <div className="flex space-x-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="own-media"
                      name="dashboardMedia"
                      value="own"
                      checked={currentSettings.dashboardMediaType === "own"}
                      onChange={(e) => updateDisplaySetting('dashboardMediaType', e.target.value)}
                      className="w-4 h-4 text-blue-600"
                      data-testid="radio-own-media"
                    />
                    <Label htmlFor="own-media">Upload Gambar (PNG/JPEG)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="youtube-media"
                      name="dashboardMedia"
                      value="youtube"
                      checked={currentSettings.dashboardMediaType === "youtube"}
                      onChange={(e) => updateDisplaySetting('dashboardMediaType', e.target.value)}
                      className="w-4 h-4 text-blue-600"
                      data-testid="radio-youtube-media"
                    />
                    <Label htmlFor="youtube-media">YouTube Video</Label>
                  </div>
                </div>
                
                {/* YouTube URL Input - appears when YouTube is selected */}
                {currentSettings.dashboardMediaType === "youtube" && (
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="youtube-url" className="text-sm font-medium">
                      URL YouTube Video:
                    </Label>
                    <Input
                      id="youtube-url"
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={currentSettings.youtubeUrl}
                      onChange={(e) => updateDisplaySetting('youtubeUrl', e.target.value)}
                      className="w-full"
                      data-testid="input-youtube-url"
                    />
                    <div className="flex space-x-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (currentSettings.youtubeUrl) {
                            // Simple YouTube URL validation
                            const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
                            if (youtubeRegex.test(currentSettings.youtubeUrl)) {
                              toast({
                                title: "URL YouTube Sah",
                                description: "URL YouTube telah disahkan dan boleh digunakan.",
                              });
                            } else {
                              toast({
                                title: "URL Tidak Sah",
                                description: "Sila masukkan URL YouTube yang sah.",
                                variant: "destructive"
                              });
                            }
                          }
                        }}
                        data-testid="button-validate-youtube"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Sahkan URL
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Masukkan URL YouTube video yang akan dipaparkan di paparan TV
                    </p>
                  </div>
                )}
              </div>

              {/* Image Upload Section - Only for Own Media */}
              {currentSettings.dashboardMediaType === "own" && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Upload Gambar (PNG/JPEG):</Label>
                  
                  {/* File Upload Section */}
                  <div className="space-y-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <Label className="text-sm font-medium">Pilih Gambar untuk Dimuat Naik</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Format: PNG atau JPEG sahaja
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
                        Fail dipilih: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Tip: Namakan fail mengikut urutan untuk paparan teratur (contoh: 1.jpg, 2.jpg, 3.jpg)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* THEME CARD */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme & Color Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Theme */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Tema Utama:</Label>
                <Select 
                  value={currentSettings.theme} 
                  onValueChange={(value) => updateDisplaySetting('theme', value)}
                >
                  <SelectTrigger data-testid="select-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Biru (Default)</SelectItem>
                    <SelectItem value="green">Hijau</SelectItem>
                    <SelectItem value="purple">Ungu</SelectItem>
                    <SelectItem value="red">Merah</SelectItem>
                    <SelectItem value="custom">Custom Gradient</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Color Settings */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Kustomisasi Warna Element:</Label>
                
                {/* CALLING Color */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Warna "CALLING":</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="color"
                      value="#3b82f6"
                      className="w-12 h-8 p-1 border rounded"
                      data-testid="color-calling"
                    />
                    <Input
                      type="text"
                      placeholder="#3b82f6 atau gradient"
                      className="flex-1"
                      value={themeColors.callingColor}
                      onChange={(e) => handleThemeColorChange('callingColor', e.target.value)}
                      data-testid="input-calling-color"
                    />
                    <Button variant="outline" size="sm" data-testid="button-gradient-calling">
                      Gradient
                    </Button>
                  </div>
                </div>

                {/* HIGHLIGHT BOX Color */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Warna "HIGHLIGHT BOX":</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="color"
                      value="#ef4444"
                      className="w-12 h-8 p-1 border rounded"
                      data-testid="color-highlight"
                    />
                    <Input
                      type="text"
                      placeholder="#ef4444 atau gradient"
                      className="flex-1"
                      value={themeColors.highlightBoxColor}
                      onChange={(e) => handleThemeColorChange('highlightBoxColor', e.target.value)}
                      data-testid="input-highlight-color"
                    />
                    <Button variant="outline" size="sm" data-testid="button-gradient-highlight">
                      Gradient
                    </Button>
                  </div>
                </div>

                {/* HISTORY NAME Color */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Warna "HISTORY NAME":</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="color"
                      value="#6b7280"
                      className="w-12 h-8 p-1 border rounded"
                      data-testid="color-history"
                    />
                    <Input
                      type="text"
                      placeholder="#6b7280 atau gradient"
                      className="flex-1"
                      value={themeColors.historyNameColor}
                      onChange={(e) => handleThemeColorChange('historyNameColor', e.target.value)}
                      data-testid="input-history-color"
                    />
                    <Button variant="outline" size="sm" data-testid="button-gradient-history">
                      Gradient
                    </Button>
                  </div>
                </div>

                {/* NAMA KLINIK Color */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Warna "NAMA KLINIK":</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="color"
                      value="#1f2937"
                      className="w-12 h-8 p-1 border rounded"
                      data-testid="color-clinic-name"
                    />
                    <Input
                      type="text"
                      placeholder="#1f2937 atau gradient"
                      className="flex-1"
                      value={themeColors.clinicNameColor}
                      onChange={(e) => handleThemeColorChange('clinicNameColor', e.target.value)}
                      data-testid="input-clinic-name-color"
                    />
                    <Button variant="outline" size="sm" data-testid="button-gradient-clinic-name">
                      Gradient
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  Tip: Untuk gradient, masukkan format seperti "linear-gradient(45deg, #ff0000, #00ff00)"<br/>
                  Atau gunakan butang "Gradient" untuk pilihan mudah
                </p>

                {/* Save Theme Button */}
                <div className="pt-6 border-t">
                  <Button 
                    onClick={handleSaveTheme}
                    className="w-full"
                    disabled={updateThemeMutation.isPending}
                    data-testid="button-save-theme"
                  >
                    {updateThemeMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Simpan Tetapan Tema
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media Gallery Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Media Gallery</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevMedia}
                    disabled={currentMediaIndex <= 0}
                    data-testid="button-prev-media"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentMediaIndex + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextMedia}
                    disabled={currentMediaIndex >= totalPages - 1}
                    data-testid="button-next-media"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {mediaFiles.slice(currentMediaIndex * 4, (currentMediaIndex + 1) * 4).map((media, index) => (
                  <div key={media.id} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors">
                      {/* Display actual image if it's an image type */}
                      {media.type === 'image' && media.url ? (
                        <img 
                          src={media.url} 
                          alt={media.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      
                      {/* Fallback placeholder */}
                      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 ${media.type === 'image' && media.url ? 'hidden' : ''}`}>
                        <div className="text-center p-2">
                          <Eye className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                          <p className="text-xs text-gray-600 font-medium truncate">{media.name}</p>
                        </div>
                      </div>
                      
                      {/* Name overlay for actual images */}
                      {media.type === 'image' && media.url && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                          {editingMediaId === media.id ? (
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveRename();
                                } else if (e.key === 'Escape') {
                                  handleCancelRename();
                                }
                              }}
                              onBlur={handleSaveRename}
                              autoFocus
                              className="text-xs h-6 text-center bg-white/90 text-black"
                              data-testid={`input-rename-${media.id}`}
                            />
                          ) : (
                            <p className="text-xs font-medium truncate text-center">{media.name}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartRename(media.id, media.name)}
                        className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
                        data-testid={`button-edit-media-${media.id}`}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteMedia(media.id)}
                        className="h-6 w-6 p-0"
                        data-testid={`button-delete-media-${media.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="bg-black/50 text-white text-xs px-2 py-1 rounded text-center">
                        {index + 1 + currentMediaIndex * 4} / {mediaFiles.length}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Empty slots if less than 4 items */}
                {Array.from({ length: Math.max(0, 4 - mediaFiles.slice(currentMediaIndex * 4, (currentMediaIndex + 1) * 4).length) }).map((_, index) => (
                  <div key={`empty-${index}`} className="aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <Plus className="h-8 w-8 text-gray-400" />
                  </div>
                ))}
              </div>
              
              {mediaFiles.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Tiada media yang dimuat naik</p>
                  <p className="text-sm">Upload gambar untuk melihat galeri media</p>
                </div>
              )}

              {/* Save to Dashboard Button */}
              {mediaFiles.length > 0 && (
                <div className="pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Transfer ke Paparan Iklan</h4>
                      <p className="text-sm text-muted-foreground">
                        Gambar yang dimuat naik akan dipaparkan pada skrin TV
                      </p>
                    </div>
                    <Button 
                      onClick={() => {
                        toast({
                          title: "Gambar Berjaya Dipindah",
                          description: `${mediaFiles.length} gambar telah dipindah ke paparan iklan`,
                        });
                      }}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="button-save-to-dashboard"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Simpan ke Paparan ({mediaFiles.length})
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Information Display</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Toggle Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Waktu Solat</Label>
                    <div className="text-sm text-muted-foreground">
                      Papar waktu solat pada skrin TV
                    </div>
                  </div>
                  <Switch
                    checked={currentSettings.showPrayerTimes}
                    onCheckedChange={(checked) => updateDisplaySetting('showPrayerTimes', checked)}
                    data-testid="switch-prayer-times"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cuaca</Label>
                    <div className="text-sm text-muted-foreground">
                      Papar maklumat cuaca semasa
                    </div>
                  </div>
                  <Switch
                    checked={currentSettings.showWeather}
                    onCheckedChange={(checked) => updateDisplaySetting('showWeather', checked)}
                    data-testid="switch-weather"
                  />
                </div>
              </div>

              {/* Marquee Settings */}
              <div className="space-y-4">
                <Label>Marquee Text</Label>
                <Textarea
                  value={currentSettings.marqueeText}
                  onChange={(e) => updateDisplaySetting('marqueeText', e.target.value)}
                  placeholder="Masukkan teks yang akan bergerak di bahagian bawah skrin"
                  data-testid="textarea-marquee-text"
                />
                <div className="space-y-2">
                  <Label>Warna Marquee</Label>
                  <Input
                    type="color"
                    value={currentSettings.marqueeColor}
                    onChange={(e) => updateDisplaySetting('marqueeColor', e.target.value)}
                    data-testid="input-marquee-color"
                  />
                </div>
              </div>

              <Button 
                onClick={handleSaveDisplay} 
                className="w-full" 
                data-testid="button-save-display"
                disabled={saveSettingsMutation.isPending}
              >
                {saveSettingsMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Simpan Tetapan Display
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sound Settings */}
        <TabsContent value="sound" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Volume2 className="h-5 w-5 mr-2" />
                Audio Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable Sound */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Sound</Label>
                  <div className="text-sm text-muted-foreground">
                    Aktifkan bunyi untuk panggilan
                  </div>
                </div>
                <Switch
                  checked={currentSettings.enableSound}
                  onCheckedChange={(checked) => updateSoundSetting('enableSound', checked)}
                  data-testid="switch-enable-sound"
                />
              </div>

              {currentSettings.enableSound && (
                <>
                  {/* Sound Type */}
                  <div className="space-y-2">
                    <Label>Jenis Bunyi</Label>
                    <Select 
                      value={currentSettings.soundType} 
                      onValueChange={(value) => updateSoundSetting('soundType', value)}
                    >
                      <SelectTrigger data-testid="select-sound-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beep">Beep</SelectItem>
                        <SelectItem value="chime">Chime</SelectItem>
                        <SelectItem value="bell">Bell</SelectItem>
                        <SelectItem value="custom">Custom Audio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Volume */}
                  <div className="space-y-2">
                    <Label>Volume ({currentSettings.volume}%)</Label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentSettings.volume}
                      onChange={(e) => updateSoundSetting('volume', parseInt(e.target.value))}
                      onInput={(e) => updateSoundSetting('volume', parseInt((e.target as HTMLInputElement).value))}
                      className="w-full"
                      data-testid="slider-volume"
                    />
                  </div>

                  {/* Text-to-Speech */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Text-to-Speech</Label>
                      <div className="text-sm text-muted-foreground">
                        Sebut nama/nombor pesakit
                      </div>
                    </div>
                    <Switch
                      checked={currentSettings.enableTTS}
                      onCheckedChange={(checked) => updateSoundSetting('enableTTS', checked)}
                      data-testid="switch-enable-tts"
                    />
                  </div>

                  {/* Custom Audio Upload */}
                  {currentSettings.soundType === "custom" && (
                    <div className="space-y-2">
                      <Label>Custom Audio File</Label>
                      <Button
                        variant="outline"
                        onClick={() => console.log("Upload custom audio")}
                        className="w-full"
                        data-testid="button-upload-audio"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Audio File
                      </Button>
                    </div>
                  )}
                </>
              )}

              <Button 
                onClick={handleSaveSound} 
                className="w-full" 
                data-testid="button-save-sound"
                disabled={saveSettingsMutation.isPending}
              >
                {saveSettingsMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Simpan Tetapan Bunyi
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}