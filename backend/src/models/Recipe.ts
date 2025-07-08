import mongoose, { Document, Schema } from 'mongoose';

export interface IRecipeIngredient {
  name: string;
  amount: string;
  unit: string;
}

export interface IRecipe extends Document {
  title: string;
  description: string;
  ingredients: IRecipeIngredient[];
  instructions: string[];
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  dietaryTags: string[];
  language: 'en' | 'it';
  userId: mongoose.Types.ObjectId;
  imageUrl?: string;
  originalIngredients: string[];
  createdAt: Date;
  updatedAt: Date;
}

const recipeIngredientSchema = new Schema<IRecipeIngredient>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: String,
    required: true,
    trim: true
  },
  unit: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const recipeSchema = new Schema<IRecipe>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  ingredients: {
    type: [recipeIngredientSchema],
    required: true,
    validate: {
      validator: function(v: IRecipeIngredient[]) {
        return v.length > 0;
      },
      message: 'Recipe must have at least one ingredient'
    }
  },
  instructions: {
    type: [String],
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v.length > 0;
      },
      message: 'Recipe must have at least one instruction'
    }
  },
  cookingTime: {
    type: Number,
    required: true,
    min: 1,
    max: 1440 // 24 hours in minutes
  },
  servings: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  dietaryTags: {
    type: [String],
    default: [],
    validate: {
      validator: function(v: string[]) {
        const validTags = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'soy-free', 'egg-free', 'low-carb', 'keto', 'paleo'];
        return v.every(tag => validTags.includes(tag));
      },
      message: 'Invalid dietary tag'
    }
  },
  language: {
    type: String,
    enum: ['en', 'it'],
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  originalIngredients: {
    type: [String],
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v.length > 0;
      },
      message: 'Recipe must have original ingredients list'
    }
  }
}, {
  timestamps: true
});

// Index for efficient querying
recipeSchema.index({ userId: 1, createdAt: -1 });
recipeSchema.index({ dietaryTags: 1 });
recipeSchema.index({ language: 1 });

export const Recipe = mongoose.model<IRecipe>('Recipe', recipeSchema);