import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { X, Plus, Palette, Wand2 } from "lucide-react";

interface ColorStop {
  color: string;
  position: number;
}

interface GradientPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (gradient: string) => void;
  title: string;
  currentValue?: string;
}

const gradientCategories = {
  ocean: {
    name: "Ocean",
    gradients: [
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
    ]
  },
  sunset: {
    name: "Sunset",
    gradients: [
      "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
      "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
      "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
    ]
  },
  cool: {
    name: "Cool",
    gradients: [
      "linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)",
      "linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)",
      "linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)",
      "linear-gradient(135deg, #fd79a8 0%, #00b894 100%)"
    ]
  },
  warm: {
    name: "Warm",
    gradients: [
      "linear-gradient(135deg, #fdcb6e 0%, #e84393 100%)",
      "linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)",
      "linear-gradient(135deg, #e84393 0%, #f39c12 100%)",
      "linear-gradient(135deg, #00b894 0%, #fdcb6e 100%)"
    ]
  }
};

export function GradientPicker({ isOpen, onClose, onApply, title, currentValue }: GradientPickerProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [customGradient, setCustomGradient] = useState<string>(currentValue || "");
  const [gradientDirection, setGradientDirection] = useState<string>("45deg");
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

  if (!isOpen) return null;

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
      <DialogContent className="w-[600px] max-w-[90vw] max-h-[80vh] flex flex-col" data-testid="dialog-gradient-picker">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Choose from preset gradients or create custom gradients using the visual builder or CSS code.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto flex-1 min-h-0">
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
                            : "border-border hover:border-primary/50"
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
                        <SelectItem value="0deg">↑ Top (0°)</SelectItem>
                        <SelectItem value="45deg">↗ Top Right (45°)</SelectItem>
                        <SelectItem value="90deg">→ Right (90°)</SelectItem>
                        <SelectItem value="135deg">↘ Bottom Right (135°)</SelectItem>
                        <SelectItem value="180deg">↓ Bottom (180°)</SelectItem>
                        <SelectItem value="225deg">↙ Bottom Left (225°)</SelectItem>
                        <SelectItem value="270deg">← Left (270°)</SelectItem>
                        <SelectItem value="315deg">↖ Top Left (315°)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Live Preview */}
                  <div className="space-y-2">
                    <Label>Live Preview</Label>
                    <div 
                      className="h-16 rounded-md border"
                      style={{ background: generateGradientCSS() }}
                      data-testid="gradient-preview"
                    />
                  </div>

                  {/* Color Stops */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Color Stops</Label>
                      <Button 
                        size="sm" 
                        onClick={addColorStop}
                        disabled={colorStops.length >= 10}
                        data-testid="button-add-color-stop"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Color
                      </Button>
                    </div>
                    
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {colorStops.map((stop, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-md" data-testid={`color-stop-${index}`}>
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              type="color"
                              value={stop.color}
                              onChange={(e) => updateColorStop(index, "color", e.target.value)}
                              className="w-12 h-8 p-1 border rounded"
                              data-testid={`color-picker-${index}`}
                            />
                            <Input
                              type="text"
                              value={stop.color}
                              onChange={(e) => updateColorStop(index, "color", e.target.value)}
                              className="flex-1 font-mono text-sm"
                              placeholder="#FF0000"
                              data-testid={`color-input-${index}`}
                            />
                          </div>
                          
                          <div className="flex items-center gap-2 w-24">
                            <Slider
                              value={[stop.position]}
                              onValueChange={(value) => updateColorStop(index, "position", value[0])}
                              max={100}
                              step={1}
                              className="flex-1"
                              data-testid={`position-slider-${index}`}
                            />
                            <span className="text-xs w-8 text-muted-foreground">{stop.position}%</span>
                          </div>
                          
                          {colorStops.length > 2 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeColorStop(index)}
                              className="p-1 h-8 w-8 text-destructive hover:text-destructive"
                              data-testid={`remove-color-stop-${index}`}
                            >
                              <X className="h-4 w-4" />
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
        </div>
        
        {/* Footer with Apply button - always visible */}
        <div className="flex justify-between items-center pt-4 border-t flex-shrink-0 bg-background">
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
      </DialogContent>
    </Dialog>
  );
}