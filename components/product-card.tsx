import { SearchResult } from "@/app/page";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

interface ProductCardProps {
  result: SearchResult;
  isBestMatch?: boolean;
}

export function ProductCard({ result, isBestMatch }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200 group",
        "bg-card hover:bg-secondary/20",
        isBestMatch
          ? "ring-2 ring-primary shadow-md"
          : "border-border/50 hover:border-primary/50 shadow-sm hover:shadow-md",
      )}
    >
      <Link
        href={result.product_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full no-underline group"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted group-hover:bg-muted/70 transition-colors">
          {isBestMatch && (
            <div className="absolute left-0 top-0 z-20 bg-primary text-primary-foreground px-3 py-1.5 rounded-br-lg font-medium shadow-sm">
              Paras osuma
            </div>
          )}

          <Image
            src={imgError ? "/image-not-found.png" : result.image_url}
            alt={result.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain transition-all duration-300 group-hover:scale-105 rounded-xl p-2"
            priority={isBestMatch}
            onError={() => setImgError(true)}
          />
          <div className="absolute top-2 right-2 z-20">
            <Badge
              variant={result.similarity > 0.8 ? "default" : "secondary"}
              className={cn(
                "shadow-sm font-bold",
                isBestMatch
                  ? "bg-primary text-primary-foreground"
                  : result.similarity > 0.7
                    ? "bg-primary/80 text-primary-foreground"
                    : "bg-secondary",
              )}
            >
              {(result.similarity * 100).toFixed(0)}% vastaavuus
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Otsikko, kategoria ja hinta */}
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

          {/* Tuotteen kuvaus */}
          {result.metadata.visualDescription && (
            <div className="space-y-2 py-3 tracking-tight bg-secondary/20 rounded-lg">
              <p className="text-sm font-semibold text-muted-foreground">
                Tekoälyn kuvaus tuotteesta:
              </p>
              <p className="text-sm text-muted-foreground line-clamp-8">
                {result.metadata.visualDescription}
              </p>
            </div>
          )}

          {/* Tyyli ja design */}
          {(result.metadata.style || result.metadata.designStyle) && (
            <div className="space-y-2">
              <p className="text-sm font-semibold  text-muted-foreground">
                Tyyli ja design
              </p>
              <div className="flex flex-wrap gap-1.5">
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

          {/* Materiaalit */}
          {result.metadata.materials?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground ">
                Materiaalit
              </p>
              <div className="flex flex-wrap gap-1.5">
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

          {/* Ominaisuudet */}
          {result.metadata.functionalFeatures?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">
                Ominaisuudet
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.metadata.functionalFeatures.map((feature, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="capitalize text-xs"
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Sopii tiloihin */}
          {result.metadata.roomType?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">
                Sopii tiloihin
              </p>
              <div className="flex flex-wrap gap-1.5">
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
        </CardContent>
      </Link>
    </Card>
  );
}
