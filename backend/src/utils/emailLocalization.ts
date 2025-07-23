import emailEn from '../locales/email-en.json';
import emailIt from '../locales/email-it.json';

export type SupportedLocale = 'en' | 'it';

const translations = {
  en: emailEn,
  it: emailIt
};

export function getEmailTranslations(locale: SupportedLocale = 'en') {
  return translations[locale] || translations.en;
}

export function generatePasswordResetEmail(
  resetCode: string, 
  locale: SupportedLocale = 'en'
) {
  const t = getEmailTranslations(locale);
  
  return {
    subject: t.passwordReset.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #16a34a; margin-bottom: 10px;">FridgeWise</h1>
          <h2 style="color: #333; margin-bottom: 20px;">${t.passwordReset.title}</h2>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 15px;">
            ${t.passwordReset.message}
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #16a34a; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 8px; display: inline-block;">
              ${resetCode}
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            ${t.passwordReset.expiry}
          </p>
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #92400e; font-size: 14px; margin: 0;">
            ${t.passwordReset.securityNotice}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #999; font-size: 12px;">
            ${t.passwordReset.footer}
          </p>
        </div>
      </div>
    `
  };
}

export function generateEmailVerificationEmail(
  verificationCode: string, 
  locale: SupportedLocale = 'en'
) {
  const t = getEmailTranslations(locale);
  
  return {
    subject: t.emailVerification.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #16a34a; margin-bottom: 10px;">🍽️ FridgeWise</h1>
          <h2 style="color: #333; margin-top: 0;">${t.emailVerification.title}</h2>
        </div>
        
        <div style="background-color: #f8fafc; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            ${t.emailVerification.welcome}
          </p>
          
          <div style="background-color: #16a34a; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; font-weight: 600; margin-bottom: 10px;">${t.emailVerification.codeTitle}</p>
            <h1 style="margin: 0; font-size: 36px; letter-spacing: 4px; font-weight: bold;">${verificationCode}</h1>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-bottom: 0;">
            ${t.emailVerification.expiry}
          </p>
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #92400e; font-size: 14px; margin: 0;">
            ${t.emailVerification.securityNotice}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #999; font-size: 12px;">
            ${t.emailVerification.footer}
          </p>
        </div>
      </div>
    `
  };
}