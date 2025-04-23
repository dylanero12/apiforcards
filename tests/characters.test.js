const request = require('supertest');
const app = require('../index');
const fs = require('fs');
const path = require('path');

describe('Character Endpoints', () => {
  let testToken;
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'testpass',
    confirmPassword: 'testpass'
  };

  beforeAll(async () => {
    // Create test user and get token
    await request(app).post('/api/auth/signup').send(testUser);
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: testUser.password
      });
    testToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Clean up test user
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/users.json'), 'utf8'));
    const updatedUsers = users.filter(user => user.username !== testUser.username);
    fs.writeFileSync(
      path.join(__dirname, '../data/users.json'),
      JSON.stringify(updatedUsers, null, 2)
    );
  });

  describe('GET /api/characters', () => {
    it('should return all characters with valid token', async () => {
      const response = await request(app)
        .get('/api/characters')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Check that each character has the required fields
      response.body.forEach(character => {
        expect(character).toHaveProperty('id');
        expect(character).toHaveProperty('name');
        expect(character).toHaveProperty('imageUrl');
        expect(character).toHaveProperty('description');
        expect(character).toHaveProperty('defeatMusic');
      });
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/characters');

      expect(response.status).toBe(401);
    });

    it('should return 403 with invalid token', async () => {
      const response = await request(app)
        .get('/api/characters')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/character/random', () => {
    it('should return a random character with valid token', async () => {
      const response = await request(app)
        .get('/api/character/random')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('imageUrl');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('defeatMusic');
    });

    it('should return different characters on subsequent calls', async () => {
      const responses = await Promise.all([
        request(app).get('/api/character/random').set('Authorization', `Bearer ${testToken}`),
        request(app).get('/api/character/random').set('Authorization', `Bearer ${testToken}`),
        request(app).get('/api/character/random').set('Authorization', `Bearer ${testToken}`)
      ]);

      const ids = responses.map(r => r.body.id);
      const uniqueIds = new Set(ids);
      
      // There's a small chance this could fail if we randomly get the same character
      // multiple times, but it's very unlikely with multiple characters
      expect(uniqueIds.size).toBeGreaterThan(1);
    });
  });

  describe('GET /api/character/:id', () => {
    it('should return specific character with valid token', async () => {
      // First get all characters to get a valid ID
      const allCharacters = await request(app)
        .get('/api/characters')
        .set('Authorization', `Bearer ${testToken}`);
      
      const testId = allCharacters.body[0].id;

      const response = await request(app)
        .get(`/api/character/${testId}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('imageUrl');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('defeatMusic');
    });

    it('should return 404 for non-existent character', async () => {
      const response = await request(app)
        .get('/api/character/999999')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 404 for invalid character ID', async () => {
      const response = await request(app)
        .get('/api/character/invalid')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Media Files', () => {
    it('should have valid music files for all characters', async () => {
      const response = await request(app)
        .get('/api/characters')
        .set('Authorization', `Bearer ${testToken}`);

      const musicFiles = fs.readdirSync(path.join(__dirname, '../public/music'));
      
      response.body.forEach(character => {
        const musicPath = character.defeatMusic.split('/').pop();
        expect(musicFiles).toContain(musicPath);
      });
    });
  });
}); 