const request = require('supertest');
const app = require('../index');
const fs = require('fs');
const path = require('path');

describe('Static File Serving and CORS', () => {
  describe('Static File Serving', () => {
    it('should serve video files with correct MIME type', async () => {
      const videoFiles = fs.readdirSync(path.join(__dirname, '../public/videos'));
      const testVideo = videoFiles[0]; // Use the first available video file

      const res = await request(app)
        .get(`/videos/${testVideo}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('video/mp4');
      expect(res.headers['accept-ranges']).toBe('bytes');
      expect(res.headers['cache-control']).toContain('public');
    });

    it('should serve music files with correct MIME type', async () => {
      const musicFiles = fs.readdirSync(path.join(__dirname, '../public/music'));
      const testMusic = musicFiles[0]; // Use the first available music file

      const res = await request(app)
        .get(`/music/${testMusic}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('audio/mpeg');
      expect(res.headers['cache-control']).toContain('public');
    });
  });

  describe('CORS', () => {
    it('should allow requests from allowed origins', async () => {
      const res = await request(app)
        .get('/api/characters')
        .set('Origin', 'http://localhost:5173');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('should handle preflight requests', async () => {
      const res = await request(app)
        .options('/api/characters')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.statusCode).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res.headers['access-control-allow-methods']).toContain('GET');
    });
  });
}); 