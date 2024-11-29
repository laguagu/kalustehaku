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
import { useQueryState } from "nuqs";

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

  const handleCategoryChange = (value: string) => {
    setCategory(value === "all" ? null : value);
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
    await Promise.all([setCategory(null), setMaterials(null), setColors(null)]);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pääkategoria */}
        <div className="space-y-2">
          <Label>Pääkategoria</Label>
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
        </div>

        {/* Materiaalit */}
        <div className="space-y-2">
          <Label>Materiaalit</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {Object.values(FurnitureMaterialEnum.enum).map((material) => (
              <div key={material} className="flex items-center space-x-2">
                <Checkbox
                  id={material}
                  checked={
                    materials ? materials.split(",").includes(material) : false
                  }
                  onCheckedChange={(checked) =>
                    handleMaterialsChange(material, checked as boolean)
                  }
                />
                <Label htmlFor={material}>
                  <span className="capitalize">{material}</span>
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Värit */}
        <div className="space-y-2">
          <Label>Värit</Label>
          <div className="space-y-2">
            {(
              Object.keys(COLOR_GROUPS_MAP) as (keyof typeof COLOR_GROUPS_MAP)[]
            ).map((colorKey) => (
              <div key={colorKey} className="flex items-center space-x-2">
                <Checkbox
                  id={colorKey}
                  checked={colors?.split(",").includes(colorKey) || false}
                  onCheckedChange={(checked) =>
                    handleColorsChange(colorKey, checked as boolean)
                  }
                />
                <Label htmlFor={colorKey}>
                  <span className="capitalize">{colorKey.toLowerCase()}</span>
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleReset}
        className="mt-4"
      >
        Tyhjennä filtterit
      </Button>
    </div>
  );
}
