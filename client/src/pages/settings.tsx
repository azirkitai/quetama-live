import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Monitor, Volume2, Palette, Upload, Save, RefreshCw, CheckCircle, Plus, ChevronLeft, ChevronRight, Eye, Trash2, Edit, Star, Upload as UploadIcon } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
}

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
  });

  // Update settings state when data is loaded
  useEffect(() => {
    if (settings.length > 0) {
      setCurrentSettings(prev => ({
        ...prev,
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
        soundMode: 'preset',
        presetKey: (settingsObj.presetKey as PresetSoundKeyType) || 'notification_sound',
      }));
    }
  }, [settings, settingsObj]);

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

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: Array<{key: string, value: string}>) => {
      return apiRequest('/api/settings', {
        method: 'POST',
        body: { settings }
      });
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
      { key: 'theme', value: currentSettings.theme },
      { key: 'showPrayerTimes', value: currentSettings.showPrayerTimes.toString() },
      { key: 'showWeather', value: currentSettings.showWeather.toString() },
      { key: 'marqueeText', value: currentSettings.marqueeText },
      { key: 'marqueeColor', value: currentSettings.marqueeColor },
      { key: 'marqueeBackgroundColor', value: currentSettings.marqueeBackgroundColor },
      { key: 'dashboardMediaType', value: currentSettings.dashboardMediaType },
      { key: 'youtubeUrl', value: currentSettings.youtubeUrl },
    ];
    
    await saveSettingsMutation.mutateAsync(settingsToSave);
    setUnsavedChanges(prev => prev.filter(item => item !== 'display'));
  };

  const handleSaveSound = async () => {
    const settingsToSave = [
      { key: 'enableSound', value: currentSettings.enableSound.toString() },
      { key: 'volume', value: currentSettings.volume.toString() },
      { key: 'presetKey', value: currentSettings.presetKey },
    ];
    
    await saveSettingsMutation.mutateAsync(settingsToSave);
    setUnsavedChanges(prev => prev.filter(item => item !== 'sound'));
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
    audioSystem.testPreset(currentSettings.presetKey, currentSettings.volume);
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
                
                <div className="space-y-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Upload gambar melalui Object Storage pane di sebelah kanan →
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Format yang disokong: PNG, JPEG, GIF</p>
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
                    <p>Tiada media ditemui. Upload gambar melalui Object Storage pane.</p>
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
          <p className="text-sm text-muted-foreground">Kustomisasi warna dan tema visual</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Tetapan Tema dan Warna</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSaveDisplay} 
              className="w-full" 
              data-testid="button-save-theme"
              disabled={saveSettingsMutation.isPending}
            >
              {saveSettingsMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Simpan Tetapan Tema
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
                <Label>Warna Background Marquee</Label>
                <Input
                  type="color"
                  value={currentSettings.marqueeBackgroundColor}
                  onChange={(e) => updateDisplaySetting('marqueeBackgroundColor', e.target.value)}
                  data-testid="input-marquee-background-color"
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
    </div>
  );
}