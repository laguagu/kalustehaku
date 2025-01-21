import { SupabaseProduct } from "@/lib/types/search/types";
import { cn } from "@/lib/utils";
import { COLOR_HEX_MAP } from "@/lib/utils/filters-colors";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

interface ProductCardProps {
  result: SupabaseProduct;
  isBestMatch?: boolean;
}

const ColorDot = ({ color }: { color: string }) => (
  <div
    className="w-4 h-4 rounded-full border-2 border-border/50 shadow-sm"
    style={{
      background:
        COLOR_HEX_MAP[color as keyof typeof COLOR_HEX_MAP] || "#808080",
    }}
    aria-label={color}
  />
);
export function ProductCard({ result, isBestMatch }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200 group p-1",
        "bg-background/80 backdrop-blur-sm hover:bg-background ",
        isBestMatch
          ? "ring-2 ring-primary shadow-md"
          : "border-2 hover:border-primary/50 shadow-sm hover:shadow-md",
      )}
    >
      <Link
        href={result.product_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full no-underline group"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl transition-colors">
          {isBestMatch && (
            <div className="absolute right-0 top-0 z-20 bg-primary text-primary-foreground px-3 py-1.5 rounded-bl-lg font-medium shadow-sm">
              Paras osuma
            </div>
          )}

          <Image
            src={imgError ? "/placeholder.svg" : result.image_url}
            alt={result.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-all duration-300 group-hover:scale-105 p-2 rounded-2xl"
            priority={isBestMatch}
            onError={() => setImgError(true)}
          />
        </div>

        <CardContent className="p-4 space-y-4">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2 border-b pb-1">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-foreground line-clamp-3">
                  {result.name}
                </h3>
                <p className="text-sm text-muted-foreground pb-1">
                  {result.company?.replace("-", " ")}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-2xl font-bold text-primary order-2 sm:order-1">
                {result.price ? `${result.price} €` : "Hinta ei saatavilla"}
              </span>
              {result.metadata.mainGategory && (
                <Badge variant="secondary" className="order-1 sm:order-2 w-fit">
                  <span className="capitalize text-base">
                    {result.metadata.mainGategory}
                  </span>
                </Badge>
              )}
            </div>
          </div>

          {result.metadata.visualDescription && (
            <div className="relative">
              <div className="space-y-2 p-4 bg-secondary rounded-lg border border-blue-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <p className="text-sm font-medium text-black">
                    Tekoälyn kuvaus tuotteesta:
                  </p>
                </div>
                <p className="text-sm text-muted-foreground tracking-tight line-clamp-10 ">
                  {result.metadata.visualDescription}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            {result.metadata.colors && result.metadata.colors.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-black">Värit</p>
                <div className="flex flex-wrap gap-1">
                  {result.metadata.colors.map((color) => (
                    <ColorDot key={color} color={color} />
                  ))}
                </div>
              </div>
            )}

            {result.metadata.materials &&
              result.metadata.materials.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-black">Materiaalit</p>
                  <div className="flex flex-wrap gap-1">
                    {result.metadata.materials.map((material, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="capitalize text-xs"
                      >
                        {material}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Muut ominaisuudet */}
          <div className="flex flex-col flex-wrap gap-4">
            {/* Tyyli */}
            {(result.metadata.style || result.metadata.designStyle) && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-black">Tyyli</p>
                <div className="flex flex-wrap gap-1">
                  {result.metadata.style && (
                    <Badge variant="secondary" className="capitalize text-xs">
                      {result.metadata.style}
                    </Badge>
                  )}
                  {result.metadata.designStyle && (
                    <Badge variant="secondary" className="capitalize text-xs">
                      {result.metadata.designStyle}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {result.metadata.roomType &&
              result.metadata.roomType.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-black">
                    Sopii tiloihin
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result.metadata.roomType.map((room, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="capitalize text-xs"
                      >
                        {room}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
