import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Palette, Wand2, Plus, Trash2 } from "lucide-react";

interface GradientPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (gradient: string) => void;
  currentValue?: string;
  title?: string;
}

// Predefined gradient categories with visual appeal
const gradientCategories = {
  calling: {
    name: "Calling Gradients",
    gradients: [
      "linear-gradient(45deg, #3b82f6, #1d4ed8)",
      "linear-gradient(90deg, #06b6d4, #0891b2)", 
      "linear-gradient(135deg, #8b5cf6, #7c3aed)",
      "linear-gradient(180deg, #10b981, #059669)",
      "linear-gradient(225deg, #2563eb, #1e40af)",
      "linear-gradient(270deg, #0ea5e9, #0284c7)",
      "linear-gradient(315deg, #a855f7, #9333ea)",
      "linear-gradient(360deg, #16a34a, #15803d)"
    ]
  },
  highlight: {
    name: "Highlight Gradients", 
    gradients: [
      "linear-gradient(45deg, #ef4444, #dc2626)",
      "linear-gradient(90deg, #f59e0b, #d97706)",
      "linear-gradient(135deg, #ec4899, #db2777)",
      "linear-gradient(180deg, #f97316, #ea580c)",
      "linear-gradient(225deg, #e11d48, #be185d)",
      "linear-gradient(270deg, #eab308, #ca8a04)",
      "linear-gradient(315deg, #f43f5e, #e11d48)",
      "linear-gradient(360deg, #fb923c, #f97316)"
    ]
  },
  aurora: {
    name: "Aurora Collection",
    gradients: [
      "linear-gradient(45deg, #a855f7, #06b6d4, #10b981)",
      "linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6)",
      "linear-gradient(135deg, #f59e0b, #ef4444, #ec4899)",
      "linear-gradient(180deg, #10b981, #06b6d4, #8b5cf6)",
      "linear-gradient(225deg, #3b82f6, #a855f7, #ec4899)",
      "linear-gradient(270deg, #8b5cf6, #ec4899, #f59e0b)",
      "linear-gradient(315deg, #06b6d4, #10b981, #f59e0b)",
      "linear-gradient(360deg, #ef4444, #3b82f6, #10b981)"
    ]
  },
  metallic: {
    name: "Metallic & Professional", 
    gradients: [
      "linear-gradient(45deg, #6b7280, #4b5563)",
      "linear-gradient(90deg, #64748b, #475569)",
      "linear-gradient(135deg, #78716c, #57534e)",
      "linear-gradient(180deg, #71717a, #52525b)",
      "linear-gradient(225deg, #9ca3af, #6b7280)",
      "linear-gradient(270deg, #94a3b8, #64748b)",
      "linear-gradient(315deg, #a8a29e, #78716c)",
      "linear-gradient(360deg, #a1a1aa, #71717a)"
    ]
  },
  background: {
    name: "Background Styles",
    gradients: [
      "linear-gradient(45deg, #ffffff, #f8fafc)",
      "linear-gradient(90deg, #f1f5f9, #e2e8f0)",
      "linear-gradient(135deg, #fef7cd, #fef3c7)",
      "linear-gradient(180deg, #dcfce7, #bbf7d0)",
      "linear-gradient(225deg, #fce7f3, #fbcfe8)",
      "linear-gradient(270deg, #dbeafe, #bfdbfe)",
      "linear-gradient(315deg, #ede9fe, #ddd6fe)",
      "linear-gradient(360deg, #ecfdf5, #d1fae5)"
    ]
  }
};

interface ColorStop {
  color: string;
  position: number;
}

export function GradientPicker({ isOpen, onClose, onApply, currentValue = "", title = "Select Gradient" }: GradientPickerProps) {
  const [customGradient, setCustomGradient] = useState(currentValue);
  const [selectedPreset, setSelectedPreset] = useState("");
  
  // Visual gradient builder state
  const [gradientDirection, setGradientDirection] = useState("45deg");
  const [colorStops, setColorStops] = useState<ColorStop[]>([
    { color: "#ff0000", position: 0 },
    { color: "#00ff00", position: 100 }
  ]);

  // Helper functions defined first
  const generateGradientCSS = (stops = colorStops, direction = gradientDirection) => {
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const stopStrings = sortedStops.map(stop => `${stop.color} ${stop.position}%`);
    return `linear-gradient(${direction}, ${stopStrings.join(", ")})`;
  };

  const updateCustomGradientFromVisual = (stops = colorStops, direction = gradientDirection) => {
    const generatedCSS = generateGradientCSS(stops, direction);
    setCustomGradient(generatedCSS);
  };

  // Parse CSS gradient to populate visual builder (basic implementation)
  const parseGradientToVisual = (gradient: string) => {
    try {
      // Simple regex to extract direction and colors from linear-gradient
      const directionMatch = gradient.match(/linear-gradient\(([^,]+),/);
      const colorMatches = gradient.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\)|rgba\([^)]+\)/g);
      
      if (directionMatch) {
        const direction = directionMatch[1].trim();
        if (direction.includes('deg')) {
          setGradientDirection(direction);
        }
      }
      
      if (colorMatches && colorMatches.length >= 2) {
        const newStops = colorMatches.map((color, index) => ({
          color: color,
          position: Math.round((index / (colorMatches.length - 1)) * 100)
        }));
        setColorStops(newStops);
      }
    } catch (error) {
      console.log('Could not parse gradient for visual builder:', error);
      // Keep default visual builder state if parsing fails
    }
  };

  if (!isOpen) return null;

  // Initialize visual builder from current value when dialog opens
  useEffect(() => {
    if (isOpen && currentValue) {
      setCustomGradient(currentValue);
      parseGradientToVisual(currentValue);
    }
  }, [isOpen, currentValue]);

  // Initialize custom gradient from visual builder on mount
  useEffect(() => {
    updateCustomGradientFromVisual();
  }, []);

  const handlePresetSelect = (gradient: string) => {
    setSelectedPreset(gradient);
    setCustomGradient(gradient);
    parseGradientToVisual(gradient);
  };

  // Visual gradient builder functions
  const addColorStop = () => {
    const newPosition = colorStops.length > 0 ? Math.max(...colorStops.map(s => s.position)) + 20 : 50;
    const updated = [...colorStops, { color: "#0000ff", position: Math.min(newPosition, 100) }];
    setColorStops(updated);
    // Auto-sync to CSS tab
    updateCustomGradientFromVisual(updated, gradientDirection);
  };

  const removeColorStop = (index: number) => {
    if (colorStops.length > 2) { // Keep at least 2 color stops
      const updated = colorStops.filter((_, i) => i !== index);
      setColorStops(updated);
      // Auto-sync to CSS tab
      updateCustomGradientFromVisual(updated, gradientDirection);
    }
  };

  const updateColorStop = (index: number, field: keyof ColorStop, value: string | number) => {
    const updated = colorStops.map((stop, i) => 
      i === index ? { ...stop, [field]: value } : stop
    );
    setColorStops(updated);
    // Auto-sync to CSS tab
    updateCustomGradientFromVisual(updated, gradientDirection);
  };

  // Update CSS when direction changes
  const handleDirectionChange = (newDirection: string) => {
    setGradientDirection(newDirection);
    updateCustomGradientFromVisual(colorStops, newDirection);
  };


  const handleApply = () => {
    onApply(customGradient);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[600px] max-w-[90vw] max-h-[80vh] overflow-hidden" data-testid="dialog-gradient-picker">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Choose from preset gradients or create custom gradients using the visual builder or CSS code.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto">
          <Tabs defaultValue="presets" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="presets" className="flex items-center gap-2" data-testid="tab-preset-gradients">
                <Wand2 className="h-4 w-4" />
                Preset Gradients
              </TabsTrigger>
              <TabsTrigger value="custom" data-testid="tab-custom-gradient">Custom Gradient</TabsTrigger>
            </TabsList>
            
            <TabsContent value="presets" className="space-y-4 max-h-[400px] overflow-y-auto">
              {Object.entries(gradientCategories).map(([key, category]) => (
                <div key={key} className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">{category.name}</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {category.gradients.map((gradient, index) => (
                      <button
                        key={index}
                        className={`h-12 rounded-md border-2 transition-all hover:scale-105 ${
                          selectedPreset === gradient 
                            ? "border-primary ring-2 ring-primary/20" 
                            : "border-muted hover:border-primary/50"
                        }`}
                        style={{ background: gradient }}
                        onClick={() => handlePresetSelect(gradient)}
                        title={gradient}
                        data-testid={`preset-gradient-${key}-${index}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="custom" className="space-y-4">
              <Tabs defaultValue="visual" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="visual" data-testid="tab-visual-builder">Visual Builder</TabsTrigger>
                  <TabsTrigger value="css" data-testid="tab-css-code">CSS Code</TabsTrigger>
                </TabsList>
                
                <TabsContent value="visual" className="space-y-4">
                  {/* Direction Selector */}
                  <div className="space-y-2">
                    <Label>Gradient Direction</Label>
                    <Select value={gradientDirection} onValueChange={handleDirectionChange}>
                      <SelectTrigger data-testid="select-gradient-direction">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="45deg">↗ Top Right (45°)</SelectItem>
                        <SelectItem value="90deg">→ Right (90°)</SelectItem>
                        <SelectItem value="135deg">↘ Bottom Right (135°)</SelectItem>
                        <SelectItem value="180deg">↓ Bottom (180°)</SelectItem>
                        <SelectItem value="225deg">↙ Bottom Left (225°)</SelectItem>
                        <SelectItem value="270deg">← Left (270°)</SelectItem>
                        <SelectItem value="315deg">↖ Top Left (315°)</SelectItem>
                        <SelectItem value="0deg">↑ Top (0°)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Live Preview */}
                  <div className="space-y-2">
                    <Label>Live Preview</Label>
                    <div 
                      className="h-16 rounded-md border"
                      style={{ background: generateGradientCSS() }}
                    />
                  </div>

                  {/* Color Stops */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Colors</Label>
                      <Button size="sm" variant="outline" onClick={addColorStop} data-testid="button-add-color">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Color
                      </Button>
                    </div>
                    
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {colorStops.map((stop, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                          <Input
                            type="color"
                            value={stop.color}
                            onChange={(e) => updateColorStop(index, 'color', e.target.value)}
                            className="w-12 h-8 p-1 border rounded"
                            data-testid={`color-stop-${index}`}
                          />
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">Position: {stop.position}%</Label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={stop.position}
                              onChange={(e) => updateColorStop(index, 'position', parseInt(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              data-testid={`position-stop-${index}`}
                            />
                          </div>
                          {colorStops.length > 2 && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => removeColorStop(index)}
                              data-testid={`remove-stop-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visual builder automatically syncs to CSS tab */}
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    💡 Changes are automatically synced to CSS tab. Use the Apply button below to save your gradient.
                  </div>
                </TabsContent>

                <TabsContent value="css" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Custom Gradient CSS</Label>
                    <Input
                      value={customGradient}
                      onChange={(e) => setCustomGradient(e.target.value)}
                      placeholder="linear-gradient(45deg, #ff0000, #00ff00)"
                      className="font-mono text-sm"
                      data-testid="input-custom-gradient"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter CSS gradient syntax like: linear-gradient(45deg, #start, #end)
                    </p>
                  </div>
                  
                  {customGradient && (
                    <div className="space-y-2">
                      <Label>Preview</Label>
                      <div 
                        className="h-16 rounded-md border"
                        style={{ 
                          background: customGradient.includes('gradient') ? customGradient : `linear-gradient(45deg, ${customGradient}, ${customGradient})`
                        }}
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Current: {customGradient ? customGradient.substring(0, 40) + "..." : "None"}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} data-testid="button-gradient-cancel">
                Cancel
              </Button>
              <Button onClick={handleApply} disabled={!customGradient} data-testid="button-gradient-apply">
                Apply Gradient
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}