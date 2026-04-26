const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');
const { protect, authorize, optionalAuth } = require('../../middlewares/authMiddleware');

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

// Helper to create a user and get a valid token
const createTestUser = async (role = 'student') => {
  const user = await User.create({
    name: 'Test User',
    email: `${role}-${Date.now()}@test.com`,
    password: 'password123',
    role,
    registrationNumber: role === 'student' ? 'STU-001' : undefined,
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { user, token };
};

describe('protect middleware', () => {
  let mockRes, mockNext;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  test('attaches user to req with valid token', async () => {
    const { user, token } = await createTestUser();
    const mockReq = {
      headers: { authorization: `Bearer ${token}` },
    };

    await protect(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toBeDefined();
    expect(mockReq.user._id.toString()).toBe(user._id.toString());
    expect(mockReq.user.password).toBeUndefined(); // password excluded via select: false
  });

  test('returns 401 when no token is provided', async () => {
    const mockReq = { headers: {} };

    // asyncHandler wraps it, so we need to catch the error via next
    await protect(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  test('returns 401 when token is invalid', async () => {
    const mockReq = {
      headers: { authorization: 'Bearer invalid-token-here' },
    };

    await protect(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  test('returns 401 when token has expired', async () => {
    const { user } = await createTestUser();
    const expiredToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '0s' });

    // Wait a moment for the token to expire
    await new Promise(r => setTimeout(r, 100));

    const mockReq = {
      headers: { authorization: `Bearer ${expiredToken}` },
    };

    await protect(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  test('returns 401 when Authorization header has wrong format', async () => {
    const mockReq = {
      headers: { authorization: 'Token some-token-here' },
    };

    await protect(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('authorize middleware', () => {
  test('calls next() when user has allowed role', () => {
    const mockReq = { user: { role: 'admin' } };
    const mockRes = { status: jest.fn().mockReturnThis() };
    const mockNext = jest.fn();

    const middleware = authorize('admin', 'supervisor');
    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  test('throws 403 when user role is not allowed', () => {
    const mockReq = { user: { role: 'student' } };
    const mockRes = { status: jest.fn().mockReturnThis() };
    const mockNext = jest.fn();

    const middleware = authorize('admin', 'supervisor');

    expect(() => middleware(mockReq, mockRes, mockNext)).toThrow(
      'User role student is not authorized to access this route'
    );
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('works with single role', () => {
    const mockReq = { user: { role: 'assessor' } };
    const mockRes = { status: jest.fn().mockReturnThis() };
    const mockNext = jest.fn();

    const middleware = authorize('assessor');
    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});

describe('optionalAuth middleware', () => {
  test('attaches user when valid token is provided', async () => {
    const { user, token } = await createTestUser();
    const mockReq = {
      headers: { authorization: `Bearer ${token}` },
    };
    const mockRes = {};
    const mockNext = jest.fn();

    await optionalAuth(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toBeDefined();
    expect(mockReq.user._id.toString()).toBe(user._id.toString());
  });

  test('proceeds without error when no token is provided', async () => {
    const mockReq = { headers: {} };
    const mockRes = {};
    const mockNext = jest.fn();

    await optionalAuth(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toBeUndefined();
  });

  test('proceeds with null user when token is invalid', async () => {
    const mockReq = {
      headers: { authorization: 'Bearer bad-token' },
    };
    const mockRes = {};
    const mockNext = jest.fn();

    await optionalAuth(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toBeNull();
  });
});
