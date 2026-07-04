import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    name: { type: String, trim: true, maxlength: [60, 'Name too long'] },
    bio: { type: String, maxlength: [300, 'Bio too long'] },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    refreshToken: { type: String, select: false },
    // Public API (Basic Auth) credentials. apiKey is the username, apiSecret
    // is the bcrypt-hashed password (shown in plaintext only once at creation).
    apiKey: { type: String, unique: true, sparse: true, index: true },
    apiSecret: { type: String, select: false },
    // Plaintext secret kept so the owner can always view it in API Settings
    // (trade-off: convenience over write-once secrecy, per product choice).
    apiSecretPlain: { type: String, select: false },
    apiEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Owner-facing view: safe to return to the account owner themselves
// (login / register / me / profile update). Still includes the owner's email.
userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString(); // toObject() omits the `id` virtual; clients compare against `.id`
  delete obj.password;
  delete obj.refreshToken;
  delete obj.apiSecret;
  delete obj.apiSecretPlain;
  return obj;
};

// Third-party view: returned to ANYONE viewing another user's profile.
// Must NOT leak PII or credentials — strips email, API key, and all secrets.
// Keeps follower/following arrays since the UI derives counts + follow state.
userSchema.methods.toProfileJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString(); // clients derive follow-state by comparing against `.id`
  delete obj.password;
  delete obj.refreshToken;
  delete obj.apiSecret;
  delete obj.apiSecretPlain;
  delete obj.email;
  delete obj.apiKey;
  delete obj.apiEnabled;
  return obj;
};

userSchema.methods.compareApiSecret = function (candidate) {
  return bcrypt.compare(candidate, this.apiSecret);
};

userSchema.virtual('followerCount').get(function () {
  return this.followers.length;
});

userSchema.virtual('followingCount').get(function () {
  return this.following.length;
});

export const User = mongoose.model('User', userSchema);
