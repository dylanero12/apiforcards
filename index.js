const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// Load environment variables from .env file
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3003;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Determine data directory based on environment
const DATA_DIR = path.join(__dirname, 'data');

// Determine public directory based on environment
const PUBLIC_DIR = path.join(__dirname, 'public');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token is required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

// Add proper MIME type for MP3 files
app.use('/music', express.static(path.join(PUBLIC_DIR, 'music'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.mp3')) {
      res.set('Content-Type', 'audio/mpeg');
      res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    }
  }
}));

app.use('/videos', express.static(path.join(PUBLIC_DIR, 'videos'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.mp4')) {
      res.set('Content-Type', 'video/mp4');
      res.set('Accept-Ranges', 'bytes');
      res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    }
  }
}));

// Load characters from JSON file
const loadCharacters = () => {
    const filePath = path.join(DATA_DIR, 'characters.json');
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const rawData = fs.readFileSync(filePath);
    return JSON.parse(rawData).characters || [];
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

// Load users from JSON file
const loadUsers = () => {
  const filePath = path.join(DATA_DIR, 'users.json');
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const rawData = fs.readFileSync(filePath);
  return JSON.parse(rawData).users || [];
};

// Save users to JSON file
const saveUsers = (users) => {
  const filePath = path.join(DATA_DIR, 'users.json');
  fs.writeFileSync(filePath, JSON.stringify({ users }, null, 2));
};

// Signup endpoint
app.post('/api/auth/signup', async (req, res) => {
  try {
    console.log('Received signup request with body:', req.body);
    const { username, email, password, confirmPassword } = req.body;
    
    console.log('Extracted fields:', { username, email, password: '***', confirmPassword: '***' });
    
    if (!username || !email || !password || !confirmPassword) {
      console.log('Missing fields:', {
        username: !username,
        email: !email,
        password: !password,
        confirmPassword: !confirmPassword
      });
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const users = loadUsers();
    if (users.some(user => user.username === username)) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    if (users.some(user => user.email === email)) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: users.length + 1,
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET);
    res.json({ 
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Received login request with body:', req.body);
    const { username, password } = req.body;
    
    console.log('Extracted fields:', { username, password: '***' });
    
    if (!username || !password) {
      console.log('Missing fields:', {
        username: !username,
        password: !password
      });
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const users = loadUsers();
    const user = users.find(u => u.username === username);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Protected API routes
app.get('/api/characters', authenticateToken, async (req, res) => {
    const characters = loadCharacters();
    const limit = parseInt(req.query.limit) || characters.length;
    const shuffledCharacters = shuffleArray([...characters]);
    const result = shuffledCharacters.slice(0, limit);
    
    // Add full URLs to media paths
    const charactersWithFullUrls = addFullUrls(result, req);
    
    res.json(charactersWithFullUrls);
});

app.get('/api/character/random', authenticateToken, async (req, res) => {
    const characters = loadCharacters();
    const randomIndex = Math.floor(Math.random() * characters.length);
    const character = characters[randomIndex];
    
    // Add full URLs to media paths
    const characterWithFullUrls = addFullUrls([character], req)[0];
    
    res.json(characterWithFullUrls);
});

app.get('/api/character/:id', authenticateToken, async (req, res) => {
    const characters = loadCharacters();
    const character = characters.find(c => c.id === parseInt(req.params.id));
    if (!character) {
        return res.status(404).json({ message: "Character not found" });
    }
    
    // Add full URLs to media paths
    const characterWithFullUrls = addFullUrls([character], req)[0];
    
    res.json(characterWithFullUrls);
});

// Helper function to shuffle array
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// Only start the server if we're not in test mode
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Character Cards API running on port ${port}`);
    });
}

module.exports = app; 