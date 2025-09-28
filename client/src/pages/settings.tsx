import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Monitor, Volume2, Palette, Upload, Save, RefreshCw, CheckCircle, Plus, ChevronLeft, ChevronRight, Eye, Trash2, Edit, Star, Upload as UploadIcon } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Setting, Media, Theme } from "@shared/schema";
import { audioSystem } from "@/lib/audio-system";

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
  ttsLanguage: string; // "ms" for Malay, "en" for English
  volume: number;
  // Enhanced audio system
  soundMode: 'synth' | 'preset' | 'file';
  presetKey?: string;
  customAudioId?: string;
  // Separate voice models for better quality
  elevenVoiceIdBM: string; // Voice ID for Bahasa Malaysia
  elevenVoiceIdEN: string; // Voice ID for English
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
    ttsLanguage: "ms",
    volume: 70,
    // Enhanced audio system defaults
    soundMode: 'synth',
    presetKey: undefined,
    customAudioId: undefined,
    // Separate voice models for better quality
    elevenVoiceIdBM: "15Y62ZlO8it2f5wduybx", // Voice untuk Bahasa Malaysia
    elevenVoiceIdEN: "21m00Tcm4TlvDq8ikWAM"  // Default ElevenLabs voice for EN (Rachel)
  });

  // YouTube preview states
  const [youtubeThumbnail, setYoutubeThumbnail] = useState<string>("");
  const [youtubeTitle, setYoutubeTitle] = useState<string>("");
  const [youtubeValidated, setYoutubeValidated] = useState<boolean>(false);

  // YouTube helper functions
  const extractYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  const generateYouTubeThumbnail = (videoId: string): string => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  const validateAndPreviewYouTube = async (url: string) => {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      setYoutubeValidated(false);
      setYoutubeThumbnail("");
      setYoutubeTitle("");
      return false;
    }

    try {
      const thumbnailUrl = generateYouTubeThumbnail(videoId);
      setYoutubeThumbnail(thumbnailUrl);
      setYoutubeTitle(`YouTube Video (${videoId})`);
      setYoutubeValidated(true);
      return true;
    } catch (error) {
      console.error('Error validating YouTube URL:', error);
      setYoutubeValidated(false);
      setYoutubeThumbnail("");
      setYoutubeTitle("");
      return false;
    }
  };

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
        ttsLanguage: settingsObj.ttsLanguage || "ms",
        volume: parseInt(settingsObj.volume || "70"),
        // Enhanced audio system fields
        soundMode: (settingsObj.soundMode as 'synth' | 'preset' | 'file') || 'synth',
        presetKey: settingsObj.presetKey || undefined,
        customAudioId: settingsObj.customAudioId || undefined,
        // Separate voice models for better quality
        elevenVoiceIdBM: settingsObj.elevenVoiceIdBM || "15Y62ZlO8it2f5wduybx", // Voice untuk Bahasa Malaysia
        elevenVoiceIdEN: settingsObj.elevenVoiceIdEN || "21m00Tcm4TlvDq8ikWAM"
      };
      
      setCurrentSettings(newSettings);
      setUnsavedChanges([]); // Clear unsaved changes when loading fresh data
      
      // Auto-validate YouTube URL if it exists
      if (newSettings.youtubeUrl && newSettings.dashboardMediaType === "youtube") {
        validateAndPreviewYouTube(newSettings.youtubeUrl);
      }
    }
  }, [settings, settingsObj.mediaType, settingsObj.dashboardMediaType, settingsObj.youtubeUrl, settingsObj.theme, settingsObj.showPrayerTimes, settingsObj.showWeather, settingsObj.marqueeText, settingsObj.marqueeColor, settingsObj.enableSound, settingsObj.soundType, settingsObj.enableTTS, settingsObj.ttsLanguage, settingsObj.volume, settingsObj.soundMode, settingsObj.presetKey, settingsObj.customAudioId, settingsObj.elevenVoiceIdBM, settingsObj.elevenVoiceIdEN]);

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

  // Gradient presets for different elements
  const gradientPresets = {
    calling: [
      "linear-gradient(45deg, #3b82f6, #1d4ed8)",
      "linear-gradient(90deg, #06b6d4, #0891b2)",
      "linear-gradient(135deg, #8b5cf6, #7c3aed)",
      "linear-gradient(180deg, #10b981, #059669)"
    ],
    highlight: [
      "linear-gradient(45deg, #ef4444, #dc2626)",
      "linear-gradient(90deg, #f59e0b, #d97706)",
      "linear-gradient(135deg, #ec4899, #db2777)",
      "linear-gradient(180deg, #f97316, #ea580c)"
    ],
    history: [
      "linear-gradient(45deg, #6b7280, #4b5563)",
      "linear-gradient(90deg, #64748b, #475569)",
      "linear-gradient(135deg, #78716c, #57534e)",
      "linear-gradient(180deg, #71717a, #52525b)"
    ],
    clinic: [
      "linear-gradient(45deg, #1f2937, #111827)",
      "linear-gradient(90deg, #374151, #1f2937)",
      "linear-gradient(135deg, #4b5563, #374151)",
      "linear-gradient(180deg, #6b7280, #4b5563)"
    ]
  };

  // Handle gradient button clicks
  const handleGradientClick = (element: 'calling' | 'highlight' | 'history' | 'clinic') => {
    const presets = gradientPresets[element];
    const randomGradient = presets[Math.floor(Math.random() * presets.length)];
    
    const gradientFieldMap = {
      calling: 'callingGradient',
      highlight: 'highlightBoxGradient', 
      history: 'historyNameGradient',
      clinic: 'clinicNameGradient'
    } as const;
    
    handleThemeColorChange(gradientFieldMap[element], randomGradient);
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
    
    // Auto-save for critical settings like dashboardMediaType and youtubeUrl
    if (key === 'dashboardMediaType') {
      const autoSaveSettings = [
        { key: 'dashboardMediaType', value: value, category: 'display' }
      ];
      saveSettingsMutation.mutate(autoSaveSettings);
    } else if (key === 'youtubeUrl') {
      // Auto-save YouTube URL immediately when changed
      const autoSaveSettings = [
        { key: 'youtubeUrl', value: value, category: 'display' }
      ];
      saveSettingsMutation.mutate(autoSaveSettings);
    }
  };

  const updateSoundSetting = (key: keyof SettingsState, value: any) => {
    const updatedSettings = { ...currentSettings, [key]: value };
    
    // Auto-update soundType based on soundMode to ensure compatibility
    if (key === 'soundMode') {
      if (value === 'preset') {
        updatedSettings.soundType = 'announcement'; // Set appropriate soundType for preset mode
        if (!updatedSettings.presetKey) {
          updatedSettings.presetKey = 'announcement1'; // Default preset
        }
      } else if (value === 'file') {
        updatedSettings.soundType = 'custom'; // Set appropriate soundType for file mode
      } else if (value === 'synth') {
        updatedSettings.soundType = 'beep'; // Default for synth mode
      }
    }
    
    setCurrentSettings(updatedSettings);
    trackChange(key);
    
    // Track additional changes if we auto-updated other fields
    if (key === 'soundMode') {
      trackChange('soundType');
      if (value === 'preset' && !currentSettings.presetKey) {
        trackChange('presetKey');
      }
    }
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
      { key: 'ttsLanguage', value: currentSettings.ttsLanguage, category: 'sound' },
      { key: 'volume', value: currentSettings.volume.toString(), category: 'sound' },
      // Enhanced audio system fields
      { key: 'soundMode', value: currentSettings.soundMode, category: 'sound' },
      { key: 'presetKey', value: currentSettings.presetKey || '', category: 'sound' },
      { key: 'customAudioId', value: currentSettings.customAudioId || '', category: 'sound' },
      // Separate voice models for better quality
      { key: 'elevenVoiceIdBM', value: currentSettings.elevenVoiceIdBM, category: 'sound' },
      { key: 'elevenVoiceIdEN', value: currentSettings.elevenVoiceIdEN, category: 'sound' }
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

  // Volume preview debouncing
  const volumePreviewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced volume preview function
  const debouncedVolumePreview = useCallback((volume: number) => {
    // Clear existing timeout
    if (volumePreviewTimeoutRef.current) {
      clearTimeout(volumePreviewTimeoutRef.current);
    }

    // Set new timeout for volume preview
    volumePreviewTimeoutRef.current = setTimeout(() => {
      playTestSound(volume);
    }, 300); // 300ms debounce
  }, [currentSettings.soundType]);

  // Audio testing functions using the new audio system
  const playTestSound = async (volume?: number) => {
    const testVolume = volume !== undefined ? volume : currentSettings.volume;
    
    try {
      // Create AudioSettings object for the new API
      const audioSettings = {
        enableSound: true,
        enableTTS: false,
        volume: testVolume,
        ttsLanguage: currentSettings.ttsLanguage,
        soundMode: currentSettings.soundMode,
        soundType: currentSettings.soundType,
        presetKey: currentSettings.presetKey,
        customAudioId: currentSettings.customAudioId
      };
      
      await audioSystem.playTestSound(audioSettings);
    } catch (error) {
      console.error('Error playing test sound:', error);
      toast({
        title: "Audio Error",
        description: error instanceof Error ? error.message : "Failed to play test sound",
        variant: "destructive"
      });
    }
  };

  const playTestTTS = async () => {
    try {
      const testCallInfo = {
        patientName: "Ahmad Bin Ali",
        patientNumber: 123,
        windowName: "Kaunter 1"
      };

      await audioSystem.playTTS(testCallInfo, currentSettings.ttsLanguage, currentSettings.volume);
    } catch (error) {
      console.error('Error playing test TTS:', error);
      toast({
        title: "TTS Error",
        description: error instanceof Error ? error.message : "Failed to play text-to-speech",
        variant: "destructive"
      });
    }
  };

  const playTestSequence = async () => {
    try {
      const audioSettings = {
        enableSound: currentSettings.enableSound,
        soundType: currentSettings.soundType,
        enableTTS: currentSettings.enableTTS,
        ttsLanguage: currentSettings.ttsLanguage,
        volume: currentSettings.volume,
        soundMode: currentSettings.soundMode,
        presetKey: currentSettings.presetKey,
        customAudioId: currentSettings.customAudioId
      };

      await audioSystem.playTestSequence(audioSettings);
      
      toast({
        title: "Test Complete",
        description: "Audio sequence played successfully",
      });
    } catch (error) {
      console.error('Error playing test sequence:', error);
      toast({
        title: "Test Error",
        description: error instanceof Error ? error.message : "Failed to play test sequence",
        variant: "destructive"
      });
    }
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
                      onChange={(e) => {
                        updateDisplaySetting('youtubeUrl', e.target.value);
                        // Clear previous validation when URL changes
                        setYoutubeValidated(false);
                        setYoutubeThumbnail("");
                        setYoutubeTitle("");
                      }}
                      className="w-full"
                      data-testid="input-youtube-url"
                    />
                    <div className="flex space-x-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (currentSettings.youtubeUrl) {
                            const isValid = await validateAndPreviewYouTube(currentSettings.youtubeUrl);
                            if (isValid) {
                              toast({
                                title: "URL YouTube Sah",
                                description: "URL YouTube telah disahkan dan preview dipaparkan.",
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
                    
                    {/* YouTube Preview */}
                    {youtubeValidated && youtubeThumbnail && (
                      <div className="mt-4 p-4 border-2 border-green-200 rounded-lg bg-green-50">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <img
                              src={youtubeThumbnail}
                              alt="YouTube Thumbnail"
                              className="w-32 h-24 object-cover rounded-lg border"
                              onError={(e) => {
                                // Fallback if maxresdefault doesn't exist
                                const target = e.target as HTMLImageElement;
                                const videoId = extractYouTubeVideoId(currentSettings.youtubeUrl);
                                if (videoId) {
                                  target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                }
                              }}
                              data-testid="youtube-thumbnail"
                            />
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center space-x-2 mb-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <span className="font-semibold text-green-800">URL YouTube Sah</span>
                            </div>
                            <p className="text-sm text-green-700">
                              {youtubeTitle}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              Video ini akan dipaparkan di paparan TV
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
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

          {/* Media Gallery Section - Only shown for image uploads */}
          {currentSettings.dashboardMediaType === "own" && (
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
              <div className="grid grid-cols-3 gap-4">
                {mediaFiles.slice(currentMediaIndex * 3, (currentMediaIndex + 1) * 3).map((media, index) => (
                  <div key={media.id} className="relative group">
                    <div className="bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors flex items-center justify-center"
                         style={{ minHeight: '200px', maxHeight: '300px' }}>
                      {/* Display actual image if it's an image type */}
                      {media.type === 'image' && media.url ? (
                        <img 
                          src={media.url} 
                          alt={media.name}
                          className="max-w-full max-h-full object-contain rounded"
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
                        {index + 1 + currentMediaIndex * 3} / {mediaFiles.length}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Empty slots if less than 3 items */}
                {Array.from({ length: Math.max(0, 3 - mediaFiles.slice(currentMediaIndex * 3, (currentMediaIndex + 1) * 3).length) }).map((_, index) => (
                  <div key={`empty-${index}`} className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
                       style={{ minHeight: '200px', maxHeight: '300px' }}>
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
                      onClick={async () => {
                        try {
                          const mediaIds = mediaFiles.map(media => media.id);
                          const response = await fetch('/api/display', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ mediaIds }),
                          });

                          if (response.ok) {
                            const result = await response.json();
                            toast({
                              title: "Gambar Berjaya Dipindah",
                              description: result.message || `${mediaFiles.length} gambar telah dipindah ke paparan iklan`,
                            });
                          } else {
                            const error = await response.json();
                            toast({
                              title: "Ralat",
                              description: error.error || "Gagal memindah gambar ke paparan",
                              variant: "destructive",
                            });
                          }
                        } catch (error) {
                          console.error('Error saving to display:', error);
                          toast({
                            title: "Ralat",
                            description: "Gagal memindah gambar ke paparan",
                            variant: "destructive",
                          });
                        }
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
          )}

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
                      value={themeColors.callingColor || "#3b82f6"}
                      onChange={(e) => handleThemeColorChange('callingColor', e.target.value)}
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleGradientClick('calling')}
                      data-testid="button-gradient-calling"
                    >
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
                      value={themeColors.highlightBoxColor || "#ef4444"}
                      onChange={(e) => handleThemeColorChange('highlightBoxColor', e.target.value)}
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleGradientClick('highlight')}
                      data-testid="button-gradient-highlight"
                    >
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
                      value={themeColors.historyNameColor || "#6b7280"}
                      onChange={(e) => handleThemeColorChange('historyNameColor', e.target.value)}
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleGradientClick('history')}
                      data-testid="button-gradient-history"
                    >
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
                      value={themeColors.clinicNameColor || "#1f2937"}
                      onChange={(e) => handleThemeColorChange('clinicNameColor', e.target.value)}
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleGradientClick('clinic')}
                      data-testid="button-gradient-clinic-name"
                    >
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
                  {/* Sound Mode Selection */}
                  <div className="space-y-4">
                    <Label>Mode Bunyi</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={currentSettings.soundMode === 'synth' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateSoundSetting('soundMode', 'synth')}
                        data-testid="button-mode-synth"
                        className="flex flex-col p-4 h-auto"
                      >
                        <Volume2 className="h-5 w-5 mb-1" />
                        <span className="text-xs">Simple Tones</span>
                      </Button>
                      <Button
                        variant={currentSettings.soundMode === 'preset' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateSoundSetting('soundMode', 'preset')}
                        data-testid="button-mode-preset"
                        className="flex flex-col p-4 h-auto"
                      >
                        <Star className="h-5 w-5 mb-1" />
                        <span className="text-xs">Announcement</span>
                      </Button>
                      <Button
                        variant={currentSettings.soundMode === 'file' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateSoundSetting('soundMode', 'file')}
                        data-testid="button-mode-file"
                        className="flex flex-col p-4 h-auto"
                      >
                        <UploadIcon className="h-5 w-5 mb-1" />
                        <span className="text-xs">Custom File</span>
                      </Button>
                    </div>
                  </div>

                  {/* Mode-specific Controls */}
                  {currentSettings.soundMode === 'synth' && (
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
                          <SelectItem value="beep">Beep (Standard)</SelectItem>
                          <SelectItem value="chime">Chime (Gentle)</SelectItem>
                          <SelectItem value="bell">Bell (Classic)</SelectItem>
                          <SelectItem value="notification">Notification (Modern)</SelectItem>
                          <SelectItem value="ding">Ding (Sharp)</SelectItem>
                          <SelectItem value="tone">Tone (Professional)</SelectItem>
                          <SelectItem value="buzzer">Buzzer (Attention)</SelectItem>
                          <SelectItem value="whistle">Whistle (Alert)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {currentSettings.soundMode === 'preset' && (
                    <div className="space-y-2">
                      <Label>Professional Announcement Sounds</Label>
                      <Select 
                        value={currentSettings.presetKey || ''} 
                        onValueChange={(value) => updateSoundSetting('presetKey', value)}
                      >
                        <SelectTrigger data-testid="select-preset-sound">
                          <SelectValue placeholder="Pilih bunyi announcement" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="announcement1">Professional Announcement 1</SelectItem>
                          <SelectItem value="announcement2">Professional Announcement 2</SelectItem>
                          <SelectItem value="announcement3">Professional Announcement 3</SelectItem>
                          <SelectItem value="hospital_chime">Hospital Chime</SelectItem>
                          <SelectItem value="professional_ding">Professional Ding</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="text-sm text-muted-foreground">
                        Bunyi announcement berkualiti tinggi yang sesuai untuk klinik
                      </div>
                    </div>
                  )}

                  {currentSettings.soundMode === 'file' && (
                    <div className="space-y-2">
                      <Label>Custom Audio File</Label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <UploadIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload your custom announcement sound
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supported formats: MP3, WAV (Max 5MB)
                        </p>
                        <Button variant="outline" size="sm" className="mt-2" disabled>
                          Choose File (Coming Soon)
                        </Button>
                      </div>
                      {currentSettings.customAudioId && (
                        <div className="text-sm text-green-600">
                          ✓ Custom audio file uploaded successfully
                        </div>
                      )}
                    </div>
                  )}

                  {/* Volume with Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Volume ({currentSettings.volume}%)</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => playTestSound()}
                        data-testid="button-test-sound"
                      >
                        <Volume2 className="h-4 w-4 mr-2" />
                        Test Sound
                      </Button>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentSettings.volume}
                      onChange={(e) => {
                        const newVolume = parseInt(e.target.value);
                        updateSoundSetting('volume', newVolume);
                      }}
                      onInput={(e) => {
                        const newVolume = parseInt((e.target as HTMLInputElement).value);
                        updateSoundSetting('volume', newVolume);
                        // Debounced real-time preview
                        debouncedVolumePreview(newVolume);
                      }}
                      className="w-full"
                      data-testid="slider-volume"
                    />
                  </div>

                  {/* Text-to-Speech */}
                  <div className="space-y-4">
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

                    {currentSettings.enableTTS && (
                      <>
                        {/* TTS Language Selection */}
                        <div className="space-y-2">
                          <Label>Bahasa TTS</Label>
                          <Select 
                            value={currentSettings.ttsLanguage || "ms"} 
                            onValueChange={(value) => updateSoundSetting('ttsLanguage', value)}
                          >
                            <SelectTrigger data-testid="select-tts-language">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ms">Bahasa Melayu</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* TTS Templates Preview */}
                        <div className="space-y-2">
                          <Label>Template Preview (ElevenLabs Enhanced)</Label>
                          <div className="p-3 bg-muted rounded-lg text-sm">
                            <div className="mb-2">
                              <strong>Natural Format:</strong><br />
                              <span className="text-green-600">English: "Calling for [Name]. Please proceed to [Window]."</span><br />
                              <span className="text-green-600">Malay: "Panggilan untuk [Name]. Sila ke [Window]."</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Menggunakan suara natural ElevenLabs dengan punctuation untuk jeda yang lebih alami<br />
                              Auto-fallback ke browser TTS jika ElevenLabs tidak tersedia
                            </div>
                          </div>
                        </div>

                        {/* ElevenLabs Configuration Notice */}
                        <div className="space-y-2">
                          <Label>ElevenLabs TTS Configuration</Label>
                          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                            <div className="text-sm space-y-2">
                              <div className="font-medium text-blue-900 dark:text-blue-100">
                                Separate Language Models for Better Quality
                              </div>
                              <div className="text-blue-700 dark:text-blue-300">
                                Menggunakan model berlainan untuk Bahasa Malaysia dan English untuk kualiti suara yang lebih baik.
                              </div>
                              <div className="mt-3 text-xs text-blue-600 dark:text-blue-400 space-y-1">
                                <div><strong>Setup Required:</strong></div>
                                <div>1. Dapatkan ElevenLabs API key dari elevenlabs.io</div>
                                <div>2. Di Replit Secrets, tambah: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">ELEVEN_API_KEY</code></div>
                                <div>3. (Opsional) Tambah voice IDs khusus untuk setiap bahasa di bawah</div>
                                <div className="mt-2 font-medium">Jika tidak dikonfigurasi, akan auto-fallback ke browser TTS.</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Separate Voice Models Configuration */}
                        <div className="space-y-4">
                          <Label>Voice Models untuk Setiap Bahasa</Label>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Bahasa Malaysia Voice ID */}
                            <div className="space-y-2">
                              <Label htmlFor="elevenVoiceIdBM">Voice ID - Bahasa Malaysia</Label>
                              <Input
                                id="elevenVoiceIdBM"
                                data-testid="input-eleven-voice-bm"
                                value={currentSettings.elevenVoiceIdBM}
                                onChange={(e) => {
                                  setCurrentSettings(prev => ({ ...prev, elevenVoiceIdBM: e.target.value }));
                                  setUnsavedChanges(prev => [...prev.filter(key => key !== 'elevenVoiceIdBM'), 'elevenVoiceIdBM']);
                                }}
                                placeholder="15Y62ZlO8it2f5wduybx"
                                className="font-mono text-sm"
                              />
                              <div className="text-xs text-muted-foreground">
                                Voice ID khusus untuk panggilan Bahasa Malaysia. Dapatkan ID dari elevenlabs.io/voice-library
                              </div>
                            </div>

                            {/* English Voice ID */}
                            <div className="space-y-2">
                              <Label htmlFor="elevenVoiceIdEN">Voice ID - English</Label>
                              <Input
                                id="elevenVoiceIdEN"
                                data-testid="input-eleven-voice-en"
                                value={currentSettings.elevenVoiceIdEN}
                                onChange={(e) => {
                                  setCurrentSettings(prev => ({ ...prev, elevenVoiceIdEN: e.target.value }));
                                  setUnsavedChanges(prev => [...prev.filter(key => key !== 'elevenVoiceIdEN'), 'elevenVoiceIdEN']);
                                }}
                                placeholder="21m00Tcm4TlvDq8ikWAM"
                                className="font-mono text-sm"
                              />
                              <div className="text-xs text-muted-foreground">
                                Voice ID khusus untuk panggilan English
                              </div>
                            </div>
                          </div>

                          <div className="p-3 border rounded-lg bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                            <div className="text-sm text-amber-700 dark:text-amber-300">
                              <div className="font-medium mb-1">💡 Tips untuk Voice Quality:</div>
                              <div>• Guna voice ID berlainan untuk setiap bahasa untuk hasil terbaik</div>
                              <div>• Test voice samples di ElevenLabs sebelum configure</div>
                              <div>• Voice models yang sama akan digunakan untuk kedua-dua bahasa jika dibiarkan kosong</div>
                            </div>
                          </div>
                        </div>

                        {/* TTS Test Buttons */}
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            onClick={() => playTestTTS()}
                            className="w-full"
                            data-testid="button-test-tts"
                          >
                            <Volume2 className="h-4 w-4 mr-2" />
                            Test Text-to-Speech Only
                          </Button>
                          
                          {currentSettings.enableSound && (
                            <Button
                              variant="default"
                              onClick={() => playTestSequence()}
                              className="w-full"
                              data-testid="button-test-full-sequence"
                            >
                              <Volume2 className="h-4 w-4 mr-2" />
                              Test Complete Calling Sequence
                            </Button>
                          )}
                        </div>
                      </>
                    )}
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