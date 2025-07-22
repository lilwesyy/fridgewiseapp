import mongoose, { Document, Schema, Model } from 'mongoose';

interface IDailyUsage extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // Format: YYYY-MM-DD
  recipeGenerations: number;
  aiChatMessages: number;
  imageAnalyses: number;
  createdAt: Date;
  updatedAt: Date;
}

interface IDailyUsageModel extends Model<IDailyUsage> {
  getTodayUsage(userId: string): Promise<IDailyUsage>;
  incrementRecipeGeneration(userId: string): Promise<IDailyUsage>;
  incrementAiChat(userId: string): Promise<IDailyUsage>;
  incrementImageAnalysis(userId: string): Promise<IDailyUsage>;
}

const dailyUsageSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String,
    required: true,
    // Format: YYYY-MM-DD
  },
  recipeGenerations: {
    type: Number,
    default: 0,
    min: 0
  },
  aiChatMessages: {
    type: Number,
    default: 0,
    min: 0
  },
  imageAnalyses: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
dailyUsageSchema.index({ userId: 1, date: 1 }, { unique: true });

// Automatically delete records older than 30 days
dailyUsageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Helper methods
dailyUsageSchema.statics.getTodayUsage = async function(userId: string) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  let usage = await this.findOne({ userId, date: today });
  
  if (!usage) {
    try {
      usage = await this.create({
        userId,
        date: today,
        recipeGenerations: 0,
        aiChatMessages: 0,
        imageAnalyses: 0
      });
    } catch (error: any) {
      // Handle race condition - if another request already created the document
      if (error.code === 11000) {
        usage = await this.findOne({ userId, date: today });
        if (!usage) {
          throw new Error('Failed to retrieve daily usage after duplicate key error');
        }
      } else {
        throw error;
      }
    }
  }
  
  return usage;
};

dailyUsageSchema.statics.incrementRecipeGeneration = async function(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  const result = await this.findOneAndUpdate(
    { userId, date: today },
    { 
      $inc: { recipeGenerations: 1 },
      $setOnInsert: { 
        userId, 
        date: today, 
        aiChatMessages: 0, 
        imageAnalyses: 0 
      }
    },
    { 
      upsert: true, 
      new: true,
      setDefaultsOnInsert: true
    }
  );
  
  return result;
};

dailyUsageSchema.statics.incrementAiChat = async function(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  const result = await this.findOneAndUpdate(
    { userId, date: today },
    { 
      $inc: { aiChatMessages: 1 },
      $setOnInsert: { 
        userId, 
        date: today, 
        recipeGenerations: 0, 
        imageAnalyses: 0 
      }
    },
    { 
      upsert: true, 
      new: true,
      setDefaultsOnInsert: true
    }
  );
  
  return result;
};

dailyUsageSchema.statics.incrementImageAnalysis = async function(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  const result = await this.findOneAndUpdate(
    { userId, date: today },
    { 
      $inc: { imageAnalyses: 1 },
      $setOnInsert: { 
        userId, 
        date: today, 
        recipeGenerations: 0, 
        aiChatMessages: 0 
      }
    },
    { 
      upsert: true, 
      new: true,
      setDefaultsOnInsert: true
    }
  );
  
  return result;
};

export const DailyUsage = mongoose.model<IDailyUsage, IDailyUsageModel>('DailyUsage', dailyUsageSchema);
export { IDailyUsage };