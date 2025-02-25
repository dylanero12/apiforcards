const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3003;

// Define allowed origins
const allowedOrigins = [
  'https://card-memorygame-ecnn00hzn-dylanero12s-projects.vercel.app',
  'https://card-memorygame-cpl5fzvii-dylanero12s-projects.vercel.app',
  'https://card-memorygame-m3xfpbp07-dylanero12s-projects.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

// Enable CORS for specific origins
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('Origin attempted:', origin); // Log attempted origins
      // Allow the origin anyway for now (development mode)
      return callback(null, true);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Origin', 'X-Requested-With'],
  credentials: false,
  optionsSuccessStatus: 200
}));

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
  res.send('OK');
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

// Add CORS headers to all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

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