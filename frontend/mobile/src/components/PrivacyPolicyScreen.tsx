import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

interface PrivacyPolicyScreenProps {
  onGoBack: () => void;
}

export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ onGoBack }) => {
  const { t } = useTranslation();
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const sectionsOpacity = useSharedValue(0);
  
  useEffect(() => {
    // Entrance animations
    headerOpacity.value = withTiming(1, { duration: 600 });
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    sectionsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const sectionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sectionsOpacity.value,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('privacy.title')}</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      <Animated.View style={[styles.content, contentAnimatedStyle]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.lastUpdated}>{t('privacy.lastUpdated')}: {new Date().toLocaleDateString()}</Text>

          <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>{t('privacy.dataCollection.title')}</Text>
            <Text style={styles.sectionText}>{t('privacy.dataCollection.content')}</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• {t('privacy.dataCollection.account')}</Text>
              <Text style={styles.bulletItem}>• {t('privacy.dataCollection.ingredients')}</Text>
              <Text style={styles.bulletItem}>• {t('privacy.dataCollection.recipes')}</Text>
              <Text style={styles.bulletItem}>• {t('privacy.dataCollection.preferences')}</Text>
              <Text style={styles.bulletItem}>• {t('privacy.dataCollection.usage')}</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>{t('privacy.dataUse.title')}</Text>
            <Text style={styles.sectionText}>{t('privacy.dataUse.content')}</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• {t('privacy.dataUse.personalization')}</Text>
              <Text style={styles.bulletItem}>• {t('privacy.dataUse.aiAnalysis')}</Text>
              <Text style={styles.bulletItem}>• {t('privacy.dataUse.improvement')}</Text>
              <Text style={styles.bulletItem}>• {t('privacy.dataUse.support')}</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>{t('privacy.dataSharing.title')}</Text>
            <Text style={styles.sectionText}>{t('privacy.dataSharing.content')}</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• {t('privacy.dataSharing.ai')}</Text>
              <Text style={styles.bulletItem}>• {t('privacy.dataSharing.usda')}</Text>
              <Text style={styles.bulletItem}>• {t('privacy.dataSharing.noSale')}</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>{t('privacy.dataSecurity.title')}</Text>
            <Text style={styles.sectionText}>{t('privacy.dataSecurity.content')}</Text>
          </Animated.View>

          <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>{t('privacy.userRights.title')}</Text>
            <Text style={styles.sectionText}>{t('privacy.userRights.content')}</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• {t('privacy.userRights.access')}</Text>
              <Text style={styles.bulletItem}>• {t('privacy.userRights.modify')}</Text>
              <Text style={styles.bulletItem}>• {t('privacy.userRights.delete')}</Text>
              <Text style={styles.bulletItem}>• {t('privacy.userRights.portability')}</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>{t('privacy.cookies.title')}</Text>
            <Text style={styles.sectionText}>{t('privacy.cookies.content')}</Text>
          </Animated.View>

          <Animated.View style={[styles.section, sectionsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>{t('privacy.contact.title')}</Text>
            <Text style={styles.sectionText}>{t('privacy.contact.content')}</Text>
            <Text style={styles.contactInfo}>Email: info@fridgewiseai.com</Text>
          </Animated.View>

          <Animated.View style={[styles.disclaimerBox, sectionsAnimatedStyle]}>
            <Text style={styles.disclaimerTitle}>{t('privacy.disclaimer.title')}</Text>
            <Text style={styles.disclaimerText}>{t('privacy.disclaimer.content')}</Text>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgb(22, 163, 74)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 10,
  },
  bulletList: {
    paddingLeft: 10,
  },
  bulletItem: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 14,
    color: 'rgb(22, 163, 74)',
    fontWeight: '500',
    marginTop: 8,
  },
  disclaimerBox: {
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: 'rgb(22, 163, 74)',
    marginTop: 10,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgb(22, 163, 74)',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: 'rgb(16, 120, 56)',
    lineHeight: 20,
  },
});