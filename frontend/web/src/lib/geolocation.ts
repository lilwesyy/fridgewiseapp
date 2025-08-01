export async function detectCountry(): Promise<string> {
  try {
    // Try multiple IP geolocation services as fallback
    const services = [
      'https://ipapi.co/country_code/',
      'https://api.country.is/',
      'https://ipinfo.io/country'
    ];

    for (const service of services) {
      try {
        const response = await fetch(service);
        if (response.ok) {
          let countryCode: string;
          
          if (service.includes('country.is')) {
            const data = await response.json();
            countryCode = data.country;
          } else {
            countryCode = (await response.text()).trim();
          }
          
          return countryCode.toUpperCase();
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${service}:`, error);
        continue;
      }
    }
    
    // Fallback: try to detect from browser language
    const browserLang = navigator.language || navigator.languages?.[0];
    if (browserLang?.startsWith('it')) {
      return 'IT';
    }
    
    // Default fallback
    return 'US';
  } catch (error) {
    console.error('Error detecting country:', error);
    // Fallback to browser language detection
    const browserLang = navigator.language || navigator.languages?.[0];
    return browserLang?.startsWith('it') ? 'IT' : 'US';
  }
}

export function getLanguageFromCountry(countryCode: string): 'it' | 'en' {
  return countryCode === 'IT' ? 'it' : 'en';
}