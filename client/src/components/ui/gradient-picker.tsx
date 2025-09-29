import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Palette, Wand2 } from "lucide-react";

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

export function GradientPicker({ isOpen, onClose, onApply, currentValue = "", title = "Select Gradient" }: GradientPickerProps) {
  const [customGradient, setCustomGradient] = useState(currentValue);
  const [selectedPreset, setSelectedPreset] = useState("");

  if (!isOpen) return null;

  const handlePresetSelect = (gradient: string) => {
    setSelectedPreset(gradient);
    setCustomGradient(gradient);
  };

  const handleApply = () => {
    onApply(customGradient);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-[600px] max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {title}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Tabs defaultValue="presets" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="presets" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                Preset Gradients
              </TabsTrigger>
              <TabsTrigger value="custom">Custom Gradient</TabsTrigger>
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
                      />
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="custom" className="space-y-4">
              <div className="space-y-2">
                <Label>Custom Gradient CSS</Label>
                <Input
                  value={customGradient}
                  onChange={(e) => setCustomGradient(e.target.value)}
                  placeholder="linear-gradient(45deg, #ff0000, #00ff00)"
                  className="font-mono text-sm"
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
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Current: {customGradient ? customGradient.substring(0, 40) + "..." : "None"}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleApply} disabled={!customGradient}>
                Apply Gradient
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}