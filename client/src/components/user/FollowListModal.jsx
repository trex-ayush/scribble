import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { usersApi } from '../../api/users.js';
import { UserCard } from './UserCard.jsx';

const TITLES = { followers: 'Followers', following: 'Following' };

export const FollowListModal = ({ username, type, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res =
          type === 'followers'
            ? await usersApi.getFollowers(username)
            : await usersApi.getFollowing(username);
        setUsers(res.data.data.users);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [username, type]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-pencil/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[80vh] flex flex-col bg-paper border-2 border-pencil shadow-hard-lg wobbly-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-dashed border-pencil">
          <h2 className="font-heading text-2xl text-pencil">{TITLES[type]}</h2>
          <button
            onClick={onClose}
            className="p-1 text-pencil/60 hover:text-accent transition-colors"
            aria-label="Close"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-5 overflow-auto space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-7 h-7 border-4 border-pencil border-t-accent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center font-body text-pencil/60 py-8">
              No {TITLES[type].toLowerCase()} yet.
            </p>
          ) : (
            users.map((u) => (
              <div key={u._id} onClick={onClose}>
                <UserCard user={u} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
