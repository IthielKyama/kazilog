const asyncHandler = require('../../utils/asyncHandler');

describe('asyncHandler', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  test('calls the wrapped function with req, res, next', async () => {
    const mockFn = jest.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(mockFn);

    await wrapped(mockReq, mockRes, mockNext);

    expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
  });

  test('passes through successful async functions', async () => {
    const mockFn = jest.fn(async (req, res) => {
      res.status(200).json({ success: true });
    });

    const wrapped = asyncHandler(mockFn);
    await wrapped(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('catches rejected promises and forwards error to next()', async () => {
    const error = new Error('Something went wrong');
    const mockFn = jest.fn().mockRejectedValue(error);

    const wrapped = asyncHandler(mockFn);
    await wrapped(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  test('catches thrown errors and forwards to next()', async () => {
    const error = new Error('Thrown error');
    const mockFn = jest.fn(async () => {
      throw error;
    });

    const wrapped = asyncHandler(mockFn);
    await wrapped(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});
