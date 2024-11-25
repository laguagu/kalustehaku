import { SearchResult } from "@/app/page";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

interface ProductCardProps {
  result: SearchResult;
  isBestMatch?: boolean;
}

export function ProductCard({ result, isBestMatch }: ProductCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200",
        "bg-white hover:bg-gray-50",
        isBestMatch
          ? "ring-2 ring-green-500 shadow-md"
          : "shadow-sm hover:shadow-md",
      )}
    >
      <Link
        href={result.product_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full no-underline group"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50">
          {isBestMatch && (
            <div className="absolute left-0 top-0 z-20 bg-green-500 text-white px-3 py-1 rounded-br-lg font-medium">
              Paras osuma
            </div>
          )}

          <Image
            src={result.image_url}
            alt={result.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain transition-transform duration-300 group-hover:scale-105 rounded-xl"
            priority={isBestMatch}
          />

          {/* <div className="absolute top-2 right-2 z-20">
            <Badge
              variant={result.similarity > 0.8 ? "default" : "secondary"}
              className={cn("shadow-sm", isBestMatch && "bg-green-500")}
            >
              {(result.similarity * 100).toFixed(0)}% vastaavuus
            </Badge>
          </div> */}
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Otsikko, kategoria ja hinta */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg line-clamp-3">
                {result.name}
              </h3>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-green-600">
                {result.price ? `${result.price} €` : "Hinta ei saatavilla"}
              </span>
              <Badge
                variant={result.similarity > 0.8 ? "default" : "secondary"}
                className={cn(
                  "shadow-sm whitespace-nowrap",
                  isBestMatch && "bg-green-500",
                )}
              >
                {result.metadata.category && (
                  <span className="capitalize">{result.metadata.category}</span>
                )}
              </Badge>
            </div>
          </div>

          {/* Tuotteen kuvaus */}
          {result.metadata.visualDescription && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-black">
                Tekoälyn kuvaus tuotteesta:
              </p>
              <p className="text-sm text-gray-600 line-clamp-8">
                {result.metadata.visualDescription}
              </p>
            </div>
          )}

          {/* Tyyli ja design */}
          {(result.metadata.style || result.metadata.designStyle) && (
            <div className="flex flex-wrap gap-2">
              {result.metadata.style && (
                <Badge variant="secondary">{result.metadata.style}</Badge>
              )}
              {result.metadata.designStyle && (
                <Badge variant="secondary">{result.metadata.designStyle}</Badge>
              )}
            </div>
          )}

          {/* Materiaalit */}
          {result.metadata.materials?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Materiaalit</p>
              <div className="flex flex-wrap gap-1">
                {result.metadata.materials.map((material, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-50 px-2 py-1 rounded-full"
                  >
                    {material}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ominaisuudet */}
          {result.metadata.functionalFeatures?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Ominaisuudet</p>
              <div className="flex flex-wrap gap-1">
                {result.metadata.functionalFeatures.map((feature, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-50 px-2 py-1 rounded-full"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sopii tiloihin */}
          {result.metadata.roomType?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">
                Sopii tiloihin
              </p>
              <div className="flex flex-wrap gap-1">
                {result.metadata.roomType.map((room, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs bg-green-50"
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
