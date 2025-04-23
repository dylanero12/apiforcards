const request = require('supertest');
const app = require('../index');
const fs = require('fs');
const path = require('path');

describe('Authentication Endpoints', () => {
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'testpass',
    confirmPassword: 'testpass'
  };

  beforeEach(() => {
    // Reset users.json to initial state before each test
    const initialUsers = { users: [] };
    fs.writeFileSync(
      path.join(__dirname, '../data/users.json'),
      JSON.stringify(initialUsers, null, 2)
    );
  });

  afterAll(() => {
    // Clean up test user
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/users.json'), 'utf8'));
    const updatedUsers = users.filter(user => user.username !== testUser.username);
    fs.writeFileSync(
      path.join(__dirname, '../data/users.json'),
      JSON.stringify(updatedUsers, null, 2)
    );
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user and return a token', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('username', testUser.username);
      expect(response.body.user).toHaveProperty('email', testUser.email);
    });

    it('should return 400 if passwords do not match', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          ...testUser,
          confirmPassword: 'differentpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Passwords do not match');
    });

    it('should return 400 if username already exists', async () => {
      // First create a user
      await request(app).post('/api/auth/signup').send(testUser);

      // Try to create another user with same username
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          ...testUser,
          email: 'different@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Username already exists');
    });

    it('should return 400 if email already exists', async () => {
      // First create a user
      await request(app).post('/api/auth/signup').send(testUser);

      // Try to create another user with same email
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          ...testUser,
          username: 'differentuser'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Email already exists');
    });

    it('should return 400 if any required field is missing', async () => {
      const requiredFields = ['username', 'email', 'password', 'confirmPassword'];
      
      for (const field of requiredFields) {
        const userData = { ...testUser };
        delete userData[field];
        
        const response = await request(app)
          .post('/api/auth/signup')
          .send(userData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'All fields are required');
      }
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a user to test login
      await request(app).post('/api/auth/signup').send(testUser);
    });

    it('should login with correct credentials and return a token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should return 401 with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid username or password');
    });

    it('should return 401 with non-existent username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: testUser.password
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid username or password');
    });

    it('should return 400 if username or password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username
          // password is missing
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Username and password are required');
    });
  });
}); 