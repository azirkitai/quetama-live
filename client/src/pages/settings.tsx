import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Monitor, Volume2, Palette, Upload, Save, RefreshCw, CheckCircle, Plus, ChevronLeft, ChevronRight, Eye, Trash2, Edit, Star, Upload as UploadIcon, Brush } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GradientPicker } from "@/components/ui/gradient-picker";
import type { Setting, Media, Theme } from "@shared/schema";
import { audioSystem } from "@/lib/audio-system";

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
  // Simplified audio system - preset only
  soundMode: 'preset';
  presetKey: PresetSoundKeyType;
  // Individual section colors
  headerTextColor: string;
  headerBackgroundColor: string;
  headerBackgroundMode: 'solid' | 'gradient';
  headerBackgroundGradient: string;
  callNameTextColor: string;
  callBackgroundColor: string;
  callBackgroundMode: 'solid' | 'gradient';
  callBackgroundGradient: string;
  windowTextColor: string;
  callBorderColor: string;
  prayerTimesTextColor: string;
  prayerTimesBackgroundColor: string;
  prayerTimesBackgroundMode: 'solid' | 'gradient';
  prayerTimesBackgroundGradient: string;
  weatherTextColor: string;
  weatherBackgroundColor: string;
  weatherBackgroundMode: 'solid' | 'gradient';
  weatherBackgroundGradient: string;
  queueTextColor: string;
  queueBackgroundColor: string;
  queueBackgroundMode: 'solid' | 'gradient';
  queueBackgroundGradient: string;
  queueHighlightColor: string;
  queueBorderColor: string;
  marqueeBackgroundMode: 'solid' | 'gradient';
  marqueeBackgroundGradient: string;
}

export default function Settings() {
  const { toast } = useToast();
  const [unsavedChanges, setUnsavedChanges] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Gradient picker states
  const [gradientPickers, setGradientPickers] = useState<{
    header: boolean;
    call: boolean;
    prayer: boolean;
    weather: boolean;
    queue: boolean;
    marquee: boolean;
  }>({
    header: false,
    call: false,
    prayer: false,
    weather: false,
    queue: false,
    marquee: false
  });
  
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
    mediaType: 'image',
    dashboardMediaType: 'own',
    youtubeUrl: '',
    theme: 'blue',
    showPrayerTimes: false,
    showWeather: false,
    marqueeText: '',
    marqueeColor: '#ffffff',
    marqueeBackgroundColor: '#000000',
    enableSound: false,
    volume: 50,
    soundMode: 'preset',
    presetKey: 'notification_sound',
    // Individual section colors with defaults
    headerTextColor: '#ffffff',
    headerBackgroundColor: '#1e40af',
    headerBackgroundMode: 'solid' as 'solid' | 'gradient',
    headerBackgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    callNameTextColor: '#ffffff',
    callBackgroundColor: '#16a34a',
    callBackgroundMode: 'solid' as 'solid' | 'gradient',
    callBackgroundGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    windowTextColor: '#ffffff',
    callBorderColor: '#22c55e',
    prayerTimesTextColor: '#ffffff',
    prayerTimesBackgroundColor: '#7c3aed',
    prayerTimesBackgroundMode: 'solid' as 'solid' | 'gradient',
    prayerTimesBackgroundGradient: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
    weatherTextColor: '#ffffff',
    weatherBackgroundColor: '#f97316',
    weatherBackgroundMode: 'solid' as 'solid' | 'gradient',
    weatherBackgroundGradient: 'linear-gradient(135deg, #fdcb6e 0%, #e84393 100%)',
    queueTextColor: '#1f2937',
    queueBackgroundColor: '#f3f4f6',
    queueBackgroundMode: 'solid' as 'solid' | 'gradient',
    queueBackgroundGradient: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
    queueHighlightColor: '#ef4444',
    queueBorderColor: '#d1d5db',
    marqueeBackgroundMode: 'solid' as 'solid' | 'gradient',
    marqueeBackgroundGradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  });

  // Update settings state when data is loaded
  useEffect(() => {
    if (settings.length > 0) {
      const newSettings = {
        mediaType: settingsObj.mediaType || 'image',
        dashboardMediaType: settingsObj.dashboardMediaType || 'own',
        youtubeUrl: settingsObj.youtubeUrl || '',
        theme: settingsObj.theme || 'blue',
        showPrayerTimes: settingsObj.showPrayerTimes === 'true',
        showWeather: settingsObj.showWeather === 'true',
        marqueeText: settingsObj.marqueeText || '',
        marqueeColor: settingsObj.marqueeColor || '#ffffff',
        marqueeBackgroundColor: settingsObj.marqueeBackgroundColor || '#000000',
        enableSound: settingsObj.enableSound === 'true',
        volume: parseInt(settingsObj.volume || '50'),
        soundMode: 'preset' as const,
        presetKey: (settingsObj.presetKey as PresetSoundKeyType) || 'notification_sound',
        // Individual section colors with defaults
        headerTextColor: settingsObj.headerTextColor || '#ffffff',
        headerBackgroundColor: settingsObj.headerBackgroundColor || '#1e40af',
        headerBackgroundMode: (settingsObj.headerBackgroundMode as 'solid' | 'gradient') || 'solid',
        headerBackgroundGradient: settingsObj.headerBackgroundGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        callNameTextColor: settingsObj.callNameTextColor || '#ffffff',
        callBackgroundColor: settingsObj.callBackgroundColor || '#16a34a',
        callBackgroundMode: (settingsObj.callBackgroundMode as 'solid' | 'gradient') || 'solid',
        callBackgroundGradient: settingsObj.callBackgroundGradient || 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        windowTextColor: settingsObj.windowTextColor || '#ffffff',
        callBorderColor: settingsObj.callBorderColor || '#22c55e',
        prayerTimesTextColor: settingsObj.prayerTimesTextColor || '#ffffff',
        prayerTimesBackgroundColor: settingsObj.prayerTimesBackgroundColor || '#7c3aed',
        prayerTimesBackgroundMode: (settingsObj.prayerTimesBackgroundMode as 'solid' | 'gradient') || 'solid',
        prayerTimesBackgroundGradient: settingsObj.prayerTimesBackgroundGradient || 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
        weatherTextColor: settingsObj.weatherTextColor || '#ffffff',
        weatherBackgroundColor: settingsObj.weatherBackgroundColor || '#f97316',
        weatherBackgroundMode: (settingsObj.weatherBackgroundMode as 'solid' | 'gradient') || 'solid',
        weatherBackgroundGradient: settingsObj.weatherBackgroundGradient || 'linear-gradient(135deg, #fdcb6e 0%, #e84393 100%)',
        queueTextColor: settingsObj.queueTextColor || '#1f2937',
        queueBackgroundColor: settingsObj.queueBackgroundColor || '#f3f4f6',
        queueBackgroundMode: (settingsObj.queueBackgroundMode as 'solid' | 'gradient') || 'solid',
        queueBackgroundGradient: settingsObj.queueBackgroundGradient || 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
        queueHighlightColor: settingsObj.queueHighlightColor || '#ef4444',
        queueBorderColor: settingsObj.queueBorderColor || '#d1d5db',
        marqueeBackgroundMode: (settingsObj.marqueeBackgroundMode as 'solid' | 'gradient') || 'solid',
        marqueeBackgroundGradient: settingsObj.marqueeBackgroundGradient || 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      };
      
      setCurrentSettings(prev => {
        // Only update if there are actual changes to prevent infinite loops
        const hasChanges = Object.keys(newSettings).some(key => 
          prev[key as keyof SettingsState] !== newSettings[key as keyof typeof newSettings]
        );
        return hasChanges ? { ...prev, ...newSettings } : prev;
      });
    }
  }, [settings.length, settingsObj.mediaType, settingsObj.dashboardMediaType, settingsObj.youtubeUrl, settingsObj.theme, settingsObj.showPrayerTimes, settingsObj.showWeather, settingsObj.marqueeText, settingsObj.marqueeColor, settingsObj.marqueeBackgroundColor, settingsObj.enableSound, settingsObj.volume, settingsObj.presetKey, settingsObj.headerTextColor, settingsObj.headerBackgroundColor, settingsObj.headerBackgroundMode, settingsObj.headerBackgroundGradient, settingsObj.callNameTextColor, settingsObj.callBackgroundColor, settingsObj.callBackgroundMode, settingsObj.callBackgroundGradient, settingsObj.windowTextColor, settingsObj.callBorderColor, settingsObj.prayerTimesTextColor, settingsObj.prayerTimesBackgroundColor, settingsObj.prayerTimesBackgroundMode, settingsObj.prayerTimesBackgroundGradient, settingsObj.weatherTextColor, settingsObj.weatherBackgroundColor, settingsObj.weatherBackgroundMode, settingsObj.weatherBackgroundGradient, settingsObj.queueTextColor, settingsObj.queueBackgroundColor, settingsObj.queueBackgroundMode, settingsObj.queueBackgroundGradient, settingsObj.queueHighlightColor, settingsObj.queueBorderColor, settingsObj.marqueeBackgroundMode, settingsObj.marqueeBackgroundGradient]);

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Muat Semula",
      description: "Tetapan telah dimuat semula dengan berjaya",
    });
  };

  const updateDisplaySetting = (key: string, value: any) => {
    setCurrentSettings(prev => ({ ...prev, [key]: value }));
    if (!unsavedChanges.includes('display')) {
      setUnsavedChanges(prev => [...prev, 'display']);
    }
  };

  const updateSoundSetting = (key: string, value: any) => {
    setCurrentSettings(prev => ({ ...prev, [key]: value }));
    if (!unsavedChanges.includes('sound')) {
      setUnsavedChanges(prev => [...prev, 'sound']);
    }
  };

  // Upload media mutation
  const uploadMediaMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      formData.append('type', 'image');
      
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Upload gagal');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/media'] });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast({
        title: "Berjaya",
        description: "Gambar telah diupload dengan berjaya",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal upload gambar",
        variant: "destructive",
      });
    }
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: Array<{key: string, value: string, category: string}>) => {
      return apiRequest('PUT', '/api/settings', { settings });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Berjaya",
        description: "Tetapan telah disimpan dengan berjaya",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal menyimpan tetapan",
        variant: "destructive",
      });
    }
  });

  const handleSaveDisplay = async () => {
    const settingsToSave = [
      { key: 'theme', value: currentSettings.theme, category: 'display' },
      { key: 'showPrayerTimes', value: currentSettings.showPrayerTimes.toString(), category: 'display' },
      { key: 'showWeather', value: currentSettings.showWeather.toString(), category: 'display' },
      { key: 'marqueeText', value: currentSettings.marqueeText, category: 'display' },
      { key: 'marqueeColor', value: currentSettings.marqueeColor, category: 'display' },
      { key: 'marqueeBackgroundColor', value: currentSettings.marqueeBackgroundColor, category: 'display' },
      { key: 'dashboardMediaType', value: currentSettings.dashboardMediaType, category: 'display' },
      { key: 'youtubeUrl', value: currentSettings.youtubeUrl, category: 'display' },
      // Individual section colors with gradient support
      { key: 'headerTextColor', value: currentSettings.headerTextColor, category: 'display' },
      { key: 'headerBackgroundColor', value: currentSettings.headerBackgroundColor, category: 'display' },
      { key: 'headerBackgroundMode', value: currentSettings.headerBackgroundMode, category: 'display' },
      { key: 'headerBackgroundGradient', value: currentSettings.headerBackgroundGradient, category: 'display' },
      { key: 'callNameTextColor', value: currentSettings.callNameTextColor, category: 'display' },
      { key: 'callBackgroundColor', value: currentSettings.callBackgroundColor, category: 'display' },
      { key: 'callBackgroundMode', value: currentSettings.callBackgroundMode, category: 'display' },
      { key: 'callBackgroundGradient', value: currentSettings.callBackgroundGradient, category: 'display' },
      { key: 'windowTextColor', value: currentSettings.windowTextColor, category: 'display' },
      { key: 'callBorderColor', value: currentSettings.callBorderColor, category: 'display' },
      { key: 'prayerTimesTextColor', value: currentSettings.prayerTimesTextColor, category: 'display' },
      { key: 'prayerTimesBackgroundColor', value: currentSettings.prayerTimesBackgroundColor, category: 'display' },
      { key: 'prayerTimesBackgroundMode', value: currentSettings.prayerTimesBackgroundMode, category: 'display' },
      { key: 'prayerTimesBackgroundGradient', value: currentSettings.prayerTimesBackgroundGradient, category: 'display' },
      { key: 'weatherTextColor', value: currentSettings.weatherTextColor, category: 'display' },
      { key: 'weatherBackgroundColor', value: currentSettings.weatherBackgroundColor, category: 'display' },
      { key: 'weatherBackgroundMode', value: currentSettings.weatherBackgroundMode, category: 'display' },
      { key: 'weatherBackgroundGradient', value: currentSettings.weatherBackgroundGradient, category: 'display' },
      { key: 'queueTextColor', value: currentSettings.queueTextColor, category: 'display' },
      { key: 'queueBackgroundColor', value: currentSettings.queueBackgroundColor, category: 'display' },
      { key: 'queueBackgroundMode', value: currentSettings.queueBackgroundMode, category: 'display' },
      { key: 'queueBackgroundGradient', value: currentSettings.queueBackgroundGradient, category: 'display' },
      { key: 'queueHighlightColor', value: currentSettings.queueHighlightColor, category: 'display' },
      { key: 'queueBorderColor', value: currentSettings.queueBorderColor, category: 'display' },
      { key: 'marqueeBackgroundMode', value: currentSettings.marqueeBackgroundMode, category: 'display' },
      { key: 'marqueeBackgroundGradient', value: currentSettings.marqueeBackgroundGradient, category: 'display' },
    ];
    
    await saveSettingsMutation.mutateAsync(settingsToSave);
    setUnsavedChanges(prev => prev.filter(item => item !== 'display'));
  };

  const handleSaveSound = async () => {
    const settingsToSave = [
      { key: 'enableSound', value: currentSettings.enableSound.toString(), category: 'audio' },
      { key: 'volume', value: currentSettings.volume.toString(), category: 'audio' },
      { key: 'presetKey', value: currentSettings.presetKey, category: 'audio' },
    ];
    
    await saveSettingsMutation.mutateAsync(settingsToSave);
    setUnsavedChanges(prev => prev.filter(item => item !== 'sound'));
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type === 'image/png' || file.type === 'image/jpeg') {
        setSelectedFile(file);
      } else {
        toast({
          title: "Format tidak disokong",
          description: "Sila pilih fail PNG atau JPEG sahaja",
          variant: "destructive",
        });
      }
    }
  };

  // Handle upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle upload file
  const handleUploadFile = () => {
    if (selectedFile) {
      uploadMediaMutation.mutate(selectedFile);
    }
  };

  // Media files query
  const { data: mediaFiles = [], isLoading: mediaLoading, refetch: refetchMedia } = useQuery<Media[]>({
    queryKey: ['/api/media'],
    staleTime: 30000,
  });

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const totalPages = Math.max(1, Math.ceil(mediaFiles.length / 3));
  
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

  // Test audio function
  const playTestSequence = useCallback(() => {
    // Test audio functionality would be implemented here
    console.log('Testing audio preset:', currentSettings.presetKey, 'at volume:', currentSettings.volume);
  }, [currentSettings.presetKey, currentSettings.volume]);

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

      {/* SECTION 1: MEDIA MANAGEMENT */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Media Management
          </h2>
          <p className="text-sm text-muted-foreground">Tetapan media dan galeri gambar</p>
        </div>
        
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

              {currentSettings.dashboardMediaType === "youtube" && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="youtube-url">YouTube URL:</Label>
                  <Input
                    id="youtube-url"
                    type="url"
                    value={currentSettings.youtubeUrl}
                    onChange={(e) => updateDisplaySetting('youtubeUrl', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    data-testid="input-youtube-url"
                  />
                  <div className="flex space-x-2 mt-2">
                    <Button 
                      onClick={handleSaveDisplay} 
                      className="w-full" 
                      data-testid="button-save-youtube"
                      disabled={saveSettingsMutation.isPending}
                    >
                      {saveSettingsMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Simpan YouTube URL
                    </Button>
                  </div>

                  {currentSettings.youtubeUrl && (
                    <div className="mt-4 p-4 border-2 border-green-200 rounded-lg bg-green-50">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-20 h-15 bg-gray-200 rounded flex items-center justify-center">
                            <Monitor className="h-8 w-8 text-gray-400" />
                          </div>
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center space-x-2 mb-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium text-green-800">Video YouTube Aktif</span>
                          </div>
                          <p className="text-sm text-green-700">
                            Video ini akan dipaparkan pada dashboard sebagai latar belakang.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Media Gallery Section - Only show if "own" media is selected */}
            {currentSettings.dashboardMediaType === "own" && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Galeri Media:</Label>
                
                <div className="space-y-4 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <div className="text-center space-y-4">
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="h-12 w-12 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Upload Gambar Baru</p>
                        <p className="text-xs text-gray-500 mt-1">Format yang disokong: PNG, JPEG sahaja (Maks 10MB)</p>
                      </div>
                    </div>
                    
                    {selectedFile ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center space-x-2 p-3 bg-white border rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <Upload className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            onClick={handleUploadFile}
                            disabled={uploadMediaMutation.isPending}
                            className="flex-1"
                            data-testid="button-upload-file"
                          >
                            {uploadMediaMutation.isPending ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            {uploadMediaMutation.isPending ? 'Mengupload...' : 'Upload Gambar'}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setSelectedFile(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                            disabled={uploadMediaMutation.isPending}
                            data-testid="button-cancel-upload"
                          >
                            Batal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        onClick={handleUploadClick}
                        variant="outline"
                        className="w-full"
                        data-testid="button-select-file"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Pilih Gambar
                      </Button>
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={handleFileSelect}
                      className="hidden"
                      data-testid="input-file-upload"
                    />
                  </div>
                </div>

                {mediaFiles.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Media Files ({mediaFiles.length})</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {Array.from({ length: 3 }).map((_, index) => {
                        const actualIndex = currentMediaIndex * 3 + index;
                        const media = mediaFiles[actualIndex];
                        
                        return media ? (
                          <div key={media.id} className="relative group">
                            <div className="bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors flex items-center justify-center"
                                 style={{ aspectRatio: '16/9', minHeight: '120px' }}>
                              
                              <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 ${media.type === 'image' && media.url ? 'hidden' : ''}`}>
                                <div className="text-center p-2">
                                  <Upload className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                                  <p className="text-xs text-blue-600 font-medium">{media.filename}</p>
                                </div>
                              </div>
                              
                              {media.type === 'image' && media.url && (
                                <img 
                                  src={media.url} 
                                  alt={media.filename}
                                  className="w-full h-full object-cover" 
                                />
                              )}
                            </div>
                          </div>
                        ) : (
                          <div key={`empty-${index}`} className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
                               style={{ aspectRatio: '16/9', minHeight: '120px' }}>
                            <span className="text-gray-400 text-sm">Slot Kosong</span>
                          </div>
                        );
                      })}
                    </div>

                    {totalPages > 1 && (
                      <div className="pt-6 border-t">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">
                              Halaman {currentMediaIndex + 1} daripada {totalPages}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              onClick={prevMedia}
                              disabled={currentMediaIndex === 0}
                              data-testid="button-prev-media"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Sebelum
                            </Button>
                            <Button
                              variant="outline"
                              onClick={nextMedia}
                              disabled={currentMediaIndex >= totalPages - 1}
                              data-testid="button-next-media"
                            >
                              Seterus
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Tiada media ditemui. Gunakan butang "Pilih Gambar" di atas untuk upload gambar.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: THEME & COLOR SETTINGS */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme & Color Settings
          </h2>
          <p className="text-sm text-muted-foreground">Kustomisasi warna setiap bahagian skrin secara individu</p>
        </div>
        
        {/* Header Section Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              Header Display
            </CardTitle>
            <p className="text-sm text-muted-foreground">Warna untuk bahagian header skrin TV</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Warna Text Header</Label>
                <Input
                  type="color"
                  value={currentSettings.headerTextColor || '#ffffff'}
                  onChange={(e) => updateDisplaySetting('headerTextColor', e.target.value)}
                  data-testid="input-header-text-color"
                />
              </div>
              <div className="space-y-2">
                <Label>Background Header</Label>
                
                {/* Toggle between solid and gradient */}
                <div className="flex space-x-2 mb-2">
                  <Button
                    variant={currentSettings.headerBackgroundMode === 'solid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateDisplaySetting('headerBackgroundMode', 'solid')}
                    data-testid="button-header-solid"
                  >
                    Solid
                  </Button>
                  <Button
                    variant={currentSettings.headerBackgroundMode === 'gradient' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateDisplaySetting('headerBackgroundMode', 'gradient')}
                    data-testid="button-header-gradient"
                  >
                    <Brush className="h-3 w-3 mr-1" />
                    Gradient
                  </Button>
                </div>

                {currentSettings.headerBackgroundMode === 'solid' ? (
                  <Input
                    type="color"
                    value={currentSettings.headerBackgroundColor || '#1e40af'}
                    onChange={(e) => updateDisplaySetting('headerBackgroundColor', e.target.value)}
                    data-testid="input-header-bg-color"
                  />
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full h-10"
                      onClick={() => setGradientPickers(prev => ({ ...prev, header: true }))}
                      data-testid="button-header-gradient-picker"
                      style={{
                        background: currentSettings.headerBackgroundGradient,
                        color: 'white',
                        border: '2px solid #e5e7eb'
                      }}
                    >
                      <Brush className="h-4 w-4 mr-2" />
                      Pilih Gradient
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Preview: {currentSettings.headerBackgroundGradient}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <Button 
              onClick={handleSaveDisplay} 
              className="w-full" 
              data-testid="button-save-header-colors"
              disabled={saveSettingsMutation.isPending}
            >
              {saveSettingsMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Simpan Warna Header
            </Button>
          </CardContent>
        </Card>

        {/* Current Call Display Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              Current Call Display
            </CardTitle>
            <p className="text-sm text-muted-foreground">Warna untuk paparan panggilan semasa</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Warna Nama Pesakit</Label>
                <Input
                  type="color"
                  value={currentSettings.callNameTextColor || '#ffffff'}
                  onChange={(e) => updateDisplaySetting('callNameTextColor', e.target.value)}
                  data-testid="input-call-name-color"
                />
              </div>
              <div className="space-y-2">
                <Label>Background Panggilan</Label>
                
                {/* Toggle between solid and gradient */}
                <div className="flex space-x-2 mb-2">
                  <Button
                    variant={currentSettings.callBackgroundMode === 'solid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateDisplaySetting('callBackgroundMode', 'solid')}
                    data-testid="button-call-solid"
                  >
                    Solid
                  </Button>
                  <Button
                    variant={currentSettings.callBackgroundMode === 'gradient' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateDisplaySetting('callBackgroundMode', 'gradient')}
                    data-testid="button-call-gradient"
                  >
                    <Brush className="h-3 w-3 mr-1" />
                    Gradient
                  </Button>
                </div>

                {currentSettings.callBackgroundMode === 'solid' ? (
                  <Input
                    type="color"
                    value={currentSettings.callBackgroundColor || '#16a34a'}
                    onChange={(e) => updateDisplaySetting('callBackgroundColor', e.target.value)}
                    data-testid="input-call-bg-color"
                  />
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full h-10"
                      onClick={() => setGradientPickers(prev => ({ ...prev, call: true }))}
                      data-testid="button-call-gradient-picker"
                      style={{
                        background: currentSettings.callBackgroundGradient,
                        color: 'white',
                        border: '2px solid #e5e7eb'
                      }}
                    >
                      <Brush className="h-4 w-4 mr-2" />
                      Pilih Gradient
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Preview: {currentSettings.callBackgroundGradient}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Warna Window/Counter</Label>
                <Input
                  type="color"
                  value={currentSettings.windowTextColor || '#ffffff'}
                  onChange={(e) => updateDisplaySetting('windowTextColor', e.target.value)}
                  data-testid="input-window-text-color"
                />
              </div>
              <div className="space-y-2">
                <Label>Warna Border</Label>
                <Input
                  type="color"
                  value={currentSettings.callBorderColor || '#22c55e'}
                  onChange={(e) => updateDisplaySetting('callBorderColor', e.target.value)}
                  data-testid="input-call-border-color"
                />
              </div>
            </div>
            <Button 
              onClick={handleSaveDisplay} 
              className="w-full" 
              data-testid="button-save-call-colors"
              disabled={saveSettingsMutation.isPending}
            >
              {saveSettingsMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Simpan Warna Panggilan
            </Button>
          </CardContent>
        </Card>

        {/* Prayer Times Section Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              Prayer Times Display
            </CardTitle>
            <p className="text-sm text-muted-foreground">Warna untuk paparan waktu solat</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Warna Text Waktu Solat</Label>
                <Input
                  type="color"
                  value={currentSettings.prayerTimesTextColor || '#ffffff'}
                  onChange={(e) => updateDisplaySetting('prayerTimesTextColor', e.target.value)}
                  data-testid="input-prayer-text-color"
                />
              </div>
              <div className="space-y-2">
                <Label>Background Waktu Solat</Label>
                
                {/* Toggle between solid and gradient */}
                <div className="flex space-x-2 mb-2">
                  <Button
                    variant={currentSettings.prayerTimesBackgroundMode === 'solid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateDisplaySetting('prayerTimesBackgroundMode', 'solid')}
                    data-testid="button-prayer-solid"
                  >
                    Solid
                  </Button>
                  <Button
                    variant={currentSettings.prayerTimesBackgroundMode === 'gradient' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateDisplaySetting('prayerTimesBackgroundMode', 'gradient')}
                    data-testid="button-prayer-gradient"
                  >
                    <Brush className="h-3 w-3 mr-1" />
                    Gradient
                  </Button>
                </div>

                {currentSettings.prayerTimesBackgroundMode === 'solid' ? (
                  <Input
                    type="color"
                    value={currentSettings.prayerTimesBackgroundColor || '#7c3aed'}
                    onChange={(e) => updateDisplaySetting('prayerTimesBackgroundColor', e.target.value)}
                    data-testid="input-prayer-bg-color"
                  />
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full h-10"
                      onClick={() => setGradientPickers(prev => ({ ...prev, prayer: true }))}
                      data-testid="button-prayer-gradient-picker"
                      style={{
                        background: currentSettings.prayerTimesBackgroundGradient,
                        color: 'white',
                        border: '2px solid #e5e7eb'
                      }}
                    >
                      <Brush className="h-4 w-4 mr-2" />
                      Pilih Gradient
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Preview: {currentSettings.prayerTimesBackgroundGradient}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <Button 
              onClick={handleSaveDisplay} 
              className="w-full" 
              data-testid="button-save-prayer-colors"
              disabled={saveSettingsMutation.isPending}
            >
              {saveSettingsMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Simpan Warna Waktu Solat
            </Button>
          </CardContent>
        </Card>

        {/* Weather Section Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              Weather Display
            </CardTitle>
            <p className="text-sm text-muted-foreground">Warna untuk paparan cuaca</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Warna Text Cuaca</Label>
                <Input
                  type="color"
                  value={currentSettings.weatherTextColor || '#ffffff'}
                  onChange={(e) => updateDisplaySetting('weatherTextColor', e.target.value)}
                  data-testid="input-weather-text-color"
                />
              </div>
              <div className="space-y-2">
                <Label>Background Cuaca</Label>
                
                {/* Toggle between solid and gradient */}
                <div className="flex space-x-2 mb-2">
                  <Button
                    variant={currentSettings.weatherBackgroundMode === 'solid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateDisplaySetting('weatherBackgroundMode', 'solid')}
                    data-testid="button-weather-solid"
                  >
                    Solid
                  </Button>
                  <Button
                    variant={currentSettings.weatherBackgroundMode === 'gradient' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateDisplaySetting('weatherBackgroundMode', 'gradient')}
                    data-testid="button-weather-gradient"
                  >
                    <Brush className="h-3 w-3 mr-1" />
                    Gradient
                  </Button>
                </div>

                {currentSettings.weatherBackgroundMode === 'solid' ? (
                  <Input
                    type="color"
                    value={currentSettings.weatherBackgroundColor || '#f97316'}
                    onChange={(e) => updateDisplaySetting('weatherBackgroundColor', e.target.value)}
                    data-testid="input-weather-bg-color"
                  />
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full h-10"
                      onClick={() => setGradientPickers(prev => ({ ...prev, weather: true }))}
                      data-testid="button-weather-gradient-picker"
                      style={{
                        background: currentSettings.weatherBackgroundGradient,
                        color: 'white',
                        border: '2px solid #e5e7eb'
                      }}
                    >
                      <Brush className="h-4 w-4 mr-2" />
                      Pilih Gradient
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Preview: {currentSettings.weatherBackgroundGradient}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <Button 
              onClick={handleSaveDisplay} 
              className="w-full" 
              data-testid="button-save-weather-colors"
              disabled={saveSettingsMutation.isPending}
            >
              {saveSettingsMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Simpan Warna Cuaca
            </Button>
          </CardContent>
        </Card>

        {/* Queue List Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              Queue List Display
            </CardTitle>
            <p className="text-sm text-muted-foreground">Warna untuk senarai giliran pesakit</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Warna Text Senarai</Label>
                <Input
                  type="color"
                  value={currentSettings.queueTextColor || '#1f2937'}
                  onChange={(e) => updateDisplaySetting('queueTextColor', e.target.value)}
                  data-testid="input-queue-text-color"
                />
              </div>
              <div className="space-y-2">
                <Label>Background Senarai</Label>
                
                {/* Toggle between solid and gradient */}
                <div className="flex space-x-2 mb-2">
                  <Button
                    variant={currentSettings.queueBackgroundMode === 'solid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateDisplaySetting('queueBackgroundMode', 'solid')}
                    data-testid="button-queue-solid"
                  >
                    Solid
                  </Button>
                  <Button
                    variant={currentSettings.queueBackgroundMode === 'gradient' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateDisplaySetting('queueBackgroundMode', 'gradient')}
                    data-testid="button-queue-gradient"
                  >
                    <Brush className="h-3 w-3 mr-1" />
                    Gradient
                  </Button>
                </div>

                {currentSettings.queueBackgroundMode === 'solid' ? (
                  <Input
                    type="color"
                    value={currentSettings.queueBackgroundColor || '#f3f4f6'}
                    onChange={(e) => updateDisplaySetting('queueBackgroundColor', e.target.value)}
                    data-testid="input-queue-bg-color"
                  />
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full h-10"
                      onClick={() => setGradientPickers(prev => ({ ...prev, queue: true }))}
                      data-testid="button-queue-gradient-picker"
                      style={{
                        background: currentSettings.queueBackgroundGradient,
                        color: 'white',
                        border: '2px solid #e5e7eb'
                      }}
                    >
                      <Brush className="h-4 w-4 mr-2" />
                      Pilih Gradient
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Preview: {currentSettings.queueBackgroundGradient}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Warna Highlight</Label>
                <Input
                  type="color"
                  value={currentSettings.queueHighlightColor || '#ef4444'}
                  onChange={(e) => updateDisplaySetting('queueHighlightColor', e.target.value)}
                  data-testid="input-queue-highlight-color"
                />
              </div>
              <div className="space-y-2">
                <Label>Warna Border</Label>
                <Input
                  type="color"
                  value={currentSettings.queueBorderColor || '#d1d5db'}
                  onChange={(e) => updateDisplaySetting('queueBorderColor', e.target.value)}
                  data-testid="input-queue-border-color"
                />
              </div>
            </div>
            <Button 
              onClick={handleSaveDisplay} 
              className="w-full" 
              data-testid="button-save-queue-colors"
              disabled={saveSettingsMutation.isPending}
            >
              {saveSettingsMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Simpan Warna Senarai
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3: INFORMATION DISPLAY SETTINGS */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Information Display Settings
          </h2>
          <p className="text-sm text-muted-foreground">Tetapan paparan maklumat dan marquee</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tetapan Paparan Maklumat</CardTitle>
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
                  onCheckedChange={(checked) => {
                    updateDisplaySetting('showPrayerTimes', checked);
                    if (checked) {
                      updateDisplaySetting('showWeather', false);
                    }
                  }}
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
                  onCheckedChange={(checked) => {
                    updateDisplaySetting('showWeather', checked);
                    if (checked) {
                      updateDisplaySetting('showPrayerTimes', false);
                    }
                  }}
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
                <Label>Warna Text Marquee</Label>
                <Input
                  type="color"
                  value={currentSettings.marqueeColor}
                  onChange={(e) => updateDisplaySetting('marqueeColor', e.target.value)}
                  data-testid="input-marquee-color"
                />
              </div>
              <div className="space-y-2">
                <Label>Background Marquee</Label>
                
                {/* Toggle between solid and gradient */}
                <div className="flex space-x-2 mb-2">
                  <Button
                    variant={currentSettings.marqueeBackgroundMode === 'solid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateDisplaySetting('marqueeBackgroundMode', 'solid')}
                    data-testid="button-marquee-solid"
                  >
                    Solid
                  </Button>
                  <Button
                    variant={currentSettings.marqueeBackgroundMode === 'gradient' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateDisplaySetting('marqueeBackgroundMode', 'gradient')}
                    data-testid="button-marquee-gradient"
                  >
                    <Brush className="h-3 w-3 mr-1" />
                    Gradient
                  </Button>
                </div>

                {currentSettings.marqueeBackgroundMode === 'solid' ? (
                  <Input
                    type="color"
                    value={currentSettings.marqueeBackgroundColor}
                    onChange={(e) => updateDisplaySetting('marqueeBackgroundColor', e.target.value)}
                    data-testid="input-marquee-background-color"
                  />
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full h-10"
                      onClick={() => setGradientPickers(prev => ({ ...prev, marquee: true }))}
                      data-testid="button-marquee-gradient-picker"
                      style={{
                        background: currentSettings.marqueeBackgroundGradient,
                        color: 'white',
                        border: '2px solid #e5e7eb'
                      }}
                    >
                      <Brush className="h-4 w-4 mr-2" />
                      Pilih Gradient
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Preview: {currentSettings.marqueeBackgroundGradient}
                    </p>
                  </div>
                )}
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
      </div>

      {/* SECTION 4: AUDIO SETTINGS */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio Settings
          </h2>
          <p className="text-sm text-muted-foreground">Tetapan bunyi dan audio</p>
        </div>
        
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
              <div className="space-y-4">
                {/* Preset Sound Selection */}
                <div className="space-y-4">
                  <Label>Audio Preset Selection</Label>
                  <Select
                    value={currentSettings.presetKey}
                    onValueChange={(value) => updateSoundSetting('presetKey', value)}
                  >
                    <SelectTrigger data-testid="select-preset-sound">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notification_sound">Notification Sound</SelectItem>
                      <SelectItem value="subway_chime">Subway Station Chime</SelectItem>
                      <SelectItem value="header_tone">Header Tone</SelectItem>
                      <SelectItem value="airport_chime">Airport Announcement Chime</SelectItem>
                      <SelectItem value="airport_call">Airport Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Volume Control */}
                <div className="space-y-2">
                  <Label>Volume: {currentSettings.volume}%</Label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentSettings.volume}
                    onChange={(e) => {
                      const newVolume = parseInt(e.target.value);
                      updateSoundSetting('volume', newVolume);
                    }}
                    className="w-full"
                    data-testid="slider-volume"
                  />
                </div>

                {/* Test Audio Button */}
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={() => playTestSequence()}
                    className="w-full"
                    data-testid="button-test-audio"
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    Test Audio Preset
                  </Button>
                </div>
              </div>
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
      </div>

      {/* Gradient Picker Modals */}
      <GradientPicker
        isOpen={gradientPickers.header}
        onClose={() => setGradientPickers(prev => ({ ...prev, header: false }))}
        onApply={(gradient) => {
          updateDisplaySetting('headerBackgroundGradient', gradient);
          setGradientPickers(prev => ({ ...prev, header: false }));
        }}
        title="Header Background Gradient"
        currentValue={currentSettings.headerBackgroundGradient}
      />
      
      <GradientPicker
        isOpen={gradientPickers.call}
        onClose={() => setGradientPickers(prev => ({ ...prev, call: false }))}
        onApply={(gradient) => {
          updateDisplaySetting('callBackgroundGradient', gradient);
          setGradientPickers(prev => ({ ...prev, call: false }));
        }}
        title="Call Background Gradient"
        currentValue={currentSettings.callBackgroundGradient}
      />
      
      <GradientPicker
        isOpen={gradientPickers.prayer}
        onClose={() => setGradientPickers(prev => ({ ...prev, prayer: false }))}
        onApply={(gradient) => {
          updateDisplaySetting('prayerTimesBackgroundGradient', gradient);
          setGradientPickers(prev => ({ ...prev, prayer: false }));
        }}
        title="Prayer Times Background Gradient"
        currentValue={currentSettings.prayerTimesBackgroundGradient}
      />
      
      <GradientPicker
        isOpen={gradientPickers.weather}
        onClose={() => setGradientPickers(prev => ({ ...prev, weather: false }))}
        onApply={(gradient) => {
          updateDisplaySetting('weatherBackgroundGradient', gradient);
          setGradientPickers(prev => ({ ...prev, weather: false }));
        }}
        title="Weather Background Gradient"
        currentValue={currentSettings.weatherBackgroundGradient}
      />
      
      <GradientPicker
        isOpen={gradientPickers.queue}
        onClose={() => setGradientPickers(prev => ({ ...prev, queue: false }))}
        onApply={(gradient) => {
          updateDisplaySetting('queueBackgroundGradient', gradient);
          setGradientPickers(prev => ({ ...prev, queue: false }));
        }}
        title="Queue Background Gradient"
        currentValue={currentSettings.queueBackgroundGradient}
      />
      
      <GradientPicker
        isOpen={gradientPickers.marquee}
        onClose={() => setGradientPickers(prev => ({ ...prev, marquee: false }))}
        onApply={(gradient) => {
          updateDisplaySetting('marqueeBackgroundGradient', gradient);
          setGradientPickers(prev => ({ ...prev, marquee: false }));
        }}
        title="Marquee Background Gradient"
        currentValue={currentSettings.marqueeBackgroundGradient}
      />
    </div>
  );
}