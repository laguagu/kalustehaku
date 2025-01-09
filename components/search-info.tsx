import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert } from "@/components/ui/alert";

export function SearchInfo() {
  return (
    <Alert className="bg-background border border-primary/20">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="search-info" className="border-none ">
          <AccordionTrigger className="p-0 hover:no-underline text-blue-900 font-medium ">
            Vinkkejä hakuun
          </AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-4 space-y-1 mt-2 text-muted-foreground">
              <li>
                Tekoäly ymmärtää luonnollista kieltä - voit kuvailla etsimääsi
                huonekalua vapaasti (esim. &quot;Väriltään valkoinen
                toimistopöytä&quot;)
              </li>
              <li>
                Rajaa hakutuloksia käyttämällä filttereitä kategorian,
                materiaalien ja värien mukaan
              </li>
              <li>
                Jos hakemaasi tuotetta ei löydy suoraan, näytämme samankaltaisia
                vaihtoehtoja. Listan viimeiset tulokset voivat poiketa haustasi
                johtuen rajallisesta tuotevalikoimastamme.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Alert>
  );
}
