import mongoose, { Document, Schema } from 'mongoose';

export interface IRecipeIngredient {
  name: string;
  amount: string;
  unit: string;
}

export interface IDishPhoto {
  url: string;
  publicId: string;
}

export interface INutritionInfo {
  calories: number;
  protein: number; // grammi
  carbohydrates: number; // grammi
  fat: number; // grammi
  fiber: number; // grammi
  sugar: number; // grammi
  sodium: number; // milligrammi
}

export interface ICookingTip {
  step: number; // Riferimento al numero dello step (1-based)
  tip: string;
  type: 'technique' | 'timing' | 'ingredient' | 'temperature' | 'safety';
}

export interface IRecipe extends Document {
  title: string;
  description: string;
  ingredients: IRecipeIngredient[];
  instructions: string[];
  stepTimers?: number[]; // Timer in minutes for each step
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  dietaryTags: string[];
  language: 'en' | 'it';
  userId: mongoose.Types.ObjectId;
  imageUrl?: string;
  originalIngredients: string[];
  isSaved: boolean;
  dishPhotos: IDishPhoto[];
  cookedAt?: Date;
  completionCount: number;
  isDeleted: boolean;
  deletedAt?: Date;
  nutrition?: INutritionInfo;
  cookingTips: ICookingTip[];
  // Rating system
  averageRating: number;
  totalRatings: number;
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

const nutritionInfoSchema = new Schema<INutritionInfo>({
  calories: {
    type: Number,
    required: true,
    min: [0, 'Calories cannot be negative'],
    max: [10000, 'Calories seems too high']
  },
  protein: {
    type: Number,
    required: true,
    min: [0, 'Protein cannot be negative'],
    max: [1000, 'Protein seems too high']
  },
  carbohydrates: {
    type: Number,
    required: true,
    min: [0, 'Carbohydrates cannot be negative'],
    max: [1000, 'Carbohydrates seems too high']
  },
  fat: {
    type: Number,
    required: true,
    min: [0, 'Fat cannot be negative'],
    max: [1000, 'Fat seems too high']
  },
  fiber: {
    type: Number,
    required: true,
    min: [0, 'Fiber cannot be negative'],
    max: [200, 'Fiber seems too high']
  },
  sugar: {
    type: Number,
    required: true,
    min: [0, 'Sugar cannot be negative'],
    max: [500, 'Sugar seems too high']
  },
  sodium: {
    type: Number,
    required: true,
    min: [0, 'Sodium cannot be negative'],
    max: [10000, 'Sodium seems too high (mg)']
  }
}, { _id: false });

const cookingTipSchema = new Schema<ICookingTip>({
  step: {
    type: Number,
    required: true,
    min: [1, 'Step number must be at least 1']
  },
  tip: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Cooking tip cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['technique', 'timing', 'ingredient', 'temperature', 'safety'],
    required: true
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
  stepTimers: {
    type: [Number],
    required: false,
    validate: {
      validator: function(v: number[]) {
        return !v || v.every(timer => typeof timer === 'number' && timer >= 0);
      },
      message: 'Step timers must be positive numbers'
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
        const validTags = [
          'vegetarian', 'vegan', 'pescatarian', 'gluten-free', 'dairy-free', 'nut-free', 'soy-free', 'egg-free', 'low-carb', 'keto', 'paleo',
          // Tempo di preparazione
          'quick', 'slow-cooking', 'no-cook',
          // Contenuto nutrizionale  
          'high-protein', 'high-fiber', 'low-sodium', 'sugar-free',
          // Stile culinario
          'mediterranean', 'asian', 'italian', 'mexican',
          // Intensità sapore
          'spicy', 'mild',
          // Modalità cottura
          'one-pot', 'grilled', 'baked', 'raw',
          // Diete specializzate
          'whole30', 'fodmap-friendly', 'anti-inflammatory'
        ];
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
  },
  isSaved: {
    type: Boolean,
    default: false
  },
  dishPhotos: {
    type: [{
      url: {
        type: String,
        required: true,
        trim: true,
        validate: {
          validator: function(v: string) {
            return /^https?:\/\/.+/.test(v);
          },
          message: 'Dish photo URL must be a valid HTTP/HTTPS URL'
        }
      },
      publicId: {
        type: String,
        required: true,
        trim: true
      }
    }],
    default: [],
    validate: {
      validator: function(v: IDishPhoto[]) {
        return v.length <= 3;
      },
      message: 'Maximum 3 dish photos allowed'
    }
  },
  cookedAt: {
    type: Date,
    validate: {
      validator: function(v: Date) {
        return !v || v <= new Date();
      },
      message: 'Cooked date cannot be in the future'
    }
  },
  completionCount: {
    type: Number,
    default: 0,
    min: [0, 'Completion count cannot be negative'],
    validate: {
      validator: function(v: number) {
        return Number.isInteger(v);
      },
      message: 'Completion count must be an integer'
    }
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    required: false
  },
  nutrition: {
    type: nutritionInfoSchema,
    required: false
  },
  cookingTips: {
    type: [cookingTipSchema],
    default: [],
    validate: {
      validator: function(v: ICookingTip[]) {
        return v.length <= 20; // Max 20 tips per recipe
      },
      message: 'Maximum 20 cooking tips allowed per recipe'
    }
  },
  // Rating system
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Average rating cannot be negative'],
    max: [5, 'Average rating cannot exceed 5']
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: [0, 'Total ratings cannot be negative']
  }
}, {
  timestamps: true
});

// Index for efficient querying
recipeSchema.index({ userId: 1, createdAt: -1 });
recipeSchema.index({ userId: 1, isSaved: 1 });
recipeSchema.index({ dietaryTags: 1 });
recipeSchema.index({ language: 1 });
recipeSchema.index({ averageRating: -1 }); // For rating-based sorting

export const Recipe = mongoose.model<IRecipe>('Recipe', recipeSchema);