import { SearchResult } from "@/app/page";
import { cn } from "@/lib/utils";
import { COLOR_HEX_MAP } from "@/lib/utils/filters-colors";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

interface ProductCardProps {
  result: SearchResult;
  isBestMatch?: boolean;
}

const ColorDot = ({ color }: { color: string }) => (
  <div
    className="w-4 h-4 rounded-full border border-border/50 shadow-sm"
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
        "overflow-hidden transition-all duration-200 group",
        "bg-card md:hover:bg-secondary/20",
        isBestMatch
          ? "ring-2 ring-primary shadow-md"
          : "border-border/50 md:hover:border-primary/50 shadow-sm md:hover:shadow-md"
      )}
    >
      <Link
        href={result.product_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full no-underline group"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted md:group-hover:bg-muted/70 transition-colors">
          {isBestMatch && (
            <div className="absolute right-0 top-0 z-20 bg-primary text-primary-foreground px-3 py-1.5 rounded-bl-lg font-medium shadow-sm">
              Paras osuma
            </div>
          )}

          <Image
            src={imgError ? "/image-not-found.png" : result.image_url}
            alt={result.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain transition-all duration-300 md:group-hover:scale-105 bg-secondary rounded-2xl p-2 "
            priority={isBestMatch}
            onError={() => setImgError(true)}
          />
          <div className="absolute left-2 right-2 z-20">
            <Badge
              variant={result.similarity > 0.8 ? "default" : "secondary"}
              className={cn(
                "shadow-sm font-bold",
                isBestMatch
                  ? "bg-primary text-primary-foreground hover:bg-primary"
                  : result.similarity > 0.7
                    ? "bg-primary/80 text-primary-foreground"
                    : "bg-secondary"
              )}
            >
              {(result.similarity * 100).toFixed(0)}% vastaavuus
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Otsikko ja hinta */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg text-foreground line-clamp-3">
                {result.name}
              </h3>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-2xl font-bold text-primary order-2 sm:order-1">
                {result.price ? `${result.price} €` : "Hinta ei saatavilla"}
              </span>
              <Badge variant="secondary" className="order-1 sm:order-2 w-fit">
                {result.metadata.mainGategory && (
                  <span className="capitalize text-base">
                    {result.metadata.mainGategory}
                  </span>
                )}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 ">
            {/* Värit */}
            {result.metadata.colors?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-md font-medium text-muted-foreground">
                  Värit
                </p>
                <div className="flex flex-wrap gap-1">
                  {result.metadata.colors.map((color) => (
                    <ColorDot key={color} color={color} />
                  ))}
                </div>
              </div>
            )}

            {/* Materiaalit */}
            {result.metadata.materials?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-md font-medium text-muted-foreground">
                  Materiaalit
                </p>
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

          {/* Tuotteen kuvaus */}
          {result.metadata.visualDescription && (
            <div className="space-y-2 py-3 tracking-tight bg-secondary/20 rounded-lg pr-3">
              <p className="text-md font-medium text-muted-foreground">
                Tekoälyn kuvaus tuotteesta:
              </p>
              <p className="text-sm text-muted-foreground line-clamp-6">
                {result.metadata.visualDescription}
              </p>
            </div>
          )}

          {/* Muut ominaisuudet */}
          <div className="flex flex-wrap gap-4">
            {/* Tyyli */}
            {(result.metadata.style || result.metadata.designStyle) && (
              <div className="space-y-1.5">
                <p className="text-md font-medium text-muted-foreground">
                  Tyyli
                </p>
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

            {/* Sopii tiloihin */}
            {result.metadata.roomType?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-md font-medium text-muted-foreground">
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
