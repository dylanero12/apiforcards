const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3003;

// Simple CORS configuration
app.use(cors({
  origin: '*',  // Allow all origins temporarily
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Origin:', req.headers.origin);
  
  // Add additional headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  next();
});

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

// Load characters from JSON file
const loadCharacters = () => {
    const filePath = path.join(__dirname, 'data', 'characters.json');
    const rawData = fs.readFileSync(filePath);
    return JSON.parse(rawData).characters;
};

// Get a random character
app.get('/api/character/random', (req, res) => {
    const characters = loadCharacters();
    const randomIndex = Math.floor(Math.random() * characters.length);
    res.json(characters[randomIndex]);
});

// Get a specific character by ID
app.get('/api/character/:id', (req, res) => {
    const characters = loadCharacters();
    const character = characters.find(c => c.id === parseInt(req.params.id));
    if (!character) {
        return res.status(404).json({ message: "Character not found" });
    }
    res.json(character);
});

// Get all characters with optional limit
app.get('/api/characters', (req, res) => {
    const characters = loadCharacters();
    const limit = parseInt(req.query.limit) || characters.length;
    
    // First shuffle all characters
    const shuffledCharacters = shuffleArray([...characters]);
    
    // Then take the first 'limit' characters
    const result = shuffledCharacters.slice(0, limit);
    
    res.json(result);
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