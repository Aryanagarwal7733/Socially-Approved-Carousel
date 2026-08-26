import mongoose, { Schema, Document } from 'mongoose';

// Interface matching MongoDB Video Schema
export interface IVideo extends Document {
  id: string; // Friendly unique identifier (e.g. video-001)
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  likes: number;
  shares: number;
  likedBy: string[]; // List of userIds who liked this video
}

// Interface matching MongoDB Comment Schema
export interface IComment extends Document {
  videoId: string;
  username: string;
  text: string;
  createdAt: Date;
}

const VideoSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  thumbnail: { type: String, required: true },
  videoUrl: { type: String, required: true },
  likes: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
});

const CommentSchema: Schema = new Schema({
  videoId: { type: String, required: true, index: true },
  username: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const VideoModel = mongoose.model<IVideo>('Video', VideoSchema);
export const CommentModel = mongoose.model<IComment>('Comment', CommentSchema);
