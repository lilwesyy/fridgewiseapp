import mongoose, { Document, Schema } from 'mongoose';

export interface IIngredient {
  name: string;
  nameIt?: string;
  category: string;
  confidence: number;
}

export interface IAnalysis extends Document {
  ingredients: IIngredient[];
  imageUrl: string;
  userId: mongoose.Types.ObjectId;
  processingTime: number;
  status: 'pending' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ingredientSchema = new Schema<IIngredient>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  nameIt: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    enum: ['vegetables', 'fruits', 'meat', 'dairy', 'grains', 'legumes', 'herbs', 'spices', 'other']
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  }
}, { _id: false });

const analysisSchema = new Schema<IAnalysis>({
  ingredients: {
    type: [ingredientSchema],
    default: []
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  processingTime: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  errorMessage: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
analysisSchema.index({ userId: 1, createdAt: -1 });
analysisSchema.index({ status: 1 });

export const Analysis = mongoose.model<IAnalysis>('Analysis', analysisSchema);