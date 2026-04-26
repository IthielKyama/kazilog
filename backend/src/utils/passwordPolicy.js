const crypto = require('crypto');

const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.';

const PASSWORD_POLICY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const isStrongPassword = (password = '') => PASSWORD_POLICY_REGEX.test(password);

const assertStrongPassword = (password) => {
  if (!isStrongPassword(password)) {
    throw new Error(PASSWORD_POLICY_MESSAGE);
  }
};

const generateTemporaryPassword = () => {
  const randomChunk = crypto.randomBytes(4).toString('hex');
  return `Temp!${randomChunk}9A`;
};

module.exports = {
  PASSWORD_POLICY_MESSAGE,
  isStrongPassword,
  assertStrongPassword,
  generateTemporaryPassword,
};
