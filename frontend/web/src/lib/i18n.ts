export type Language = 'it' | 'en';

export interface Translations {
  // Meta tags
  meta: {
    title: string;
    description: string;
    keywords: string;
    ogTitle: string;
    ogDescription: string;
    ogImageAlt: string;
    twitterTitle: string;
    twitterDescription: string;
    appleMobileWebAppTitle: string;
  };

  // Navigation
  download: string;
  logout: string;

  // Hero Section
  hero: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    downloadFree: string;
    watchDemo: string;
  };

  // Stats
  stats: {
    rating: string;
    downloads: string;
    free: string;
  };

  // Features
  features: {
    title: string;
    subtitle: string;
    visualRecognition: {
      title: string;
      description: string;
    };
    smartRecipes: {
      title: string;
      description: string;
    };
    wasteManagement: {
      title: string;
      description: string;
    };
  };

  // How it works
  howItWorks: {
    title: string;
    subtitle: string;
    step1: {
      title: string;
      description: string;
    };
    step2: {
      title: string;
      description: string;
    };
    step3: {
      title: string;
      description: string;
    };
  };

  // Results
  results: {
    title: string;
    accuracy: string;
    recipes: string;
    wasteReduction: string;
    rating: string;
  };

  // Testimonials
  testimonials: {
    title: string;
    reviews: {
      elena: {
        name: string;
        role: string;
        content: string;
      };
      marco: {
        name: string;
        role: string;
        content: string;
      };
      sofia: {
        name: string;
        role: string;
        content: string;
      };
    };
  };

  // Final CTA
  finalCta: {
    title: string;
    subtitle: string;
    downloadButton: string;
    features: {
      free: string;
      noSubscription: string;
      privacy: string;
    };
  };

  // Footer
  footer: {
    privacy: string;
    terms: string;
    support: string;
    copyright: string;
    completelyFree: string;
  };

  // Maintenance
  maintenance: {
    title: string;
    titleHighlight: string;
    subtitle: string;
    adminAccess: string;
    passwordPlaceholder: string;
    login: string;
    verifying: string;
    incorrectPassword: string;
    support: string;
    completelyFree: string;
  };

  // Modals
  modals: {
    close: string;
    privacyPolicy: {
      title: string;
      lastUpdated: string;
      dataCollection: {
        title: string;
        content: string;
        items: string[];
      };
      dataUse: {
        title: string;
        content: string;
        items: string[];
      };
      dataSharing: {
        title: string;
        content: string;
        items: string[];
      };
      dataSecurity: {
        title: string;
        content: string;
        items: string[];
      };
      userRights: {
        title: string;
        content: string;
        items: string[];
      };
      dataRetention: {
        title: string;
        content: string;
        items: string[];
      };
      disclaimer: {
        title: string;
        content: string;
        items: string[];
      };
      contact: {
        title: string;
        content: string;
        email: string;
        dpo: string;
        response: string;
      };
      effective: {
        title: string;
        content: string;
      };
    };
    termsOfService: {
      title: string;
      lastUpdated: string;
      acceptance: {
        title: string;
        content: string;
      };
      description: {
        title: string;
        content: string;
        features: string[];
      };
      userAccount: {
        title: string;
        content: string;
        items: string[];
      };
      acceptableUse: {
        title: string;
        content: string;
        items: string[];
      };
      intellectualProperty: {
        title: string;
        content: string;
      };
      liability: {
        title: string;
        content: string;
      };
      termination: {
        title: string;
        content: string;
      };
      changes: {
        title: string;
        content: string;
      };
      contact: {
        title: string;
        content: string;
      };
      medicalDisclaimer: {
        title: string;
        content: string;
      };
      allergyDisclaimer: {
        title: string;
        content: string;
      };
    };
  };
}

export const translations: Record<Language, Translations> = {
  it: {
    meta: {
      title: 'FridgeWiseAI - Il futuro della cucina intelligente',
      description: 'Trasforma i tuoi ingredienti in ricette straordinarie con l\'intelligenza artificiale. Riconoscimento visuale, ricette personalizzate e zero sprechi. Scarica gratis su App Store.',
      keywords: 'ricette AI, cucina intelligente, riconoscimento ingredienti, app iOS, sostenibilità alimentare, ricette personalizzate, anti-spreco, frigo smart',
      ogTitle: 'FridgeWiseAI - Il futuro della cucina intelligente',
      ogDescription: 'Trasforma i tuoi ingredienti in ricette straordinarie con l\'intelligenza artificiale. Sostenibile, personale, delizioso.',
      ogImageAlt: 'FridgeWiseAI App - Schermata principale con IA per riconoscimento ingredienti',
      twitterTitle: 'FridgeWiseAI - Il futuro della cucina intelligente',
      twitterDescription: 'Trasforma i tuoi ingredienti in ricette straordinarie con l\'AI. Scarica gratis su App Store.',
      appleMobileWebAppTitle: 'FridgeWiseAI',
    },

    download: 'Scarica',
    logout: 'Logout',

    hero: {
      badge: 'Disponibile su App Store',
      title: 'Il futuro della',
      titleHighlight: 'cucina intelligente',
      subtitle: 'Trasforma i tuoi ingredienti in ricette straordinarie con l\'intelligenza artificiale. Sostenibile, personale, delizioso.',
      downloadFree: 'Scarica gratis',
      watchDemo: 'Guarda demo',
    },

    stats: {
      rating: '4.9 su App Store',
      downloads: '10.000+ download',
      free: 'Completamente gratuita',
    },

    features: {
      title: 'Progettata per semplificare',
      subtitle: 'Ogni funzione è pensata per rendere la tua esperienza culinaria più intuitiva e piacevole',
      visualRecognition: {
        title: 'Riconoscimento visuale',
        description: 'Scatta una foto e identifica automaticamente ogni ingrediente con precisione chirurgica.',
      },
      smartRecipes: {
        title: 'Ricette intelligenti',
        description: 'Suggerimenti personalizzati che si adattano ai tuoi gusti, allergie e preferenze.',
      },
      wasteManagement: {
        title: 'Gestione scadenze',
        description: 'Non sprecare mai più cibo con promemoria intelligenti e suggerimenti anti-spreco.',
      },
    },

    howItWorks: {
      title: 'Semplicemente intuitivo',
      subtitle: 'Tre passaggi per trasformare il modo in cui cucini',
      step1: {
        title: 'Fotografa i tuoi ingredienti',
        description: 'Apri l\'app e scatta una foto del contenuto del tuo frigo. La nostra IA li riconoscerà istantaneamente.',
      },
      step2: {
        title: 'Ricevi suggerimenti personalizzati',
        description: 'L\'app genererà ricette su misura per te, considerando i tuoi gusti e le tue restrizioni alimentari.',
      },
      step3: {
        title: 'Cucina e gusta',
        description: 'Segui le istruzioni passo dopo passo e crea piatti deliziosi senza sprecare alcun ingrediente.',
      },
    },

    results: {
      title: 'Risultati che parlano da soli',
      accuracy: 'Precisione nell\'identificazione',
      recipes: 'Ricette nel database',
      wasteReduction: 'Riduzione degli sprechi',
      rating: 'Rating medio utenti',
    },

    testimonials: {
      title: 'Amata da migliaia di utenti',
      reviews: {
        elena: {
          name: 'Elena Marchetti',
          role: 'Chef domestica',
          content: 'Incredibile come riesca a suggerire combinazioni che non avrei mai pensato. Ha davvero cambiato il mio approccio alla cucina.',
        },
        marco: {
          name: 'Marco Bianchi',
          role: 'Studente universitario',
          content: 'Perfetta per chi come me ha poco tempo ma vuole mangiare bene. Le ricette sono sempre veloci e gustose.',
        },
        sofia: {
          name: 'Sofia Romano',
          role: 'Famiglia numerosa',
          content: 'Finalmente non spreco più cibo! I miei bambini adorano le nuove ricette che scopriamo insieme.',
        },
      },
    },

    finalCta: {
      title: 'Inizia la tua rivoluzione culinaria',
      subtitle: 'Scarica FridgeWise oggi e scopri un nuovo modo di cucinare',
      downloadButton: 'Scarica su App Store',
      features: {
        free: 'Completamente gratuita',
        noSubscription: 'Nessun abbonamento',
        privacy: 'Privacy garantita',
      },
    },

    footer: {
      privacy: 'Privacy',
      terms: 'Termini',
      support: 'Supporto',
      copyright: '© 2024 FridgeWise Inc.',
      completelyFree: 'Completamente gratuita',
    },

    maintenance: {
      title: 'Stiamo migliorando',
      titleHighlight: 'per te',
      subtitle: 'Ci stiamo prendendo cura di alcuni aggiornamenti per offrirti un\'esperienza ancora più straordinaria.',
      adminAccess: 'Accesso Admin',
      passwordPlaceholder: 'Password admin',
      login: 'Accedi',
      verifying: 'Verifica...',
      incorrectPassword: 'Password non corretta',
      support: 'Supporto',
      completelyFree: 'Completamente gratuita',
    },

    modals: {
      close: 'Chiudi',
      privacyPolicy: {
        title: 'Privacy Policy',
        lastUpdated: 'Ultimo aggiornamento',
        dataCollection: {
          title: 'Raccolta dei Dati',
          content: 'Raccogliamo informazioni per fornire servizi migliori a tutti i nostri utenti. I tipi di informazioni che raccogliamo includono:',
          items: [
            'Informazioni dell\'account (nome, email, preferenze)',
            'Dati degli ingredienti e foto caricate',
            'Ricette create e salvate',
            'Preferenze alimentari e allergie',
            'Dati di utilizzo dell\'app',
            'Informazioni del dispositivo e sistema operativo',
            'Dati di geolocalizzazione approssimativa (opzionale)',
          ],
        },
        dataUse: {
          title: 'Utilizzo dei Dati',
          content: 'Utilizziamo i dati raccolti per i seguenti scopi:',
          items: [
            'Personalizzazione delle ricette e suggerimenti',
            'Analisi AI per riconoscimento ingredienti',
            'Miglioramento dei nostri servizi',
            'Supporto clienti e assistenza tecnica',
            'Sicurezza e prevenzione frodi',
            'Adempimenti legali e normativi',
            'Comunicazioni di servizio',
          ],
        },
        dataSharing: {
          title: 'Condivisione dei Dati',
          content: 'Non vendiamo i tuoi dati personali. Condividiamo informazioni limitate solo nei seguenti casi:',
          items: [
            'Servizi AI e elaborazione immagini (dati anonimi)',
            'Database nutrizionali USDA per informazioni alimentari',
            'Servizi di analytics (dati aggregati e anonimi)',
            'Servizi cloud per backup e sincronizzazione',
            'Richieste legali da autorità competenti',
            'Non vendiamo mai i tuoi dati a terzi',
            'Solo con il tuo consenso esplicito',
          ],
        },
        dataSecurity: {
          title: 'Sicurezza dei Dati',
          content: 'Implementiamo misure di sicurezza appropriate per proteggere i tuoi dati:',
          items: [
            'Crittografia end-to-end per dati sensibili',
            'Accesso limitato su base "need-to-know"',
            'Infrastruttura sicura certificata ISO 27001',
            'Monitoraggio continuo per minacce',
            'Aggiornamenti di sicurezza regolari',
            'Notifica di violazioni entro 72 ore',
            'Conformità GDPR e normative sulla privacy',
          ],
        },
        userRights: {
          title: 'I Tuoi Diritti',
          content: 'Hai il controllo completo sui tuoi dati:',
          items: [
            'Accesso: visualizza tutti i dati che abbiamo su di te',
            'Modifica: aggiorna le tue informazioni in qualsiasi momento',
            'Cancellazione: elimina il tuo account e tutti i dati',
            'Portabilità: esporta i tuoi dati in formato leggibile',
            'Limitazione: limita l\'elaborazione dei tuoi dati',
            'Revoca consenso: ritira il consenso in qualsiasi momento',
            'Reclamo: presenta reclamo all\'autorità di controllo',
            'Risposta entro 30 giorni per tutte le richieste',
          ],
        },
        dataRetention: {
          title: 'Conservazione dei Dati',
          content: 'Conserviamo i tuoi dati solo per il tempo necessario:',
          items: [
            'Dati account: finché mantieni l\'account attivo',
            'Ricette e preferenze: finché utilizzi il servizio',
            'Dati analytics: massimo 26 mesi in forma anonima',
            'Dati legali: come richiesto dalla legge',
            'Account inattivi: cancellati dopo 3 anni',
            'Cancellazione automatica alla scadenza',
          ],
        },
        disclaimer: {
          title: 'Disclaimer Importante',
          content: 'FridgeWise è un\'applicazione di assistenza culinaria. Si prega di notare:',
          items: [
            'Non garantiamo l\'accuratezza al 100% del riconoscimento ingredienti',
            'Verifica sempre la sicurezza alimentare prima del consumo',
            'Non fornisce consigli medici o nutrizionali',
            'Controlla sempre allergeni e ingredienti pericolosi',
            'Non ci assumiamo responsabilità per reazioni avverse',
            'Consulta sempre professionisti per consigli nutrizionali',
          ],
        },
        contact: {
          title: 'Contatti',
          content: 'Per domande sulla privacy o per esercitare i tuoi diritti:',
          email: 'Email: support@fridgewiseai.com',
          dpo: 'DPO: privacy@fridgewiseai.com',
          response: 'Risponderemo a tutte le richieste entro 30 giorni.',
        },
        effective: {
          title: 'Data di Efficacia',
          content: 'Questa Privacy Policy è efficace dal {date} e si applica a tutti gli utenti di FridgeWiseAI.',
        },
      },
      termsOfService: {
        title: 'Termini di Servizio',
        lastUpdated: 'Ultimo aggiornamento',
        acceptance: {
          title: 'Accettazione dei Termini',
          content: 'Utilizzando FridgeWise, accetti questi Termini di Servizio. Se non accetti questi termini, non utilizzare l\'applicazione.',
        },
        description: {
          title: 'Descrizione del Servizio',
          content: 'FridgeWiseAI è un\'applicazione mobile che utilizza l\'intelligenza artificiale per:',
          features: [
            'Riconoscimento automatico degli ingredienti tramite foto',
            'Generazione di ricette personalizzate basate sui tuoi ingredienti',
            'Gestione intelligente delle scadenze alimentari',
            'Suggerimenti per ridurre gli sprechi alimentari',
          ],
        },
        userAccount: {
          title: 'Account Utente',
          content: 'Per utilizzare FridgeWiseAI, devi creare un account. Sei responsabile di:',
          items: [
            'Fornire informazioni accurate e aggiornate',
            'Mantenere la sicurezza delle tue credenziali',
            'Tutte le attività che avvengono sotto il tuo account',
          ],
        },
        acceptableUse: {
          title: 'Utilizzo Accettabile',
          content: 'Ti impegni a utilizzare FridgeWise solo per scopi legali e accetti di non:',
          items: [
            'Utilizzare il servizio per scopi commerciali senza autorizzazione',
            'Interferire con il funzionamento del servizio',
            'Violare leggi applicabili o diritti di terzi',
            'Tentare di reverse-engineer o decompilare l\'applicazione',
          ],
        },
        intellectualProperty: {
          title: 'Contenuti e Proprietà Intellettuale',
          content: 'Tutti i contenuti, design, testi, grafiche e software di FridgeWise sono di proprietà di FridgeWise Inc. e sono protetti dalle leggi sul copyright e sulla proprietà intellettuale.',
        },
        liability: {
          title: 'Limitazione di Responsabilità',
          content: 'FridgeWise fornisce il servizio "così com\'è" senza garanzie di alcun tipo. Non siamo responsabili per danni diretti, indiretti, incidentali o consequenziali derivanti dall\'uso del servizio.',
        },
        termination: {
          title: 'Risoluzione del Contratto',
          content: 'Possiamo terminare o sospendere il tuo accesso a FridgeWise in qualsiasi momento, con o senza preavviso, per violazione di questi termini o per altri motivi a nostra discrezione.',
        },
        changes: {
          title: 'Modifiche ai Termini',
          content: 'Ci riserviamo il diritto di modificare questi termini in qualsiasi momento. Le modifiche entreranno in vigore immediatamente dopo la pubblicazione. L\'uso continuato del servizio costituisce accettazione dei termini modificati.',
        },
        contact: {
          title: 'Contatti',
          content: 'Per domande sui Termini di Servizio, contattaci: Email: support@fridgewiseai.com',
        },
        medicalDisclaimer: {
          title: 'Disclaimer Medico',
          content: 'FridgeWise non fornisce consigli medici, di trattamento o diagnostici. Le informazioni fornite sono solo a scopo informativo e non sostituiscono il consiglio medico professionale. Consulta sempre un medico qualificato per questioni relative alla salute.',
        },
        allergyDisclaimer: {
          title: 'Disclaimer Allergie',
          content: 'FridgeWise non può garantire l\'identificazione accurata di tutti gli allergeni. Gli utenti con allergie alimentari devono sempre verificare gli ingredienti manualmente e consultare le etichette dei prodotti. Non ci assumiamo responsabilità per reazioni allergiche.',
        },
      },
    },
  },

  en: {
    meta: {
      title: 'FridgeWiseAI - The future of smart cooking',
      description: 'Transform your ingredients into extraordinary recipes with artificial intelligence. Visual recognition, personalized recipes and zero waste. Download free on App Store.',
      keywords: 'AI recipes, smart cooking, ingredient recognition, iOS app, food sustainability, personalized recipes, anti-waste, smart fridge',
      ogTitle: 'FridgeWiseAI - The future of smart cooking',
      ogDescription: 'Transform your ingredients into extraordinary recipes with artificial intelligence. Sustainable, personal, delicious.',
      ogImageAlt: 'FridgeWiseAI App - Main screen with AI for ingredient recognition',
      twitterTitle: 'FridgeWiseAI - The future of smart cooking',
      twitterDescription: 'Transform your ingredients into extraordinary recipes with AI. Download free on App Store.',
      appleMobileWebAppTitle: 'FridgeWiseAI',
    },

    download: 'Download',
    logout: 'Logout',

    hero: {
      badge: 'Available on App Store',
      title: 'The future of',
      titleHighlight: 'smart cooking',
      subtitle: 'Transform your ingredients into extraordinary recipes with artificial intelligence. Sustainable, personal, delicious.',
      downloadFree: 'Download free',
      watchDemo: 'Watch demo',
    },

    stats: {
      rating: '4.9 on App Store',
      downloads: '10,000+ downloads',
      free: 'Completely free',
    },

    features: {
      title: 'Designed to simplify',
      subtitle: 'Every feature is designed to make your culinary experience more intuitive and enjoyable',
      visualRecognition: {
        title: 'Visual recognition',
        description: 'Take a photo and automatically identify every ingredient with surgical precision.',
      },
      smartRecipes: {
        title: 'Smart recipes',
        description: 'Personalized suggestions that adapt to your tastes, allergies and preferences.',
      },
      wasteManagement: {
        title: 'Expiry management',
        description: 'Never waste food again with smart reminders and anti-waste suggestions.',
      },
    },

    howItWorks: {
      title: 'Simply intuitive',
      subtitle: 'Three steps to transform the way you cook',
      step1: {
        title: 'Photograph your ingredients',
        description: 'Open the app and take a photo of your fridge contents. Our AI will recognize them instantly.',
      },
      step2: {
        title: 'Get personalized suggestions',
        description: 'The app will generate recipes tailored to you, considering your tastes and dietary restrictions.',
      },
      step3: {
        title: 'Cook and enjoy',
        description: 'Follow the step-by-step instructions and create delicious dishes without wasting any ingredients.',
      },
    },

    results: {
      title: 'Results that speak for themselves',
      accuracy: 'Identification accuracy',
      recipes: 'Recipes in database',
      wasteReduction: 'Waste reduction',
      rating: 'Average user rating',
    },

    testimonials: {
      title: 'Loved by thousands of users',
      reviews: {
        elena: {
          name: 'Elena Marchetti',
          role: 'Home chef',
          content: 'Amazing how it manages to suggest combinations I would never have thought of. It really changed my approach to cooking.',
        },
        marco: {
          name: 'Marco Bianchi',
          role: 'University student',
          content: 'Perfect for someone like me who has little time but wants to eat well. The recipes are always quick and tasty.',
        },
        sofia: {
          name: 'Sofia Romano',
          role: 'Large family',
          content: 'Finally I no longer waste food! My children love the new recipes we discover together.',
        },
      },
    },

    finalCta: {
      title: 'Start your culinary revolution',
      subtitle: 'Download FridgeWise today and discover a new way of cooking',
      downloadButton: 'Download on App Store',
      features: {
        free: 'Completely free',
        noSubscription: 'No subscription',
        privacy: 'Privacy guaranteed',
      },
    },

    footer: {
      privacy: 'Privacy',
      terms: 'Terms',
      support: 'Support',
      copyright: '© 2024 FridgeWise Inc.',
      completelyFree: 'Completely free',
    },

    maintenance: {
      title: 'We\'re improving',
      titleHighlight: 'for you',
      subtitle: 'We\'re taking care of some updates to offer you an even more extraordinary experience.',
      adminAccess: 'Admin Access',
      passwordPlaceholder: 'Admin password',
      login: 'Login',
      verifying: 'Verifying...',
      incorrectPassword: 'Incorrect password',
      support: 'Support',
      completelyFree: 'Completely free',
    },

    modals: {
      close: 'Close',
      privacyPolicy: {
        title: 'Privacy Policy',
        lastUpdated: 'Last updated',
        dataCollection: {
          title: 'Data Collection',
          content: 'We collect information to provide better services to all our users. The types of information we collect include:',
          items: [
            'Account information (name, email, preferences)',
            'Ingredient data and uploaded photos',
            'Created and saved recipes',
            'Food preferences and allergies',
            'App usage data',
            'Device and operating system information',
            'Approximate geolocation data (optional)',
          ],
        },
        dataUse: {
          title: 'Data Use',
          content: 'We use the collected data for the following purposes:',
          items: [
            'Recipe and suggestion personalization',
            'AI analysis for ingredient recognition',
            'Service improvement',
            'Customer support and technical assistance',
            'Security and fraud prevention',
            'Legal and regulatory compliance',
            'Service communications',
          ],
        },
        dataSharing: {
          title: 'Data Sharing',
          content: 'We do not sell your personal data. We share limited information only in the following cases:',
          items: [
            'AI services and image processing (anonymous data)',
            'USDA nutritional databases for food information',
            'Analytics services (aggregated and anonymous data)',
            'Cloud services for backup and synchronization',
            'Legal requests from competent authorities',
            'We never sell your data to third parties',
            'Only with your explicit consent',
          ],
        },
        dataSecurity: {
          title: 'Data Security',
          content: 'We implement appropriate security measures to protect your data:',
          items: [
            'End-to-end encryption for sensitive data',
            'Limited access on a "need-to-know" basis',
            'ISO 27001 certified secure infrastructure',
            'Continuous monitoring for threats',
            'Regular security updates',
            'Breach notification within 72 hours',
            'GDPR compliance and privacy regulations',
          ],
        },
        userRights: {
          title: 'Your Rights',
          content: 'You have complete control over your data:',
          items: [
            'Access: view all data we have about you',
            'Modify: update your information at any time',
            'Deletion: delete your account and all data',
            'Portability: export your data in readable format',
            'Limitation: limit the processing of your data',
            'Withdraw consent: withdraw consent at any time',
            'Complaint: file complaint with supervisory authority',
            'Response within 30 days for all requests',
          ],
        },
        dataRetention: {
          title: 'Data Retention',
          content: 'We keep your data only for as long as necessary:',
          items: [
            'Account data: as long as you keep your account active',
            'Recipes and preferences: as long as you use the service',
            'Analytics data: maximum 26 months in anonymous form',
            'Legal data: as required by law',
            'Inactive accounts: deleted after 3 years',
            'Automatic deletion upon expiration',
          ],
        },
        disclaimer: {
          title: 'Important Disclaimer',
          content: 'FridgeWise is a culinary assistance application. Please note:',
          items: [
            'We do not guarantee 100% accuracy of ingredient recognition',
            'Always verify food safety before consumption',
            'Does not provide medical or nutritional advice',
            'Always check allergens and dangerous ingredients',
            'We assume no responsibility for adverse reactions',
            'Always consult professionals for nutritional advice',
          ],
        },
        contact: {
          title: 'Contact',
          content: 'For privacy questions or to exercise your rights:',
          email: 'Email: support@fridgewiseai.com',
          dpo: 'DPO: privacy@fridgewiseai.com',
          response: 'We will respond to all requests within 30 days.',
        },
        effective: {
          title: 'Effective Date',
          content: 'This Privacy Policy is effective from {date} and applies to all FridgeWise users.',
        },
      },
      termsOfService: {
        title: 'Terms of Service',
        lastUpdated: 'Last updated',
        acceptance: {
          title: 'Acceptance of Terms',
          content: 'By using FridgeWise, you accept these Terms of Service. If you do not accept these terms, do not use the application.',
        },
        description: {
          title: 'Service Description',
          content: 'FridgeWise is a mobile application that uses artificial intelligence to:',
          features: [
            'Automatic ingredient recognition through photos',
            'Generation of personalized recipes based on your ingredients',
            'Smart food expiry management',
            'Suggestions to reduce food waste',
          ],
        },
        userAccount: {
          title: 'User Account',
          content: 'To use FridgeWise, you must create an account. You are responsible for:',
          items: [
            'Providing accurate and updated information',
            'Maintaining the security of your credentials',
            'All activities that occur under your account',
          ],
        },
        acceptableUse: {
          title: 'Acceptable Use',
          content: 'You agree to use FridgeWise only for legal purposes and agree not to:',
          items: [
            'Use the service for commercial purposes without authorization',
            'Interfere with the operation of the service',
            'Violate applicable laws or third party rights',
            'Attempt to reverse-engineer or decompile the application',
          ],
        },
        intellectualProperty: {
          title: 'Content and Intellectual Property',
          content: 'All content, design, text, graphics and software of FridgeWise are owned by FridgeWise Inc. and are protected by copyright and intellectual property laws.',
        },
        liability: {
          title: 'Limitation of Liability',
          content: 'FridgeWise provides the service "as is" without warranties of any kind. We are not responsible for direct, indirect, incidental or consequential damages arising from the use of the service.',
        },
        termination: {
          title: 'Contract Termination',
          content: 'We may terminate or suspend your access to FridgeWise at any time, with or without notice, for violation of these terms or for other reasons at our discretion.',
        },
        changes: {
          title: 'Changes to Terms',
          content: 'We reserve the right to modify these terms at any time. Changes will take effect immediately upon publication. Continued use of the service constitutes acceptance of the modified terms.',
        },
        contact: {
          title: 'Contact',
          content: 'For questions about the Terms of Service, contact us: Email: support@fridgewiseai.com',
        },
        medicalDisclaimer: {
          title: 'Medical Disclaimer',
          content: 'FridgeWise does not provide medical, treatment or diagnostic advice. The information provided is for informational purposes only and does not replace professional medical advice. Always consult a qualified physician for health-related matters.',
        },
        allergyDisclaimer: {
          title: 'Allergy Disclaimer',
          content: 'FridgeWise cannot guarantee accurate identification of all allergens. Users with food allergies should always verify ingredients manually and consult product labels. We assume no responsibility for allergic reactions.',
        },
      },
    },
  },
};

export function useTranslations(language: Language): Translations {
  return translations[language];
}

export function getServerTranslations(language: Language): Translations {
  return translations[language];
}