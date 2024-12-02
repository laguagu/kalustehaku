"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface AiSwitchProps {
  isEnabled?: boolean;
  onToggle?: (value: boolean) => void;
}

export default function AiSwitch({
  isEnabled = false,
  onToggle,
}: AiSwitchProps) {
  const [checked, setChecked] = useState(isEnabled);

  useEffect(() => {
    setChecked(isEnabled);
  }, [isEnabled]);

  const handleChange = (newChecked: boolean) => {
    setChecked(newChecked);
    setTimeout(() => {
      onToggle?.(newChecked);
    }, 150);
  };

  return (
    <div>
      <div className="relative inline-grid h-8 w-[120px] grid-cols-[1fr_1fr] items-center text-sm font-medium rounded-lg bg-secondary">
        <Switch
          id="ai-switch"
          checked={checked}
          onCheckedChange={handleChange}
          className="peer absolute inset-0 h-[inherit] w-auto rounded-lg data-[state=unchecked]:bg-background/30 [&_span]:z-10 [&_span]:h-full [&_span]:w-1/2 [&_span]:rounded-md [&_span]:will-change-transform [&_span]:transition-transform [&_span]:duration-200 data-[state=checked]:[&_span]:translate-x-full rtl:data-[state=checked]:[&_span]:-translate-x-full"
        />
        <span className="flex pointer-events-none relative ms-0.5 items-center justify-center px-2 text-center will-change-transform transition-all duration-200 peer-data-[state=checked]:opacity-0 peer-data-[state=unchecked]:translate-x-full rtl:peer-data-[state=unchecked]:-translate-x-full">
          <Sparkles className="h-4 w-4 text-foreground" />
        </span>
        <span className="flex pointer-events-none relative me-0.5 items-center justify-center px-2 text-center will-change-transform transition-all duration-200 peer-data-[state=unchecked]:opacity-0 peer-data-[state=checked]:-translate-x-full peer-data-[state=checked]:text-primary-foreground rtl:peer-data-[state=checked]:translate-x-full">
          <span className="font-secondary">Päällä</span>
        </span>
      </div>
      <Label htmlFor="ai-switch" className="sr-only">
        Tekoälyn automaattinen valinta
      </Label>
    </div>
  );
}
