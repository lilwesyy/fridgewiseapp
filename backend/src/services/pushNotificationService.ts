import apn from 'apn';
import { config } from 'dotenv';

config();

export class PushNotificationService {
  private static provider: apn.Provider | null = null;

  static initialize() {
    try {
      // Check if certificates are configured
      const hasTokenAuth = process.env.APN_AUTH_KEY_PATH && process.env.APN_KEY_ID && process.env.APN_TEAM_ID;
      const hasCertAuth = process.env.APN_CERT_PATH && process.env.APN_KEY_PATH;
      
      if (!hasTokenAuth && !hasCertAuth) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Push Notification Service not configured. Set APN environment variables to enable.');
        }
        return;
      }

      let options: apn.ProviderOptions = {
        production: process.env.NODE_ENV === 'production',
      };

      // Prefer token-based authentication if available
      if (hasTokenAuth) {
        options.token = {
          key: process.env.APN_AUTH_KEY_PATH!,
          keyId: process.env.APN_KEY_ID!,
          teamId: process.env.APN_TEAM_ID!
        };
        console.log('🔔 Using token-based authentication for APNs');
      } else if (hasCertAuth) {
        options.cert = process.env.APN_CERT_PATH!;
        options.key = process.env.APN_KEY_PATH!;
        console.log('🔔 Using certificate-based authentication for APNs');
      }

      this.provider = new apn.Provider(options);
      console.log('✅ Push Notification Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Push Notification Service:', error);
      if (process.env.NODE_ENV === 'development') {
        console.log('💡 Push notifications will be disabled. Configure APN certificates to enable.');
      }
    }
  }

  static async sendRecipeApprovedNotification(
    deviceToken: string, 
    recipeName: string,
    userName: string
  ): Promise<boolean> {
    if (!this.provider) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Push Notification Service not initialized');
      }
      return false;
    }

    try {
      const notification = new apn.Notification();
      
      // Notification content
      notification.alert = {
        title: 'Ricetta Approvata! 🎉',
        body: `La tua ricetta "${recipeName}" è stata approvata ed è ora pubblica!`
      };
      
      // Notification settings
      notification.badge = 1;
      notification.sound = 'default';
      notification.topic = process.env.IOS_BUNDLE_ID || 'com.yourapp.fridgewiseai';
      
      // Custom data
      notification.payload = {
        type: 'recipe_approved',
        recipeName,
        userName,
        timestamp: new Date().toISOString()
      };

      // Send notification
      const result = await this.provider.send(notification, deviceToken);
      
      if (result.sent.length > 0) {
        console.log('✅ Push notification sent successfully:', {
          deviceToken: deviceToken.substring(0, 8) + '...',
          recipeName,
          userName
        });
        return true;
      } else {
        console.error('❌ Failed to send push notification:', result.failed);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      return false;
    }
  }

  static async sendRecipeRejectedNotification(
    deviceToken: string, 
    recipeName: string,
    rejectionReason: string,
    userName: string
  ): Promise<boolean> {
    if (!this.provider) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Push Notification Service not initialized');
      }
      return false;
    }

    try {
      const notification = new apn.Notification();
      
      // Notification content
      notification.alert = {
        title: 'Ricetta non approvata',
        body: `La tua ricetta "${recipeName}" necessita di modifiche. Tocca per vedere i dettagli.`
      };
      
      // Notification settings
      notification.badge = 1;
      notification.sound = 'default';
      notification.topic = process.env.IOS_BUNDLE_ID || 'com.yourapp.fridgewiseai';
      
      // Custom data
      notification.payload = {
        type: 'recipe_rejected',
        recipeName,
        rejectionReason,
        userName,
        timestamp: new Date().toISOString()
      };

      // Send notification
      const result = await this.provider.send(notification, deviceToken);
      
      if (result.sent.length > 0) {
        console.log('✅ Rejection notification sent successfully:', {
          deviceToken: deviceToken.substring(0, 8) + '...',
          recipeName,
          userName
        });
        return true;
      } else {
        console.error('❌ Failed to send rejection notification:', result.failed);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending rejection notification:', error);
      return false;
    }
  }

  static shutdown() {
    if (this.provider) {
      this.provider.shutdown();
      console.log('🔔 Push Notification Service shutdown');
    }
  }
}

// Initialize the service when the module is loaded
PushNotificationService.initialize();