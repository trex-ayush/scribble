/**
 * One-off cleanup: remove test accounts and their content created during
 * development/testing. Run with:  node scripts/cleanup-test-data.js
 */
import dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']); // match server.js so Atlas SRV resolves
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database.js';
import { User } from '../src/models/user.model.js';
import { Post } from '../src/models/post.model.js';
import { Comment } from '../src/models/comment.model.js';
import { ActivityLog } from '../src/models/activityLog.model.js';

const TEST_USERNAMES = ['logintest', 'actlogtest', 'deltest', 'pgtest'];
const TEST_TITLES = ['Activity test post', 'Second activity test', 'Panel test post', 'Delete me test'];

const run = async () => {
  await connectDB();

  const users = await User.find({ username: { $in: TEST_USERNAMES } });
  const userIds = users.map((u) => u._id);

  const titlePosts = await Post.find({ title: { $in: TEST_TITLES } });
  const allPostIds = [
    ...new Set([
      ...titlePosts.map((p) => p._id.toString()),
      ...(await Post.find({ author: { $in: userIds } })).map((p) => p._id.toString()),
    ]),
  ];

  const res = {
    comments: (await Comment.deleteMany({ post: { $in: allPostIds } })).deletedCount,
    posts: (await Post.deleteMany({ _id: { $in: allPostIds } })).deletedCount,
    activity: (await ActivityLog.deleteMany({ actor: { $in: userIds } })).deletedCount,
    users: (await User.deleteMany({ _id: { $in: userIds } })).deletedCount,
  };

  // Also pull the deleted users out of anyone's followers/following lists.
  if (userIds.length) {
    await User.updateMany({}, { $pull: { followers: { $in: userIds }, following: { $in: userIds } } });
  }

  console.log('Cleanup complete:', res);
  await mongoose.disconnect();
};

run().catch((e) => {
  console.error('Cleanup failed:', e);
  process.exit(1);
});
