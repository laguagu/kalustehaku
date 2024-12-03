import { Card, CardContent } from "../ui/card";

export const LoadingCards = () => (
  <div className="bg-zinc-50 rounded-2xl md:border-2 shadow-lg md:py-6 md:px-12 px-2 py-2 space-y-6">
    <div className="hidden md:block space-y-2">
      <div className="h-8 bg-gray-200 rounded w-72 animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-[18.5rem] animate-pulse" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <div className="aspect-[4/3] bg-gray-200" />
          <CardContent className="p-4 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);
