const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
  process.env.NODE_ENV = 'test';
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('User Model', () => {

  describe('Creation & Validation', () => {
    test('creates a user successfully with valid data', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@test.com',
        password: 'password123',
        role: 'student',
        registrationNumber: 'STU-001',
      });

      expect(user._id).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@test.com');
      expect(user.role).toBe('student');
      expect(user.registrationNumber).toBe('STU-001');
      expect(user.createdAt).toBeDefined();
    });

    test('defaults role to student', async () => {
      const user = await User.create({
        name: 'Default Role',
        email: 'default@test.com',
        password: 'password123',
        registrationNumber: 'STU-002',
      });

      expect(user.role).toBe('student');
    });

    test('fails when name is missing', async () => {
      await expect(
        User.create({
          email: 'noname@test.com',
          password: 'password123',
        })
      ).rejects.toThrow();
    });

    test('fails when email is missing', async () => {
      await expect(
        User.create({
          name: 'No Email',
          password: 'password123',
        })
      ).rejects.toThrow();
    });

    test('fails when password is missing', async () => {
      await expect(
        User.create({
          name: 'No Password',
          email: 'nopassword@test.com',
        })
      ).rejects.toThrow();
    });

    test('fails with invalid email format', async () => {
      await expect(
        User.create({
          name: 'Bad Email',
          email: 'not-an-email',
          password: 'password123',
        })
      ).rejects.toThrow();
    });

    test('fails with duplicate email', async () => {
      await User.create({
        name: 'First User',
        email: 'duplicate@test.com',
        password: 'password123',
        registrationNumber: 'STU-003',
      });

      await expect(
        User.create({
          name: 'Second User',
          email: 'duplicate@test.com',
          password: 'password456',
          registrationNumber: 'STU-004',
        })
      ).rejects.toThrow();
    });

    test('fails with invalid role', async () => {
      await expect(
        User.create({
          name: 'Bad Role',
          email: 'badrole@test.com',
          password: 'password123',
          role: 'superuser',
        })
      ).rejects.toThrow();
    });

    test('fails with password shorter than 6 characters', async () => {
      await expect(
        User.create({
          name: 'Short Pass',
          email: 'short@test.com',
          password: '12345',
          registrationNumber: 'STU-005',
        })
      ).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    test('hashes password on create (not stored in plain text)', async () => {
      const user = await User.create({
        name: 'Hash Test',
        email: 'hash@test.com',
        password: 'password123',
        registrationNumber: 'STU-010',
      });

      // Fetch with password selected
      const userWithPassword = await User.findById(user._id).select('+password');
      expect(userWithPassword.password).not.toBe('password123');
      expect(userWithPassword.password.startsWith('$2a$')).toBe(true); // bcrypt prefix
    });

    test('does not re-hash password when other fields are updated', async () => {
      const user = await User.create({
        name: 'No Rehash',
        email: 'norehash@test.com',
        password: 'password123',
        registrationNumber: 'STU-011',
      });

      const original = await User.findById(user._id).select('+password');
      const originalHash = original.password;

      // Update a non-password field
      original.name = 'Updated Name';
      await original.save();

      const updated = await User.findById(user._id).select('+password');
      expect(updated.password).toBe(originalHash);
    });

    test('re-hashes password when password is changed', async () => {
      const user = await User.create({
        name: 'Rehash Test',
        email: 'rehash@test.com',
        password: 'password123',
        registrationNumber: 'STU-012',
      });

      const original = await User.findById(user._id).select('+password');
      const originalHash = original.password;

      original.password = 'newpassword456';
      await original.save();

      const updated = await User.findById(user._id).select('+password');
      expect(updated.password).not.toBe(originalHash);
      expect(updated.password).not.toBe('newpassword456');
    });
  });

  describe('matchPassword', () => {
    test('returns true for correct password', async () => {
      const user = await User.create({
        name: 'Match Test',
        email: 'match@test.com',
        password: 'password123',
        registrationNumber: 'STU-020',
      });

      const userWithPassword = await User.findById(user._id).select('+password');
      const isMatch = await userWithPassword.matchPassword('password123');
      expect(isMatch).toBe(true);
    });

    test('returns false for incorrect password', async () => {
      const user = await User.create({
        name: 'No Match',
        email: 'nomatch@test.com',
        password: 'password123',
        registrationNumber: 'STU-021',
      });

      const userWithPassword = await User.findById(user._id).select('+password');
      const isMatch = await userWithPassword.matchPassword('wrongpassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('getResetPasswordToken', () => {
    test('generates a reset token and sets expiry', async () => {
      const user = await User.create({
        name: 'Reset Test',
        email: 'reset@test.com',
        password: 'password123',
        registrationNumber: 'STU-030',
      });

      const resetToken = user.getResetPasswordToken();

      expect(resetToken).toBeDefined();
      expect(typeof resetToken).toBe('string');
      expect(resetToken.length).toBe(40); // 20 bytes in hex = 40 chars
      expect(user.resetPasswordToken).toBeDefined();
      expect(user.resetPasswordExpire).toBeDefined();
      expect(user.resetPasswordExpire.getTime()).toBeGreaterThan(Date.now());
    });

    test('generates different tokens on each call', async () => {
      const user = await User.create({
        name: 'Multi Reset',
        email: 'multireset@test.com',
        password: 'password123',
        registrationNumber: 'STU-031',
      });

      const token1 = user.getResetPasswordToken();
      const hash1 = user.resetPasswordToken;

      const token2 = user.getResetPasswordToken();
      const hash2 = user.resetPasswordToken;

      expect(token1).not.toBe(token2);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Password select: false', () => {
    test('does not return password by default in queries', async () => {
      await User.create({
        name: 'Select Test',
        email: 'select@test.com',
        password: 'password123',
        registrationNumber: 'STU-040',
      });

      const user = await User.findOne({ email: 'select@test.com' });
      expect(user.password).toBeUndefined();
    });

    test('returns password when explicitly selected', async () => {
      await User.create({
        name: 'Select Plus',
        email: 'selectplus@test.com',
        password: 'password123',
        registrationNumber: 'STU-041',
      });

      const user = await User.findOne({ email: 'selectplus@test.com' }).select('+password');
      expect(user.password).toBeDefined();
    });
  });
});
