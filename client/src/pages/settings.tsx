import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Monitor, Volume2, Palette, Upload } from "lucide-react";

export default function Settings() {
  const [displaySettings, setDisplaySettings] = useState({
    mediaType: "image",
    theme: "blue",
    showPrayerTimes: true,
    showWeather: false,
    marqueeText: "Selamat datang ke Klinik Kesihatan",
    marqueeColor: "#ffffff"
  });

  const [soundSettings, setSoundSettings] = useState({
    enableSound: true,
    soundType: "beep",
    enableTTS: false,
    volume: 70
  });

  const handleSaveDisplay = () => {
    console.log("Saving display settings:", displaySettings);
    // TODO: Remove mock functionality - send to backend
  };

  const handleSaveSound = () => {
    console.log("Saving sound settings:", soundSettings);
    // TODO: Remove mock functionality - send to backend
  };

  const handleFileUpload = (type: "logo" | "background") => {
    console.log(`Uploading ${type} file`);
    // TODO: Remove mock functionality - implement real file upload
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Konfigurasi paparan, bunyi dan tetapan sistem</p>
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
                  value={displaySettings.mediaType} 
                  onValueChange={(value) => setDisplaySettings(prev => ({ ...prev, mediaType: value }))}
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
                  value={displaySettings.theme} 
                  onValueChange={(value) => setDisplaySettings(prev => ({ ...prev, theme: value }))}
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
                    checked={displaySettings.showPrayerTimes}
                    onCheckedChange={(checked) => setDisplaySettings(prev => ({ ...prev, showPrayerTimes: checked }))}
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
                    checked={displaySettings.showWeather}
                    onCheckedChange={(checked) => setDisplaySettings(prev => ({ ...prev, showWeather: checked }))}
                    data-testid="switch-weather"
                  />
                </div>
              </div>

              {/* Marquee Settings */}
              <div className="space-y-4">
                <Label>Marquee Text</Label>
                <Textarea
                  value={displaySettings.marqueeText}
                  onChange={(e) => setDisplaySettings(prev => ({ ...prev, marqueeText: e.target.value }))}
                  placeholder="Masukkan teks yang akan bergerak di bahagian bawah skrin"
                  data-testid="textarea-marquee-text"
                />
                <div className="space-y-2">
                  <Label>Warna Marquee</Label>
                  <Input
                    type="color"
                    value={displaySettings.marqueeColor}
                    onChange={(e) => setDisplaySettings(prev => ({ ...prev, marqueeColor: e.target.value }))}
                    data-testid="input-marquee-color"
                  />
                </div>
              </div>

              <Button onClick={handleSaveDisplay} className="w-full" data-testid="button-save-display">
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
                  checked={soundSettings.enableSound}
                  onCheckedChange={(checked) => setSoundSettings(prev => ({ ...prev, enableSound: checked }))}
                  data-testid="switch-enable-sound"
                />
              </div>

              {soundSettings.enableSound && (
                <>
                  {/* Sound Type */}
                  <div className="space-y-2">
                    <Label>Jenis Bunyi</Label>
                    <Select 
                      value={soundSettings.soundType} 
                      onValueChange={(value) => setSoundSettings(prev => ({ ...prev, soundType: value }))}
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
                    <Label>Volume ({soundSettings.volume}%)</Label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={soundSettings.volume}
                      onChange={(e) => setSoundSettings(prev => ({ ...prev, volume: parseInt(e.target.value) }))}
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
                      checked={soundSettings.enableTTS}
                      onCheckedChange={(checked) => setSoundSettings(prev => ({ ...prev, enableTTS: checked }))}
                      data-testid="switch-enable-tts"
                    />
                  </div>

                  {/* Custom Audio Upload */}
                  {soundSettings.soundType === "custom" && (
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

              <Button onClick={handleSaveSound} className="w-full" data-testid="button-save-sound">
                Simpan Tetapan Bunyi
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}