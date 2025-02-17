// models/generatedContentSchema.js
import mongoose from 'mongoose';

const generatedContentSchema = new mongoose.Schema({
  prompt: {
    type: String,
    required: true,
  },
  result: {
    type: String,
  },
  note:{
    type:String
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const GeneratedContent = mongoose.model('GeneratedContent', generatedContentSchema);

export default GeneratedContent;
