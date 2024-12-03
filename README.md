# Tavaratrading Embeddings

Semanttinen hakusovellus käytetyille huonekaluille, joka hyödyntää OpenAI:n embeddings-teknologiaa ja Supabasen vektorihakua. Sovellus web-screippaa huonekalut Tavaratrading-sivustolta ja mahdollistaa sisustussuunnittelijoille tarkan semanttisen haun.

## Ominaisuudet

- 🔍 Semanttinen haku OpenAI embeddings -teknologialla
- 🤖 Automaattinen web-scraping Puppeteer-kirjastolla
- 🎯 GPT-4 Vision -pohjainen tuoteanalyysi
- 🗄️ Vektorihaku Supabasella
- 🔐 Basic Auth -suojattu API

## Teknologiat

- Next.js 15 (App Router)
- TypeScript
- OpenAI API (GPT-4o & embeddings)
- Supabase (PostgreSQL + pgvector)
- Drizzle ORM
- Puppeteer
- TailwindCSS

## Alkuun pääseminen

### Ympäristön pystytys

1. Kloonaa repositorio:

```bash
git clone https://github.com/laguagu/tavaratrading-embeddings
cd tavaratrading-embeddings
```

2. Asenna riippuvuudet:

```bash
npm install
```

3. Kopioi ympäristömuuttujat:

```bash
cp .env.example .env.local
```

4. Täytä seuraavat ympäristömuuttujat .env.local tiedostoon:

```env
OPENAI_API_KEY=            # OpenAI API avain
SUPABASE_PRIVATE_KEY=      # Supabase private key
NEXT_PUBLIC_SUPABASE_URL=  # Supabase projektin URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anon key
SCRAPER_USERNAME=          # Web scraping API:n käyttäjätunnus (Määrittele käyttäjänimi)
SCRAPER_PASSWORD=          # Web scraping API:n salasana (Määrittele salasana)
DATABASE_URL=              # PostgreSQL yhteysosoite
```

## Supabase asetukset

Supabase ympäristömuuttujat saat haettua kun olet luonut projektin [Supabase](https://supabase.com/):sta:

![Supabase ympäristömuuttujat](./public/supabase.png)

Tarvittavat ympäristömuuttujat:

- `DATABASE_URL`: Löytyy kohdasta "Database" -> "Connection string"
- `SUPABASE_PRIVATE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Löytyy kohdasta "API" -> "anon/public"
- `NEXT_PUBLIC_SUPABASE_URL`: Löytyy kohdasta "API" -> "Project URL"

### Kehitys

1. Käynnistä kehityspalvelin:

```bash
npm run dev
```

2. Avaa [http://localhost:3000](http://localhost:3000)

## Tietokannan alustus (ellei ole tehty)

### 1. PostgreSQL Laajennukset ja Indeksit

Supabasessa täytyy ensin luoda tarvittavat laajennukset ja indeksit:

```sql
-- Vektorilaajennuksen aktivointi
create extension if not exists vector;

-- HNSW-indeksi nopeaa vektorihakua varten
CREATE INDEX IF NOT EXISTS embeddingIndex
ON products
USING hnsw (embedding vector_cosine_ops);

-- Funktio semanttista hakua varten
CREATE OR REPLACE FUNCTION match_furnitures_with_filter (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter jsonb DEFAULT '{}'::jsonb
) 
RETURNS TABLE (
  id text,
  name text,
  price decimal,
  image_url text,
  product_url text,
  condition text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql AS $$
DECLARE
  color_filter jsonb := filter -> 'colors';
  metadata_filter jsonb := filter - 'colors';
BEGIN
  RETURN QUERY
  SELECT
    products.id,
    products.name,
    products.price::decimal,
    products.image_url,
    products.product_url,
    products.condition,
    products.metadata,
    1 - (products.embedding <=> query_embedding) as similarity
  FROM products
  WHERE 1 - (products.embedding <=> query_embedding) > match_threshold
    AND (
      filter = '{}'::jsonb
      OR (
        -- Tarkista muut metadata-kentät paitsi värit
            products.metadata @> metadata_filter
        AND
        -- Tarkista värit: palauta true jos yksikin väri täsmää
        (
          color_filter IS NULL
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(color_filter) AS filter_color
            WHERE filter_color IN (
              SELECT jsonb_array_elements_text(products.metadata -> 'colors')
            )
          )
        )
      )
    )
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

### 2. Drizzle migraatiot

1. Luo tietokantamigraatiot:

```bash
npm run db:generate
```

2. Aja migraatiot:

```bash
npm run db:migrate
```

3. (Valinnainen) Käynnistä Drizzle Studio tietokannan hallintaan:

```bash
npm run db:studio
```

### Web Scraping

Sovellus tukee web scraping -toiminnallisuutta API endpointin kautta:

**API endpoint** (/api/scrape):

- POST: Manuaalinen scraping valituille URL:eille
- Basic Auth -autentikointi
- Toimii vain kehitysympäristössä. Tuotannossa estetty [middleware.ts](./middleware.ts)
- Jos et anna post pyynnössä parametrejä käytetään vakioasetuksina screippaukseen.

```javascript
const urlsToProcess = options?.urls || PRODUCT_URLS;
const productsPerUrl = options?.productsPerUrl || 70;
```

#### API käyttö esimerkki:

```bash
# Manuaalinen scraping
curl -X POST http://localhost:3000/api/scrape \
  -u "username:password" \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://www.tavaratrading.com/..."], "productsPerUrl": 10}'
```

## Projektin rakenne

```
.
├── app/                # Next.js App Router
│   ├── api/           # API endpoints
│   └── page.tsx       # Päänäkymä
├── lib/               # Sovelluksen ydinlogiikka
│   ├── ai/           # OpenAI integraatiot
│   ├── db/           # Tietokantaoperaatiot
│   ├── scripts/      # Skriptit (scraper)
│   └── types.ts      # TypeScript tyypit
└── components/        # React komponentit
```

## Tietokantarakenne

Sovellus käyttää PostgreSQL:ää pgvector-laajennuksella vektorihakuun. Tietokannan schema on määritelty Drizzle ORM:llä:

```typescript
export const products = pgTable(
  "products",
  {
    uniqueId: uuid("unique_id").defaultRandom().primaryKey(),
    id: text("id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }),
    condition: text("condition"),
    imageUrl: text("image_url"),
    productUrl: text("product_url"),
    category: text("category"),
    availability: text("availability"),
    company: text("company").notNull(),
    isTestData: boolean("is_test_data").default(false),
    metadata: jsonb("metadata").$type<ProductMetadata>().notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    searchTerms: text("search_terms"),
    createdAt: timestamp("created_at").default(sql`NOW()`),
    updatedAt: timestamp("updated_at").default(sql`NOW()`),
  },
  (table) => [uniqueIndex("unique_product_source").on(table.id, table.company)],
);
```

### Tärkeimmät kentät:

- `metadata`: JSON-kenttä joka sisältää tuotteen analysoidut tiedot (tyyli, materiaalit, värit, jne.)
- `embedding`: 1536-dimensioinen vektori semanttista hakua varten

## Huomioita kehittäjille

- Tarvitset Supabase tilin
- Supabase projektin pitää tukea pgvector-laajennusta
- Tarvitset OpenAI api avaimen

## Semanttinen haku

Sovellus käyttää OpenAI:n text-embedding-3-small -mallia muuntamaan sekä tuotteet että käyttäjän hakutekstin vektoreiksi. Hakuprosessi toimii seuraavasti:

1. **Käyttäjän syöte:**

```typescript
// app/page.tsx
export default function TavaraTradingSearch() {
  async function handleSearch(formData: FormData) {
    const searchQuery = formData.get("query") as string;
    const searchResults = await searchFurniture(searchQuery, {
      minSimilarity: 0.25,
      maxResults: 6,
      filters: {}
    });
    // ...
  }
}
```

2. **Hakutekstin muuntaminen vektoriksi:**

```typescript
// app/actions.ts
export async function generateSearchEmbedding(
  searchText: string,
): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: searchText,
    encoding_format: "float",
  });
  return response.data[0].embedding;
}
```

3. **Samankaltaisuushaku tietokannasta:**

```typescript
export async function searchFurniture(
  searchQuery: string,
  options: {
    minSimilarity?: number;
    maxResults?: number;
  } = {},
) {
  const embedding = await generateSearchEmbedding(searchQuery);
  const { data } = await supabase.rpc("match_furniture", {
    query_embedding: embedding,
    match_threshold: minSimilarity,
    match_count: maxResults,
  });
  return data;
}
```

### Hakuprosessin kulku:

1. Käyttäjä kirjoittaa hakulauseen (esim. "moderni valkoinen työtuoli")
2. Hakulause muunnetaan 1536-dimensioiseksi vektoriksi OpenAI:n embeddings API:lla
3. Supabase vertaa tätä vektoria tietokannassa oleviin tuotteiden vektoreihin
4. Palautetaan samankaltaisimmat tuotteet cosine similarity -arvon perusteella
5. Tulokset järjestetään samankaltaisuuden mukaan

### Web Scraping huomiot

- Test scripteillä (`test:scraper` ja `test:pipeline`) voi testata scraping-toiminnallisuutta paikallisesti
- Käytä testeihin erillistä tietokantaa tuotantotietokannan sijaan
- Muista asettaa Basic Auth -tunnukset ympäristömuuttujiin

## Lisenssi

MIT License - katso [LICENCE](LICENCE) tiedosto lisätietoja varten.

## Sovelluksen vieminen Rahtiin

Sovelluksen tai uuden version vieminen Rahtiin onnistuu seuraamalla [pushToRahti.txt](./pushToRahti.txt) tiedostossa olevia ohjeita. Tiedosto sisältää tarvittavat komennot ja vaiheet, jotka tulee suorittaa mikäli uuden lokaalin version haluaa viedä Rahti 2 palveluun.
