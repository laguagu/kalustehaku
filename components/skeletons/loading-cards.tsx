import { Card, CardContent } from "../ui/card";

export const LoadingCards = () => (
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
  );