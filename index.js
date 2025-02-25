const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3003;

// CORS configuration
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());
app.use(express.static('public'));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Character Cards API is running',
    endpoints: {
      getAllCharacters: '/api/characters',
      getRandomCharacter: '/api/character/random',
      getCharacterById: '/api/character/:id'
    }
  });
});

// Add proper MIME type for MP3 files and videos
app.use('/music', express.static(path.join(__dirname, 'public/music'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.mp3')) {
      res.set('Content-Type', 'audio/mpeg');
    }
  }
}));

app.use('/videos', express.static(path.join(__dirname, 'public/videos'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.mp4')) {
      res.set('Content-Type', 'video/mp4');
    }
  }
}));

// Load characters from JSON file
const loadCharacters = () => {
    const filePath = path.join(__dirname, 'data', 'characters.json');
    const rawData = fs.readFileSync(filePath);
    return JSON.parse(rawData).characters;
};

// Get all characters with optional limit
app.get('/api/characters', (req, res) => {
    try {
        console.log('Fetching characters...');
        const characters = loadCharacters();
        console.log(`Loaded ${characters.length} characters`);
        
        const limit = parseInt(req.query.limit) || characters.length;
        console.log(`Requested limit: ${limit}`);
        
        // First shuffle all characters
        const shuffledCharacters = shuffleArray([...characters]);
        
        // Then take the first 'limit' characters
        const result = shuffledCharacters.slice(0, limit);
        console.log(`Returning ${result.length} characters`);
        
        // Set comprehensive headers
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        // Send the response
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in /api/characters:', error);
        res.status(500).json({ 
            error: 'Failed to load characters',
            details: error.message 
        });
    }
});

// Get a random character
app.get('/api/character/random', (req, res) => {
    try {
        const characters = loadCharacters();
        const randomIndex = Math.floor(Math.random() * characters.length);
        res.json(characters[randomIndex]);
    } catch (error) {
        console.error('Error getting random character:', error);
        res.status(500).json({ error: 'Failed to get random character' });
    }
});

// Get a specific character by ID
app.get('/api/character/:id', (req, res) => {
    try {
        const characters = loadCharacters();
        const character = characters.find(c => c.id === parseInt(req.params.id));
        if (!character) {
            return res.status(404).json({ message: "Character not found" });
        }
        res.json(character);
    } catch (error) {
        console.error('Error getting character by ID:', error);
        res.status(500).json({ error: 'Failed to get character' });
    }
});

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