import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { VideoModel, CommentModel } from '../models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VIDEOS_DIR = path.join(__dirname, '..', '..', 'public', 'videos');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the environment variables.');
  process.exit(1);
}

// Clean up file name to create a nice user-facing title
function formatTitle(filename: string): string {
  let name = filename.replace(/\.mp4$/i, ''); // Remove .mp4 extension
  name = name.replace(/^vidssave\.com\s*/i, ''); // Remove downloader site tag
  name = name.replace(/#\w+/g, ''); // Remove hashtags
  name = name.replace(/[\d]+P$/i, ''); // Remove resolution like 240P, 720P
  name = name.replace(/[_-]/g, ' '); // Replace hyphens/underscores with spaces
  name = name.replace(/\s+/g, ' ').trim(); // Clean double spaces
  
  if (!name || name.toLowerCase().startsWith('videoplayback')) {
    // Generate fallback nice title
    const match = filename.match(/\((\d+)\)/);
    const index = match ? match[1] : '1';
    return `Style Showcase Vol. ${index}`;
  }

  // Capitalize first letter of each word
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Create a descriptive description based on the file name
function generateDescription(title: string): string {
  if (title.toLowerCase().includes('style') || title.toLowerCase().includes('showcase')) {
    return 'Streetwear aesthetic and fit checks from our summer collections.';
  }
  if (title.toLowerCase().includes('gym') || title.toLowerCase().includes('bench')) {
    return 'Gym sessions and hilarious moments working out with the gym squad.';
  }
  if (title.toLowerCase().includes('trader')) {
    return 'Late night hustle, setup, and trading charts overview.';
  }
  if (title.toLowerCase().includes('love') || title.toLowerCase().includes('bollywood')) {
    return 'A sweet romantic highlight showcasing styling in outfits.';
  }
  return `Featured streetwear look: ${title}. Rate this outfit from 1-10!`;
}

async function seedCustomVideos() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI!);
    console.log('Successfully connected to MongoDB Atlas!');

    // Read all mp4 files in directory
    if (!fs.existsSync(VIDEOS_DIR)) {
      console.error(`Videos directory not found at: ${VIDEOS_DIR}`);
      process.exit(1);
    }

    const files = fs.readdirSync(VIDEOS_DIR).filter(file => file.endsWith('.mp4'));
    if (files.length === 0) {
      console.log('No .mp4 files found in the videos directory.');
      process.exit(0);
    }

    console.log(`Found ${files.length} custom video files. Clearing old collections...`);
    
    // Clear old documents
    await VideoModel.deleteMany({});
    await CommentModel.deleteMany({});
    console.log('Cleared existing videos and comments from Atlas.');

    const userPool = ['hype_beast', 'street_wear_king', 'retro_glow', 'fit_check_girl', 'aesthetic_guy', 'drip_creator'];
    const commentPool = [
      'This outfit is pure fire! 🔥 Where did you get the jacket?',
      'Love the edit, transitions are super smooth.',
      'Gym motivation right here! 💪 Let\'s go!',
      'Song name? Fits the vibe perfectly.',
      '10/10 for the styling, definitely saving this for inspo.'
    ];

    // Step 1: Standardize all physical filenames on disk first
    for (let i = 0; i < files.length; i++) {
      const filename = files[i];
      const videoId = `custom-video-${String(i + 1).padStart(3, '0')}`;
      const safeFilename = `${videoId}.mp4`;
      const oldPath = path.join(VIDEOS_DIR, filename);
      const newPath = path.join(VIDEOS_DIR, safeFilename);

      try {
        if (filename !== safeFilename) {
          console.log(`Renaming on disk: "${filename}" -> "${safeFilename}"`);
          fs.renameSync(oldPath, newPath);
        }
      } catch (renameErr: any) {
        console.error(`Failed to rename ${filename}:`, renameErr.message);
      }
    }

    // Read the newly renamed files list
    const renamedFiles = fs.readdirSync(VIDEOS_DIR).filter(file => file.endsWith('.mp4'));
    const totalFiles = renamedFiles.length;

    console.log(`Files standardized. Seeding exactly 30 video records in MongoDB Atlas...`);

    const videosToInsert = [];
    const commentsToInsert = [];
    const targetCount = 30;

    for (let i = 0; i < targetCount; i++) {
      const fileIndex = i % totalFiles;
      const safeFilename = renamedFiles[fileIndex];
      const videoId = `custom-video-${String(i + 1).padStart(3, '0')}`;
      
      let title = formatTitle(safeFilename);
      // If we are repeating a file, add a Part suffix to make the card unique
      if (i >= totalFiles) {
        const partNumber = Math.floor(i / totalFiles) + 1;
        title = `${title} (Part ${partNumber})`;
      }
      
      const description = generateDescription(title);

      // Cycle through our 5 downloaded picsum thumbnails
      const thumbIndex = (i % 5) + 1;
      const thumbnail = `/thumbnails/thumbnail-00${thumbIndex}.jpg`;
      const videoUrl = `/videos/${safeFilename}`;

      videosToInsert.push({
        id: videoId,
        title,
        description,
        thumbnail,
        videoUrl,
        likes: Math.floor(Math.random() * 150) + 20,
        shares: Math.floor(Math.random() * 40) + 5,
        likedBy: [],
      });

      // Generate 2-4 comments for each custom video card
      const numComments = Math.floor(Math.random() * 3) + 2;
      for (let c = 0; c < numComments; c++) {
        const username = userPool[Math.floor(Math.random() * userPool.length)];
        const text = commentPool[Math.floor(Math.random() * commentPool.length)];
        commentsToInsert.push({
          videoId,
          username,
          text,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000)),
        });
      }
    }

    await VideoModel.insertMany(videosToInsert);
    await CommentModel.insertMany(commentsToInsert);

    console.log(`Successfully registered all ${files.length} of your custom videos in MongoDB Atlas!`);
    mongoose.connection.close();
    console.log('MongoDB connection closed.');
  } catch (error) {
    console.error('Error seeding custom videos:', error);
    process.exit(1);
  }
}

seedCustomVideos();
