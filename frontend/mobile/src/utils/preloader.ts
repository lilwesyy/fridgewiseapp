import { ComponentType } from 'react';

// Preloader per lazy components
class ComponentPreloader {
  private preloadedComponents = new Set<string>();
  private preloadPromises = new Map<string, Promise<ComponentType<any>>>();

  // Preload strategico basato su user behavior
  preloadComponent(componentName: string, importFunction: () => Promise<{ default: ComponentType<any> }>) {
    if (this.preloadedComponents.has(componentName)) {
      return;
    }

    // Evita multiple preload dello stesso componente
    if (this.preloadPromises.has(componentName)) {
      return this.preloadPromises.get(componentName);
    }

    console.log(`🚀 Preloading ${componentName}...`);
    
    const preloadPromise = importFunction()
      .then(module => {
        this.preloadedComponents.add(componentName);
        console.log(`✅ ${componentName} preloaded successfully`);
        return module.default;
      })
      .catch(error => {
        console.error(`❌ Failed to preload ${componentName}:`, error);
        this.preloadPromises.delete(componentName);
        throw error;
      });

    this.preloadPromises.set(componentName, preloadPromise);
    return preloadPromise;
  }

  // Preload intelligente basato su flusso utente
  preloadBasedOnUserFlow(currentScreen: string) {
    const preloadStrategies: Record<string, string[]> = {
      'home': ['camera'], // Da home è probabile andare su camera
      'camera': ['ingredients'], // Da camera si va su ingredients
      'ingredients': ['recipe'], // Da ingredients si va su recipe
      'recipe': ['cooking'], // Da recipe si può andare su cooking
      'recipes': ['recipe'], // Da recipes si apre una ricetta
      'saved': ['recipe'], // Da saved si apre una ricetta
    };

    const componentsToPreload = preloadStrategies[currentScreen] || [];
    
    componentsToPreload.forEach(componentName => {
      this.preloadNextComponent(componentName);
    });
  }

  private preloadNextComponent(componentName: string) {
    switch (componentName) {
      case 'camera':
        this.preloadComponent('CameraScreen', () => import('../components/screens/CameraScreen'));
        break;
      case 'ingredients':
        this.preloadComponent('IngredientsScreen', () => import('../components/screens/IngredientsScreen'));
        break;
      case 'recipe':
        this.preloadComponent('RecipeScreen', () => import('../components/screens/RecipeScreen'));
        break;
      case 'cooking':
        this.preloadComponent('CookingModeScreen', () => import('../components/screens/CookingModeScreen'));
        break;
    }
  }

  // Preload dopo un delay per non impattare il loading iniziale
  schedulePreload(componentName: string, delay: number = 2000) {
    setTimeout(() => {
      this.preloadNextComponent(componentName);
    }, delay);
  }

  // Check se un componente è già stato preloaded
  isPreloaded(componentName: string): boolean {
    return this.preloadedComponents.has(componentName);
  }

  // Reset per testing o memory management
  reset() {
    this.preloadedComponents.clear();
    this.preloadPromises.clear();
  }
}

export const componentPreloader = new ComponentPreloader();

// Hook per usare il preloader nei componenti
export const useComponentPreloader = () => {
  return {
    preloadBasedOnUserFlow: componentPreloader.preloadBasedOnUserFlow.bind(componentPreloader),
    schedulePreload: componentPreloader.schedulePreload.bind(componentPreloader),
    isPreloaded: componentPreloader.isPreloaded.bind(componentPreloader),
  };
};