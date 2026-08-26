import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { ensureAssetsDownloaded, FALLBACK_VIDEOS, FALLBACK_THUMBNAILS } from './utils/assetDownloader.js';
import { VideoModel, CommentModel } from './models.js';
import { LikeResponse, ShareResponse } from './types.js';

// Resolve directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI is not defined in the environment variables.');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// Serve static public folder for downloaded videos and thumbnails
app.use(express.static(PUBLIC_DIR));

// Seed Database in MongoDB Atlas
async function seedDatabase(useFallback: boolean) {
  try {
    const videoCount = await VideoModel.countDocuments();
    if (videoCount > 0) {
      console.log(`Database already has ${videoCount} videos. Skipping seeding...`);
      return;
    }

    console.log('MongoDB collections are empty. Seeding database with 40 records in Atlas...');

    const cities = ['Goa', 'Jaipur', 'Manali', 'Mumbai', 'Kerala', 'Ladakh', 'Delhi', 'Bangalore', 'Coorg', 'Agra'];
    const verbs = ['Exploring', 'Adventure in', 'Backpacking through', 'Unseen spots of', 'Vibes from', 'Weekend trip to', 'Road trip to', 'Chasing sunsets in', 'Food tour in', 'Wandering in'];
    const descriptions = [
      'Amazing weekend experience, highly recommend!',
      'An absolute dream come true, the scenery was breathtaking.',
      'Cannot wait to visit this place again. Loved the local culture.',
      'Exploring the hidden gems and secret locations.',
      'A quick recap of our journey through this beautiful location.',
      'Best travel experience of the year. Captured some beautiful moments.',
      'Living life one trip at a time. Pure paradise.',
      'Felt closer to nature than ever. Super serene environment.',
      'Delicious food, friendly locals, and a rich history.',
      'This view alone was worth the long drive!'
    ];
    const userPool = ['travel_bug', 'nomad_sam', 'wander_girl', 'pixel_explorer', 'curious_john', 'backpacker_lisa', 'drone_lens', 'local_guide_raj', 'nature_lover', 'street_eats'];
    const commentTexts = [
      'Wow, this looks absolutely stunning! Adding to my list.',
      'Which camera/lens was this filmed on? The quality is amazing.',
      'I was there last summer, and it is indeed a magical place.',
      'Loved the transition at 0:05! Super neat edit.',
      'What is the best time of year to visit this location?',
      'This video makes me want to pack my bags and leave right now!',
      'Is it budget-friendly for solo travelers?',
      'Super helpful guide. Thanks for sharing the location details!',
      'Unreal views! The soundtrack matches the vibe perfectly.',
      'Been there twice, still can\'t get enough of it.'
    ];

    const videosToInsert = [];
    const commentsToInsert = [];

    for (let i = 1; i <= 40; i++) {
      const videoIndex = (i - 1) % 5;
      const city = cities[(i - 1) % cities.length];
      const verb = verbs[Math.floor(Math.random() * verbs.length)];
      const title = `${verb} ${city}`;
      const desc = descriptions[Math.floor(Math.random() * descriptions.length)];

      let videoUrl = `/videos/video-00${videoIndex + 1}.mp4`;
      let thumbnail = `/thumbnails/thumbnail-00${videoIndex + 1}.jpg`;

      if (useFallback) {
        videoUrl = FALLBACK_VIDEOS[videoIndex];
        thumbnail = FALLBACK_THUMBNAILS[videoIndex];
      }

      const videoId = `video-${String(i).padStart(3, '0')}`;
      
      videosToInsert.push({
        id: videoId,
        title,
        description: desc,
        thumbnail,
        videoUrl,
        likes: Math.floor(Math.random() * 400) + 50,
        shares: Math.floor(Math.random() * 80) + 10,
        likedBy: [],
      });

      // Add comments
      const numComments = Math.floor(Math.random() * 3) + 2;
      for (let c = 0; c < numComments; c++) {
        const username = userPool[Math.floor(Math.random() * userPool.length)];
        const text = commentTexts[Math.floor(Math.random() * commentTexts.length)];
        const createdAt = new Date(Date.now() - Math.floor(Math.random() * 100000000));
        
        commentsToInsert.push({
          videoId,
          username,
          text,
          createdAt,
        });
      }
    }

    await VideoModel.insertMany(videosToInsert);
    await CommentModel.insertMany(commentsToInsert);
    
    console.log(`Successfully seeded database inside MongoDB Atlas!`);
  } catch (error) {
    console.error('Error seeding MongoDB database:', error);
  }
}

// REST API routes

// GET /api/videos - returns all videos from Atlas with merged comments
app.get('/api/videos', async (req, res) => {
  try {
    const dbVideos = await VideoModel.find().lean();
    const dbComments = await CommentModel.find().sort({ createdAt: -1 }).lean();

    const videosWithComments = dbVideos.map(video => {
      const videoComments = dbComments
        .filter(c => c.videoId === video.id)
        .map(c => ({
          id: c._id.toString(),
          videoId: c.videoId,
          username: c.username,
          text: c.text,
          createdAt: c.createdAt.toISOString()
        }));

      return {
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail,
        videoUrl: video.videoUrl,
        likes: video.likes,
        shares: video.shares,
        comments: videoComments,
      };
    });

    res.json(videosWithComments);
  } catch (error) {
    console.error('GET /api/videos error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/videos - admin route to insert a custom video document into MongoDB Atlas
app.post('/api/videos', async (req, res) => {
  try {
    const { id, title, description, thumbnail, videoUrl } = req.body;

    if (!id || !title || !thumbnail || !videoUrl) {
      res.status(400).json({ error: 'id, title, thumbnail, and videoUrl are required in the request body.' });
      return;
    }

    // Check if ID is unique
    const existingVideo = await VideoModel.findOne({ id });
    if (existingVideo) {
      res.status(400).json({ error: `A video with ID "${id}" already exists.` });
      return;
    }

    const newVideo = new VideoModel({
      id,
      title,
      description: description || '',
      thumbnail,
      videoUrl,
      likes: 0,
      shares: 0,
      likedBy: []
    });

    await newVideo.save();
    console.log(`Custom video added to Atlas: ${title} (${id})`);
    res.status(201).json(newVideo);
  } catch (error: any) {
    console.error('POST /api/videos error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/videos/:id/like - toggles the like in Atlas
app.post('/api/videos/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'userId is required in request body.' });
      return;
    }

    const video = await VideoModel.findOne({ id });
    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    const alreadyLiked = video.likedBy.includes(userId);
    let liked = false;

    if (alreadyLiked) {
      // Pull user from liked list
      video.likedBy = video.likedBy.filter(uid => uid !== userId);
      video.likes = Math.max(0, video.likes - 1);
      liked = false;
    } else {
      // Push user to liked list
      video.likedBy.push(userId);
      video.likes += 1;
      liked = true;
    }

    await video.save();

    const response: LikeResponse = {
      videoId: id,
      likes: video.likes,
      liked,
    };
    res.json(response);
  } catch (error) {
    console.error('POST /api/videos/:id/like error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/videos/:id/share - increments share count in Atlas
app.post('/api/videos/:id/share', async (req, res) => {
  try {
    const { id } = req.params;
    const { platform } = req.body;

    const video = await VideoModel.findOne({ id });
    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    video.shares += 1;
    await video.save();

    const response: ShareResponse = {
      videoId: id,
      shares: video.shares,
      platform: platform || 'copy',
    };
    res.json(response);
  } catch (error) {
    console.error('POST /api/videos/:id/share error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/videos/:id/comments - fetches comments for a video from Atlas
app.get('/api/videos/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await CommentModel.find({ videoId: id }).sort({ createdAt: -1 }).lean();
    
    const formatted = comments.map(c => ({
      id: c._id.toString(),
      videoId: c.videoId,
      username: c.username,
      text: c.text,
      createdAt: c.createdAt.toISOString()
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('GET /api/videos/:id/comments error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/videos/:id/comments - creates a comment in Atlas
app.post('/api/videos/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, text } = req.body;

    if (!username || !text) {
      res.status(400).json({ error: 'username and text are required' });
      return;
    }

    const video = await VideoModel.findOne({ id });
    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    const newComment = new CommentModel({
      videoId: id,
      username,
      text,
      createdAt: new Date(),
    });

    await newComment.save();

    res.status(201).json({
      id: newComment._id.toString(),
      videoId: newComment.videoId,
      username: newComment.username,
      text: newComment.text,
      createdAt: newComment.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('POST /api/videos/:id/comments error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start server and connect to MongoDB
async function startServer() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI!);
    console.log('Successfully connected to MongoDB Atlas!');

    const downloadResult = await ensureAssetsDownloaded();
    await seedDatabase(downloadResult.useFallback);

    app.listen(PORT, () => {
      console.log(`Backend server running at http://localhost:${PORT}`);
      console.log(`Static assets served from ${PUBLIC_DIR}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
