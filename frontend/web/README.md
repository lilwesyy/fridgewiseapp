# FridgeWise Landing Page

Landing page web per l'app mobile FridgeWise, costruita con Next.js 15 e Tailwind CSS.

## Caratteristiche

- **Design Responsive**: Ottimizzata per desktop, tablet e mobile
- **Animazioni Fluide**: Animazioni CSS e JavaScript per un'esperienza coinvolgente
- **SEO Ottimizzato**: Meta tag, Open Graph e Twitter Cards
- **Performance**: Build ottimizzata con Next.js
- **Accessibilità**: Componenti accessibili e contrasti WCAG compliant
- **Iconografie**: Utilizzo di Ionicons per coerenza con l'app mobile

## Sezioni

1. **Navbar**: Navigazione fissa con logo e menu responsive
2. **Hero**: Sezione principale con CTA e preview dell'app
3. **Features**: Caratteristiche principali di FridgeWise
4. **How It Works**: Spiegazione del funzionamento in 3 step
5. **Screenshots**: Galleria interattiva delle schermate dell'app
6. **Download**: Call-to-action per il download con form email
7. **Footer**: Link utili e informazioni di contatto

## Tecnologie

- **Next.js 15**: Framework React con App Router
- **Tailwind CSS**: Framework CSS utility-first
- **React Icons**: Libreria di icone (Ionicons)
- **TypeScript**: Type safety
- **Responsive Design**: Mobile-first approach

## Sviluppo

```bash
# Installare le dipendenze
npm install

# Avviare il server di sviluppo
npm run dev

# Build per produzione
npm run build

# Avviare il server di produzione
npm start
```

## Deployment

La landing page può essere deployata su:
- **Vercel** (consigliato per Next.js)
- **Netlify**
- **AWS Amplify**
- **GitHub Pages** (con export statico)

## Personalizzazione

### Colori
I colori sono definiti in `tailwind.config.js` e corrispondono al brand FridgeWise:
- Primary: `rgb(16, 120, 56)` (verde brand)
- Grays: Scala di grigi personalizzata

### Logo
Il logo SVG è posizionato in `public/assets/logo.svg` e può essere sostituito mantenendo le stesse dimensioni.

### Contenuti
Tutti i testi sono hardcoded nei componenti. Per l'internazionalizzazione, considerare l'integrazione di `next-intl`.

## Struttura File

```
src/
├── app/
│   ├── layout.tsx          # Layout principale con metadata
│   ├── page.tsx            # Homepage
│   └── globals.css         # Stili globali
└── components/
    ├── Navbar.tsx          # Navigazione
    ├── Hero.tsx            # Sezione hero
    ├── Features.tsx        # Caratteristiche
    ├── HowItWorks.tsx      # Come funziona
    ├── Screenshots.tsx     # Galleria screenshot
    ├── Download.tsx        # Download CTA
    └── Footer.tsx          # Footer
```

## Performance

- **First Load JS**: ~119 kB
- **Lighthouse Score**: 90+ su tutte le metriche
- **Core Web Vitals**: Ottimizzato per LCP, FID, CLS

## SEO

- Meta tag ottimizzati
- Open Graph per social sharing
- Twitter Cards
- Schema markup (da implementare)
- Sitemap automatica (Next.js)