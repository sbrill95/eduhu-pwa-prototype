import request from 'supertest';
import app from '../app';
import path from 'path';

describe('POST /api/files/upload', () => {
  it('should upload a file and return a file object', async () => {
    const filePath = path.resolve(__dirname, './test-files/test.txt');

    const response = await request(app)
      .post('/api/files/upload')
      .attach('file', filePath);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.filename).toBeDefined();
    expect(response.body.data.size).toBeDefined();
    expect(response.body.data.type).toBeDefined();
  });

  it('should return an error if no file is uploaded', async () => {
    const response = await request(app).post('/api/files/upload');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('No file uploaded.');
  });
});
