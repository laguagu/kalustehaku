import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert } from "@/components/ui/alert";

export function SearchInfo() {
  return (
    <Alert className="bg-blue-50 border-blue-200">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="search-info" className="border-none">
          <AccordionTrigger className="p-0 hover:no-underline text-blue-900 font-medium">
            Näin älykäs hakumme toimii
          </AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-4 space-y-1 mt-2 text-muted-foreground">
              <li>
                Tekoäly analysoi hakusanasi ja vertaa sitä tietokantamme
                tuotteisiin. Haku perustuu tuotteiden ominaisuuksiin ja
                kuvauksiin - ei tuotemerkkeihin tai malleihin.
              </li>
              <li>
                Koska kyseessä on testiversio, tuotevalikoima on vielä
                rajallinen. Hakiessasi voit kuvailla esimerkiksi tuotteen
                tyyliä, väriä, materiaalia tai käyttötarkoitusta.
              </li>
              <li>
                Näytämme 6 parhaiten vastaavaa tuotetta vastaavuusprosentin
                kanssa. 100% tarkoittaa täydellistä osumaa, 40% heikointa
                mahdollista näytettävää osumaa.
              </li>
              <li>
                Vihreällä korostettu tuote on parhaiten hakuasi vastaava osuma
                tämänhetkisestä valikoimastamme.
              </li>
              <li>
                Jos hakemaasi tuotetta ei löydy suoraan, näytämme samankaltaisia
                vaihtoehtoja. Listan viimeiset tulokset voivat poiketa haustasi
                merkittävästi johtuen rajallisesta tuotevalikoimastamme.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Alert>
  );
}
