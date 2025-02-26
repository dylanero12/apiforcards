const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
// Load environment variables from .env file
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3003;

// Middleware to enable CORS
const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  return await fn(req, res);
};

app.use(express.json());
app.use(express.static('public'));

// Add proper MIME type for MP3 files
app.use('/music', express.static(path.join(__dirname, 'public/music'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.mp3')) {
      res.set('Content-Type', 'audio/mpeg');
      res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    }
  }
}));


app.use('/health', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send('OK2');
});

app.use('/videos', express.static(path.join(__dirname, 'public/videos'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.mp4')) {
      res.set('Content-Type', 'video/mp4');
      res.set('Accept-Ranges', 'bytes');
      res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    }
  }
}));

app.use('/health', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send('OK2');
});

// Load characters from JSON file
const loadCharacters = () => {
    const filePath = path.join(__dirname, 'data', 'characters.json');
    const rawData = fs.readFileSync(filePath);
    return JSON.parse(rawData).characters;
};

// Helper function to add full URLs to media paths
const addFullUrls = (characters, req) => {
    const baseUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
    
    return characters.map(char => {
        const updatedChar = { ...char };
        
        if (updatedChar.defeatMusic) {
            updatedChar.defeatMusic = `${baseUrl}${updatedChar.defeatMusic}`;
        }
        
        if (updatedChar.defeatVideo) {
            updatedChar.defeatVideo = `${baseUrl}${updatedChar.defeatVideo}`;
        }
        
        return updatedChar;
    });
};

// Wrap API routes with CORS middleware
app.get('/api/characters', allowCors(async (req, res) => {
    const characters = loadCharacters();
    const limit = parseInt(req.query.limit) || characters.length;
    const shuffledCharacters = shuffleArray([...characters]);
    const result = shuffledCharacters.slice(0, limit);
    
    // Add full URLs to media paths
    const charactersWithFullUrls = addFullUrls(result, req);
    
    res.json(charactersWithFullUrls);
}));

app.get('/api/character/random', allowCors(async (req, res) => {
    const characters = loadCharacters();
    const randomIndex = Math.floor(Math.random() * characters.length);
    const character = characters[randomIndex];
    
    // Add full URLs to media paths
    const characterWithFullUrls = addFullUrls([character], req)[0];
    
    res.json(characterWithFullUrls);
}));

app.get('/api/character/:id', allowCors(async (req, res) => {
    const characters = loadCharacters();
    const character = characters.find(c => c.id === parseInt(req.params.id));
    if (!character) {
        return res.status(404).json({ message: "Character not found" });
    }
    
    // Add full URLs to media paths
    const characterWithFullUrls = addFullUrls([character], req)[0];
    
    res.json(characterWithFullUrls);
}));

// Helper function to shuffle array
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

app.listen(port, () => {
    console.log(`Character Cards API running on port ${port}`);
}); 