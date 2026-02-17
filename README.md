# JVW Infraservice website

Deze repository bevat de statische website van **JVW Infraservice** met de volgende publieke pagina’s:

- `index.html` (home)
- `projecten.html`
- `bedrijfsgegevens.html`
- `privacybeleid.html`
- `cookiebeleid.html`

Daarnaast is er een aparte statistiekpagina:

- `bezoekers.html` (niet geïndexeerd via `noindex` + `robots.txt` uitsluiting)

## Structuur

- `images/` — logo’s en geoptimaliseerde webafbeeldingen
- `assets/` — Tailwind CSS en bezoekersscript
- `vendor/` — lokale vendorbestanden (o.a. Font Awesome/Tailwind runtime)
- `.github/workflows/static.yml` — GitHub Pages deployment

## Lokale preview

Omdat het een statische site is, kun je de HTML-bestanden direct openen in je browser of serveren met een simpele lokale webserver.

Voorbeeld met Python:

```bash
python3 -m http.server 8080
```

Open daarna:

- `http://localhost:8080/index.html`
- `http://localhost:8080/projecten.html`

## Kwaliteitscontrole

Controleer links en deployment-artefact met:

```bash
npm run check:site
```

Deze check valideert:
- lokale `src`/`href`/`srcset`-referenties op gedeployde pagina’s;
- of alle gebruikte bestanden in het GitHub Pages artefact terechtkomen;
- of sitemap-pagina’s meegenomen worden;
- of `projecten.html` exact één `<h1>` bevat.

## Deployment (GitHub Pages)

Publicatie gebeurt via de workflow:

- `.github/workflows/static.yml`

Deze workflow maakt een `.pages` artefact met de pagina’s en statische assets en deployed dat naar GitHub Pages.

## Ontwikkelnotitie

In de repo staan ook enkele legacy-bestanden/scripts voor een eerder factuursjabloon-experiment.  
Die horen niet bij de live JVW-site en worden niet gebruikt voor de huidige websitepublicatie.
