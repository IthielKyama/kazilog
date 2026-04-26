export const PASSWORD_POLICY_MESSAGE =
  'Use at least 8 characters with uppercase, lowercase, a number, and a special character.';

export const PASSWORD_POLICY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function isStrongPassword(password = '') {
  return PASSWORD_POLICY_REGEX.test(password);
}
