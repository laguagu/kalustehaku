import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COLOR_GROUPS_MAP } from "@/lib/types/filters/colorGroups";
import {
  FurnitureMainCategoryEnum,
  FurnitureMaterialEnum,
} from "@/lib/types/metadata/metadata";
import { Separator } from "@radix-ui/react-select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { Armchair, Box, Info, Paintbrush, RefreshCw } from "lucide-react";
import { parseAsBoolean, useQueryState } from "nuqs";
import AiSwitch from "./filters/ai-switch";
import { Card, CardContent } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import ShineBorder from "./ui/shine-border";

export function SearchFilters() {
  const [category, setCategory] = useQueryState("cat", {
    defaultValue: "",
  });
  const [materials, setMaterials] = useQueryState("mat", {
    defaultValue: "",
  });
  const [colors, setColors] = useQueryState("col", {
    defaultValue: "",
  });
  const [isAiEnabled, setIsAiEnabled] = useQueryState(
    "ai",
    parseAsBoolean.withDefault(false),
  );

  const handleCategoryChange = (value: string) => {
    setCategory(value === "all" ? null : value);
  };

  const handleAiToggle = (enabled: boolean) => {
    setIsAiEnabled(enabled || null);
  };

  const handleMaterialsChange = (material: string, checked: boolean) => {
    const currentMaterials = new Set(
      materials ? materials.split(",").filter(Boolean) : [],
    );

    if (checked) {
      currentMaterials.add(material);
    } else {
      currentMaterials.delete(material);
    }

    setMaterials(
      currentMaterials.size > 0 ? Array.from(currentMaterials).join(",") : null,
    );
  };

  const handleColorsChange = (
    colorKey: keyof typeof COLOR_GROUPS_MAP,
    checked: boolean,
  ) => {
    const currentColors = new Set(colors?.split(",").filter(Boolean) || []);
    if (checked) {
      currentColors.add(colorKey);
    } else {
      currentColors.delete(colorKey);
    }
    const newColors = currentColors.size
      ? Array.from(currentColors).join(",")
      : null;
    setColors(newColors);
  };

  const handleReset = async (e: React.MouseEvent) => {
    e.preventDefault();
    await Promise.all([
      setCategory(null),
      setMaterials(null),
      setColors(null),
      setIsAiEnabled(null),
    ]);
  };

  const AIToggleContent = () => (
    <TooltipProvider>
      <Tooltip delayDuration={800}>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-sm font-bold font-secondary text-muted-foreground whitespace-nowrap group-hover:text-muted-foreground/80">
              Automaattiset kategoriat
            </span>
            <AiSwitch isEnabled={isAiEnabled} onToggle={handleAiToggle} />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-[250px] bg-background border border-gray-200 shadow-md p-3 rounded-lg">
          <p className="text-sm text-gray-700">
            Kun päällä, tekoäly valitsee kuvauksesi perusteella sopivimmat
            kategoriat automaattisesti.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const FilterHeader = ({
    label,
    icon,
    tooltip,
  }: {
    label: string;
    icon: React.ReactNode;
    tooltip: string;
  }) => (
    <div className="flex items-center gap-2 p-2">
      <div className="flex items-center gap-2 flex-1">
        {icon}
        <Label className="font-medium">{label}</Label>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="hidden md:block h-4 w-4 text-gray-500 hover:text-gray-900 cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="bg-white border border-gray-200 shadow-md p-3 rounded-lg">
            <p className="max-w-xs text-gray-700">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pääkategoria */}
        <Card>
          <FilterHeader
            label="Pääkategoria"
            icon={<Armchair className="h-5 w-5 text-gray-600" />}
            tooltip="Valitse yksi pääkategoria rajataksesi hakutuloksia. Huonekalun tulee kuulua valittuun kategoriaan."
          />
          <Separator />
          <CardContent className="pt-4">
            <Select
              value={category ?? "all"}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Valitse kategoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Kaikki kategoriat</SelectItem>
                {Object.values(FurnitureMainCategoryEnum.enum).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    <span className="capitalize">{cat}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Materiaalit */}
        <Card>
          <FilterHeader
            label="Materiaalit"
            icon={<Box className="h-5 w-5 text-gray-600" />}
            tooltip="Valitse materiaalit, joita huonekalussa tulee olla. Huonekalun täytyy sisältää KAIKKI valitsemasi materiaalit näkyäkseen tuloksissa."
          />
          <Separator />
          <CardContent className="pt-4">
            <ScrollArea className="h-48 rounded-md">
              <div className="pr-4">
                {Object.values(FurnitureMaterialEnum.enum).map(
                  (material, index) => (
                    <div key={material}>
                      {index > 0 && <Separator className="my-2" />}
                      <div className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={material}
                          checked={
                            materials
                              ? materials.split(",").includes(material)
                              : false
                          }
                          onCheckedChange={(checked) =>
                            handleMaterialsChange(material, checked as boolean)
                          }
                        />
                        <Label htmlFor={material} className="flex-1">
                          <span className="capitalize">{material}</span>
                        </Label>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Värit */}
        <Card>
          <FilterHeader
            label="Värit"
            icon={<Paintbrush className="h-5 w-5 text-gray-600" />}
            tooltip="Valitse värit, joita haluat huonekalussa olevan. Huonekalun riittää sisältää YKSIKIN valitsemistasi väriryhmistä näkyäkseen tuloksissa."
          />
          <Separator />
          <CardContent className="pt-4">
            <ScrollArea className="md:h-48 h-auto rounded-md">
              <div className="pr-4">
                {(
                  Object.keys(
                    COLOR_GROUPS_MAP,
                  ) as (keyof typeof COLOR_GROUPS_MAP)[]
                ).map((colorKey, index) => (
                  <div key={colorKey}>
                    {index > 0 && <Separator className="my-2" />}
                    <div className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={colorKey}
                        checked={colors?.split(",").includes(colorKey) || false}
                        onCheckedChange={(checked) =>
                          handleColorsChange(colorKey, checked as boolean)
                        }
                      />
                      <Label htmlFor={colorKey} className="flex-1">
                        <span className="capitalize">
                          {colorKey.toLowerCase()}
                        </span>
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <div className="md:flex md:flex-row flex-col space-y-6 justify-between items-center">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          className="mt-4 gap-2 w-full md:w-auto"
        >
          <RefreshCw className="h-4 w-4" />
          Tyhjennä valinnat
        </Button>

        <div className="h-[68px] flex items-center justify-center">
          {isAiEnabled ? (
            <ShineBorder
              borderRadius={12}
              borderWidth={1}
              duration={30}
              color={["#6366f1", "#8b5cf6"]}
              className="p-3 min-w-0 w-auto bg-background"
            >
              <AIToggleContent />
            </ShineBorder>
          ) : (
            <div className="rounded-xl border bg-background p-3 hover:border-primary/50 hover:shadow-sm transition-all duration-300">
              <AIToggleContent />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
