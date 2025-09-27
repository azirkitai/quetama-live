import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Monitor, Volume2, Palette, Upload, Save, RefreshCw, CheckCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Setting } from "@shared/schema";

interface SettingsState {
  mediaType: string;
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

  // Update state when settings are loaded from database
  useEffect(() => {
    if (settings.length > 0) {
      const newSettings = {
        mediaType: settingsObj.mediaType || "image",
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
  }, [settings, settingsObj.mediaType, settingsObj.theme, settingsObj.showPrayerTimes, settingsObj.showWeather, settingsObj.marqueeText, settingsObj.marqueeColor, settingsObj.enableSound, settingsObj.soundType, settingsObj.enableTTS, settingsObj.volume]);

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

  const trackChange = (key: string) => {
    if (!unsavedChanges.includes(key)) {
      setUnsavedChanges([...unsavedChanges, key]);
    }
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

  const handleFileUpload = (type: "logo" | "background") => {
    toast({
      title: "Muat Naik Fail",
      description: `Fungsi muat naik ${type} akan dilaksanakan tidak lama lagi`,
    });
  };

  if (isLoading) {
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Media & Theme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Media Type */}
              <div className="space-y-2">
                <Label>Jenis Media Background</Label>
                <Select 
                  value={currentSettings.mediaType} 
                  onValueChange={(value) => updateDisplaySetting('mediaType', value)}
                >
                  <SelectTrigger data-testid="select-media-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Gambar</SelectItem>
                    <SelectItem value="youtube">YouTube Video</SelectItem>
                    <SelectItem value="none">Tiada Background</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Logo Klinik</Label>
                  <Button
                    variant="outline"
                    onClick={() => handleFileUpload("logo")}
                    className="w-full"
                    data-testid="button-upload-logo"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Background Image</Label>
                  <Button
                    variant="outline"
                    onClick={() => handleFileUpload("background")}
                    className="w-full"
                    data-testid="button-upload-background"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Background
                  </Button>
                </div>
              </div>

              {/* Theme Color */}
              <div className="space-y-2">
                <Label>Tema Warna</Label>
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