import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

// Resolve directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');
const VIDEOS_DIR = path.join(PUBLIC_DIR, 'videos');
const THUMBNAILS_DIR = path.join(PUBLIC_DIR, 'thumbnails');

const VIDEO_ASSETS = [
  {
    name: 'video-001.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    name: 'video-002.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
  {
    name: 'video-003.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  },
  {
    name: 'video-004.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  },
  {
    name: 'video-005.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  },
];

const THUMBNAIL_ASSETS = [
  {
    name: 'thumbnail-001.jpg',
    url: 'https://picsum.photos/id/10/640/360',
  },
  {
    name: 'thumbnail-002.jpg',
    url: 'https://picsum.photos/id/12/640/360',
  },
  {
    name: 'thumbnail-003.jpg',
    url: 'https://picsum.photos/id/15/640/360',
  },
  {
    name: 'thumbnail-004.jpg',
    url: 'https://picsum.photos/id/18/640/360',
  },
  {
    name: 'thumbnail-005.jpg',
    url: 'https://picsum.photos/id/29/640/360',
  },
];

// Helper function to download a file with redirect support
function downloadFile(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const request = (currentUrl: string, depth = 0) => {
      if (depth > 5) {
        console.error(`Too many redirects for url: ${url}`);
        resolve(false);
        return;
      }

      const client = currentUrl.startsWith('https') ? https : http;
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      };

      client.get(currentUrl, options, (response) => {
        // Handle redirect
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          let redirectUrl = response.headers.location;
          if (!redirectUrl.startsWith('http')) {
            const urlObj = new URL(currentUrl);
            redirectUrl = `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
          }
          request(redirectUrl, depth + 1);
          return;
        }

        if (response.statusCode !== 200) {
          console.error(`Failed to download ${url}: status code ${response.statusCode}`);
          resolve(false);
          return;
        }

        const file = fs.createWriteStream(destPath);
        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve(true);
        });

        file.on('error', (err) => {
          fs.unlink(destPath, () => {}); // Delete file on error
          console.error(`File write error for ${destPath}:`, err.message);
          resolve(false);
        });
      }).on('error', (err) => {
        console.error(`HTTP request error for ${url}:`, err.message);
        resolve(false);
      });
    };

    request(url);
  });
}

export async function ensureAssetsDownloaded(): Promise<{
  success: boolean;
  useFallback: boolean;
}> {
  console.log('Checking static assets...');
  
  // Create directories if they do not exist
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  if (!fs.existsSync(THUMBNAILS_DIR)) fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });

  let allSuccess = true;

  // Download videos
  for (const asset of VIDEO_ASSETS) {
    const destPath = path.join(VIDEOS_DIR, asset.name);
    if (!fs.existsSync(destPath)) {
      console.log(`Downloading ${asset.name} from CDN...`);
      const ok = await downloadFile(asset.url, destPath);
      if (!ok) {
        allSuccess = false;
        console.warn(`Could not download ${asset.name}, server will fall back to external URLs.`);
      } else {
        console.log(`Successfully downloaded ${asset.name}`);
      }
    } else {
      console.log(`${asset.name} already exists.`);
    }
  }

  // Download thumbnails
  for (const asset of THUMBNAIL_ASSETS) {
    const destPath = path.join(THUMBNAILS_DIR, asset.name);
    if (!fs.existsSync(destPath)) {
      console.log(`Downloading ${asset.name} from CDN...`);
      const ok = await downloadFile(asset.url, destPath);
      if (!ok) {
        allSuccess = false;
        console.warn(`Could not download ${asset.name}, server will fall back to external URLs.`);
      } else {
        console.log(`Successfully downloaded ${asset.name}`);
      }
    } else {
      console.log(`${asset.name} already exists.`);
    }
  }

  return {
    success: allSuccess,
    useFallback: !allSuccess,
  };
}

// Export lists of fallback URLs for the DB
export const FALLBACK_VIDEOS = VIDEO_ASSETS.map(a => a.url);
export const FALLBACK_THUMBNAILS = THUMBNAIL_ASSETS.map(a => a.url);
