const request = require('supertest');
const app = require('../app');
const { User, Company, sequelize } = require('../models');

describe('Auth Integration Tests', () => {
  beforeAll(async () => {
    // Sync database but don't force drop (unless purely for testing)
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  const testCompany = {
    companyName: 'Test Corp',
    country: 'USA',
    adminName: 'Test Admin',
    email: 'admin@test.com',
    password: 'Password123!',
  };

  describe('POST /api/v1/auth/signup', () => {
    it('should create a new company and admin user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send(testCompany);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toEqual(testCompany.email);
      expect(res.body.data.token).toBeDefined();
    });

    it('should fail with invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ ...testCompany, email: 'invalid-email' });

      expect(res.statusCode).toEqual(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login an existing user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testCompany.email,
          password: testCompany.password,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testCompany.email,
          password: 'wrongpassword',
        });

      expect(res.statusCode).toEqual(401);
    });
  });
});
