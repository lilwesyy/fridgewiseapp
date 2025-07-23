import mongoose, { Document, Schema } from 'mongoose';

export interface IRecipeCollection extends Document {
  title: string;
  description: string;
  creatorId: mongoose.Types.ObjectId;
  recipes: mongoose.Types.ObjectId[];
  isPublic: boolean;
  tags: string[];
  followers: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  // Statistiche aggiuntive per la ricerca e ordinamento
  totalRecipes: number;
  totalFollowers: number;
  lastUpdated: Date;
}

const recipeCollectionSchema = new Schema<IRecipeCollection>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Collection title cannot exceed 100 characters'],
    minlength: [3, 'Collection title must be at least 3 characters']
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Collection description cannot exceed 500 characters'],
    minlength: [10, 'Collection description must be at least 10 characters']
  },
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipes: {
    type: [Schema.Types.ObjectId],
    ref: 'Recipe',
    default: [],
    validate: {
      validator: function(v: mongoose.Types.ObjectId[]) {
        return v.length <= 50; // Max 50 recipes per collection
      },
      message: 'Maximum 50 recipes allowed per collection'
    }
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: {
    type: [String],
    default: [],
    validate: {
      validator: function(v: string[]) {
        const validTags = [
          // Cucina per tipo
          'italian', 'mediterranean', 'asian', 'mexican', 'indian', 'french', 'american',
          // Tipo di pasto
          'breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer',
          // Diete speciali
          'vegetarian', 'vegan', 'gluten-free', 'keto', 'paleo', 'low-carb',
          // Tempo di preparazione
          'quick', 'slow-cooking', 'weekend-cooking',
          // Stagioni
          'spring', 'summer', 'autumn', 'winter',
          // Occasioni
          'family', 'romantic', 'party', 'holidays', 'comfort-food',
          // Difficoltà
          'beginner', 'intermediate', 'advanced',
          // Metodi di cottura
          'baked', 'grilled', 'no-cook', 'one-pot'
        ];
        return v.length <= 10 && v.every(tag => validTags.includes(tag));
      },
      message: 'Invalid tags or too many tags (max 10 allowed)'
    }
  },
  followers: {
    type: [Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  totalRecipes: {
    type: Number,
    default: 0,
    min: [0, 'Total recipes cannot be negative']
  },
  totalFollowers: {
    type: Number,
    default: 0,
    min: [0, 'Total followers cannot be negative']
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes per ottimizzare le query
recipeCollectionSchema.index({ isPublic: 1, createdAt: -1 });
recipeCollectionSchema.index({ isPublic: 1, totalFollowers: -1 });
recipeCollectionSchema.index({ tags: 1, isPublic: 1 });
recipeCollectionSchema.index({ creatorId: 1 });
recipeCollectionSchema.index({ title: 'text', description: 'text' });

// Middleware per aggiornare automaticamente le statistiche
recipeCollectionSchema.pre('save', function(next) {
  this.totalRecipes = this.recipes.length;
  this.totalFollowers = this.followers.length;
  this.lastUpdated = new Date();
  next();
});

export const RecipeCollection = mongoose.model<IRecipeCollection>('RecipeCollection', recipeCollectionSchema);