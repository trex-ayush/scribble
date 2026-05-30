import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';

const genKey = () => `sk_${crypto.randomBytes(8).toString('hex')}`; // sk_ + 16 chars
const genSecret = () => crypto.randomBytes(16).toString('hex'); // 32 chars

// Public view of a user's API config. Includes the plaintext secret so the
// owner can always view/copy it from API Settings.
const _settings = (user) => ({
  apiKey: user.apiKey || null,
  apiSecret: user.apiSecretPlain || null,
  apiEnabled: !!user.apiEnabled,
  hasCredentials: !!user.apiKey,
});

const _loadWithSecret = (userId) => User.findById(userId).select('+apiSecretPlain');

export const apiKeyService = {
  async getSettings(userId) {
    const user = await _loadWithSecret(userId);
    if (!user) throw ApiError.notFound('User not found');
    return _settings(user);
  },

  // Create (or rotate) credentials.
  async generate(userId) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const apiKey = user.apiKey || genKey();
    const secret = genSecret();
    user.apiKey = apiKey;
    user.apiSecret = await bcrypt.hash(secret, 12);
    user.apiSecretPlain = secret;
    user.apiEnabled = true;
    await user.save({ validateBeforeSave: false });

    return { apiKey, apiSecret: secret, apiEnabled: true, hasCredentials: true };
  },

  async setEnabled(userId, enabled) {
    const user = await _loadWithSecret(userId);
    if (!user) throw ApiError.notFound('User not found');
    if (!user.apiKey) throw ApiError.badRequest('Generate API credentials first');
    user.apiEnabled = enabled;
    await user.save({ validateBeforeSave: false });
    return _settings(user);
  },

  async revoke(userId) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    user.apiKey = undefined;
    user.apiSecret = undefined;
    user.apiSecretPlain = undefined;
    user.apiEnabled = false;
    await user.save({ validateBeforeSave: false });
    return { apiKey: null, apiSecret: null, apiEnabled: false, hasCredentials: false };
  },
};
