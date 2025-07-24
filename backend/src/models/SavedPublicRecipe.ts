import mongoose, { Document, Schema } from 'mongoose';

export interface ISavedPublicRecipe extends Document {
  userId: mongoose.Types.ObjectId; // User who saved the recipe
  recipeId: mongoose.Types.ObjectId; // Original public recipe
  cookedAt: Date; // When the user cooked it
  rating?: number; // User's rating (1-5)
  comment?: string; // User's comment
  createdAt: Date;
  updatedAt: Date;
}

const savedPublicRecipeSchema = new Schema<ISavedPublicRecipe>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipeId: {
    type: Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true
  },
  cookedAt: {
    type: Date,
    required: true,
    validate: {
      validator: function(v: Date) {
        return v <= new Date();
      },
      message: 'Cooked date cannot be in the future'
    }
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    required: false
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters'],
    required: false
  }
}, {
  timestamps: true
});

// Compound index to ensure one saved record per user per recipe
savedPublicRecipeSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

// Index for efficient querying
savedPublicRecipeSchema.index({ userId: 1, createdAt: -1 });

export const SavedPublicRecipe = mongoose.model<ISavedPublicRecipe>('SavedPublicRecipe', savedPublicRecipeSchema);