# Factuurtemplate (A4)

Deze repo bevat een printvriendelijke A4 factuurtemplate die qua layout overeenkomt met het voorbeeld. Je kunt voorbeelddata aanpassen en een PDF genereren of een statische HTML publiceren.

## Installatie

```bash
npm install
```

Installeer vervolgens de browser binaries voor Playwright:

```bash
npx playwright install
```

## PDF renderen

```bash
npm run render
```

De output staat in `./out/factuur.pdf` en de gerenderde HTML in `./out/factuur.html`.

## Online zetten (GitHub Pages)

Genereer een statische HTML preview in de `docs/` map:

```bash
npm run build
```

Commit vervolgens `docs/` en zet GitHub Pages op `main` (of de gekozen branch) met de folder `/docs` als source. De pagina wordt dan gepubliceerd als statische factuurvoorbeeld.

## Data vervangen

Pas `sample-data.json` aan. Velden zoals BTW-percentage, items en adresgegevens worden automatisch ingelezen.

Belangrijke velden:
- `invoice.number`, `invoice.date`, `invoice.payment_term_days`
- `bill_to.*` (factuuradres)
- `trip.*` (reisgegevens)
- `vat.percentage`
- `items[]` met `description`, `subline`, `quantity`, `unit`, `price`, `commission`

Bij het renderen worden bedragen automatisch geformatteerd in NL-notatie met €.
