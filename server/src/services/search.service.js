import { postService } from './post.service.js';
import { userService } from './user.service.js';

// Combined type-ahead for the search box: top matching stories + people in one
// call, so the client doesn't fan out two requests per keystroke.
export const searchService = {
  async suggest(query, limit = 5) {
    const q = (query || '').trim();
    if (!q) return { posts: [], users: [] };
    const [posts, users] = await Promise.all([
      postService.searchSuggest(q, limit),
      userService.searchUsers(q, limit),
    ]);
    return { posts, users };
  },
};
