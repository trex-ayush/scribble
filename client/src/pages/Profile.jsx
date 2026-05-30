import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { usersApi } from '../api/users.js';
import { PostCard } from '../components/post/PostCard.jsx';
import { FollowListModal } from '../components/user/FollowListModal.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useAuth } from '../hooks/useAuth.js';

const Spinner = () => (
  <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-4 border-pencil border-t-accent rounded-full animate-spin" />
  </div>
);

export const Profile = () => {
  const { username } = useParams();
  const cleanUsername = username?.replace('@', '') || '';
  const { user: currentUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [modal, setModal] = useState(null); // 'followers' | 'following' | null

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, postsRes] = await Promise.all([
          usersApi.getProfile(cleanUsername),
          usersApi.getUserPosts(cleanUsername),
        ]);
        const p = profileRes.data.data.user;
        setProfile(p);
        setPosts(postsRes.data.data.posts);
        if (currentUser) {
          setFollowing(p.followers?.some((id) => id === currentUser.id) ?? false);
        }
      } catch {
        /* user not found */
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [cleanUsername, currentUser]);

  const handleFollow = async () => {
    try {
      const { data } = await usersApi.toggleFollow(cleanUsername);
      setFollowing(data.data.following);
      setProfile((p) => ({
        ...p,
        followers: data.data.following
          ? [...(p.followers || []), currentUser.id]
          : (p.followers || []).filter((id) => id !== currentUser.id),
      }));
    } catch { /* ignore */ }
  };

  if (loading) return <Spinner />;
  if (!profile) return (
    <div className="text-center py-20">
      <p className="font-heading text-3xl text-pencil">User not found</p>
    </div>
  );

  const isOwnProfile = currentUser?.username === cleanUsername;

  return (
    <div className="space-y-10">
      <section
        className="bg-white border-2 border-pencil shadow-hard p-8 space-y-4 wobbly"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl text-pencil">
              {profile.name || profile.username}
            </h1>
            <p className="font-body text-pencil/60">@{profile.username}</p>
          </div>
          {isAuthenticated && !isOwnProfile && (
            <Button
              variant={following ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleFollow}
            >
              {following ? 'Unfollow' : 'Follow'}
            </Button>
          )}
          {isOwnProfile && (
            <div className="flex gap-2">
              <Link to="/activity">
                <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
                  <Activity size={14} strokeWidth={2.5} />
                  Activity
                </Button>
              </Link>
              <Link to="/settings">
                <Button variant="secondary" size="sm">Edit profile</Button>
              </Link>
            </div>
          )}
        </div>

        {profile.bio && (
          <p className="font-body text-pencil/80 max-w-lg leading-relaxed">{profile.bio}</p>
        )}

        <div className="flex gap-6 font-body text-sm text-pencil/60 pt-2 border-t-2 border-dashed border-muted">
          <button
            onClick={() => setModal('followers')}
            className="hover:text-accent transition-colors"
          >
            <strong className="text-pencil font-heading text-lg">{profile.followers?.length || 0}</strong>
            {' '}followers
          </button>
          <button
            onClick={() => setModal('following')}
            className="hover:text-accent transition-colors"
          >
            <strong className="text-pencil font-heading text-lg">{profile.following?.length || 0}</strong>
            {' '}following
          </button>
          <span>
            <strong className="text-pencil font-heading text-lg">{posts.length}</strong>
            {' '}stories
          </span>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-2xl text-pencil border-b-2 border-dashed border-pencil pb-2">
          {isOwnProfile ? 'Your stories' : 'Stories'}
        </h2>
        {posts.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="font-heading text-2xl text-pencil">No stories yet</p>
            {isOwnProfile && (
              <Link to="/write"><Button>Write your first story</Button></Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post, i) => <PostCard key={post._id} post={post} index={i} />)}
          </div>
        )}
      </section>

      {modal && (
        <FollowListModal
          username={cleanUsername}
          type={modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};
