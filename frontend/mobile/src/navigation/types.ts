import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';

// Root Stack Navigator (camera flow)
export type RootStackParamList = {
  MainTabs: undefined;
  Camera: undefined;
  Ingredients: {
    ingredients: any[];
  };
  Recipe: {
    recipe: any;
    isJustGenerated?: boolean;
    recipes?: any[];
    currentIndex?: number;
    isPublic?: boolean;
    fromTab?: 'home' | 'recipes' | 'saved';
  };
  CookingMode: {
    recipe: any;
    isPublic?: boolean;
  };
};

// Bottom Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Camera: undefined;
  Recipes: undefined;
  Saved: undefined;
  Profile: undefined;
};

// Screen prop types for type safety
export type RootStackScreenProps<Screen extends keyof RootStackParamList> = 
  StackScreenProps<RootStackParamList, Screen>;

export type MainTabScreenProps<Screen extends keyof MainTabParamList> = 
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, Screen>,
    StackScreenProps<RootStackParamList>
  >;

// Specific screen props
export type HomeScreenProps = MainTabScreenProps<'Home'>;
export type CameraTabScreenProps = MainTabScreenProps<'Camera'>;
export type RecipesScreenProps = MainTabScreenProps<'Recipes'>;
export type SavedScreenProps = MainTabScreenProps<'Saved'>;
export type ProfileScreenProps = MainTabScreenProps<'Profile'>;

export type CameraScreenProps = RootStackScreenProps<'Camera'>;
export type IngredientsScreenProps = RootStackScreenProps<'Ingredients'>;
export type RecipeScreenProps = RootStackScreenProps<'Recipe'>;
export type CookingModeScreenProps = RootStackScreenProps<'CookingMode'>;

// Navigation helper types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}