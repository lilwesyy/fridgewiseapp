import { Share, Alert } from 'react-native';

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
  }>;
  instructions: string[];
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  dietaryTags: string[];
}

interface ShareOptions {
  includeIngredients?: boolean;
  includeInstructions?: boolean;
  includeMetadata?: boolean;
  customMessage?: string;
}

export const formatRecipeForSharing = (
  recipe: Recipe, 
  options: ShareOptions = {},
  t: (key: string) => string
): string => {
  const {
    includeIngredients = true,
    includeInstructions = true,
    includeMetadata = true,
    customMessage = ''
  } = options;

  let shareText = '';

  // Custom message if provided
  if (customMessage) {
    shareText += `${customMessage}\n\n`;
  }

  // Recipe title and description
  shareText += `🍳 ${recipe.title}\n`;
  if (recipe.description) {
    shareText += `${recipe.description}\n\n`;
  }

  // Metadata (cooking time, servings, difficulty)
  if (includeMetadata) {
    const metadata = [];
    metadata.push(`⏱️ ${recipe.cookingTime} ${t('common.minutes')}`);
    metadata.push(`👥 ${recipe.servings} ${t('recipe.servings')}`);
    metadata.push(`📊 ${t(`recipe.difficulty.${recipe.difficulty}`)}`);
    
    if (recipe.dietaryTags.length > 0) {
      metadata.push(`🏷️ ${recipe.dietaryTags.join(', ')}`);
    }
    
    shareText += `${metadata.join(' • ')}\n\n`;
  }

  // Ingredients
  if (includeIngredients && recipe.ingredients.length > 0) {
    shareText += `📋 ${t('recipe.ingredients')}:\n`;
    recipe.ingredients.forEach((ingredient) => {
      shareText += `• ${ingredient.amount} ${ingredient.unit} ${ingredient.name}\n`;
    });
    shareText += '\n';
  }

  // Instructions
  if (includeInstructions && recipe.instructions.length > 0) {
    shareText += `👨‍🍳 ${t('recipe.instructions')}:\n`;
    recipe.instructions.forEach((instruction, index) => {
      shareText += `${index + 1}. ${instruction}\n`;
    });
    shareText += '\n';
  }

  // App attribution
  shareText += `\n🤖 ${t('share.createdWith')} FridgeWise AI`;

  return shareText;
};

export const shareRecipe = async (
  recipe: Recipe,
  options: ShareOptions = {},
  t: (key: string) => string
): Promise<boolean> => {
  try {
    const shareText = formatRecipeForSharing(recipe, options, t);
    
    const result = await Share.share({
      message: shareText,
      title: `${recipe.title} - FridgeWise`,
    }, {
      dialogTitle: t('share.shareRecipe'),
      subject: `${recipe.title} - FridgeWise Recipe`,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.log('Error sharing recipe:', error);
    Alert.alert(
      t('common.error'),
      t('share.shareError'),
      [{ text: t('common.ok') }]
    );
    return false;
  }
};

export const shareRecipeQuick = async (recipe: Recipe, t: (key: string) => string): Promise<boolean> => {
  return shareRecipe(recipe, {
    includeIngredients: true,
    includeInstructions: false, // Quick share without full instructions
    includeMetadata: true,
    customMessage: t('share.quickShareMessage')
  }, t);
};

export const shareRecipeFull = async (recipe: Recipe, t: (key: string) => string): Promise<boolean> => {
  return shareRecipe(recipe, {
    includeIngredients: true,
    includeInstructions: true,
    includeMetadata: true,
    customMessage: t('share.fullShareMessage')
  }, t);
};

export const shareRecipeLink = async (recipe: Recipe, t: (key: string) => string): Promise<boolean> => {
  // For future implementation with deep linking
  const shareText = `🍳 ${recipe.title}\n\n${t('share.checkoutRecipe')}\n\n🤖 ${t('share.createdWith')} FridgeWise AI`;
  
  try {
    const result = await Share.share({
      message: shareText,
      title: `${recipe.title} - FridgeWise`,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.log('Error sharing recipe link:', error);
    return false;
  }
};