import React, { useEffect, useState, useRef } from 'react';
import { Users, UserPlus, Trash2, Shield, Pencil, Eye, LogIn, MoreVertical, Check, X } from 'lucide-react';
import { teamApi } from '../../api/team.js';
import { workspaceStore } from '../../store/workspaceStore.js';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { useFeedback } from '../../components/feedback/FeedbackProvider.jsx';

const ROLES = [
  { value: 'full', label: 'Full Access', icon: Shield, color: 'text-accent',    desc: 'Create, edit, delete, publish' },
  { value: 'read', label: 'Read Only',   icon: Eye,    color: 'text-pencil/60', desc: 'View content read-only' },
];

const roleMeta = (role) => ROLES.find((r) => r.value === role) || ROLES[1];

const PermissionBadge = ({ role }) => {
  const r = roleMeta(role);
  return (
    <span className={`inline-flex items-center gap-1 font-body text-xs px-2 py-0.5 border border-pencil/30 wobbly-tag ${r.color}`}>
      <r.icon size={11} strokeWidth={2.5} />
      {r.label}
    </span>
  );
};

const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

/* Kebab (3-dot) menu — Update access / Remove access */
const KebabMenu = ({ onUpdate, onRemove, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="p-1.5 text-pencil/50 hover:text-pencil hover:bg-muted rounded transition-colors disabled:opacity-50"
        aria-label="Options"
      >
        <MoreVertical size={16} strokeWidth={2.5} />
      </button>
      {open && (
        <ul
          className="absolute z-30 right-0 mt-1 w-44 bg-white border-2 border-pencil shadow-hard overflow-hidden"
          style={{ borderRadius: '12px 4px 12px 4px / 4px 12px 4px 12px' }}
        >
          <li>
            <button
              onClick={() => { setOpen(false); onUpdate(); }}
              className="flex items-center gap-2 w-full text-left px-3 py-2 font-body text-sm text-pencil hover:bg-muted transition-colors"
            >
              <Pencil size={14} strokeWidth={2.5} />
              Update access
            </button>
          </li>
          <li className="border-t-2 border-dashed border-pencil/20">
            <button
              onClick={() => { setOpen(false); onRemove(); }}
              className="flex items-center gap-2 w-full text-left px-3 py-2 font-body text-sm text-accent hover:bg-accent/10 transition-colors"
            >
              <Trash2 size={14} strokeWidth={2.5} />
              Remove access
            </button>
          </li>
        </ul>
      )}
    </div>
  );
};

/* Modal to pick a new role (never clipped by table overflow) */
const UpdateAccessModal = ({ member, onClose, onSave, saving }) => {
  const [role, setRole] = useState(member.role);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-pencil/40" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-paper border-2 border-pencil shadow-hard-lg p-6 space-y-4"
        style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-heading text-xl text-pencil">Update access</h2>
            <p className="font-body text-sm text-pencil/60">{member.member.email}</p>
          </div>
          <button onClick={onClose} className="text-pencil/50 hover:text-accent transition-colors">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRole(r.value)}
              className={[
                'flex items-start gap-2 w-full text-left px-3 py-2.5 border-2 transition-colors',
                role === r.value ? 'border-pencil bg-muted/50' : 'border-pencil/20 hover:bg-muted/30',
              ].join(' ')}
              style={{ borderRadius: '9px 3px 8px 3px / 3px 8px 3px 9px' }}
            >
              <r.icon size={16} strokeWidth={2.5} className={`${r.color} mt-0.5 shrink-0`} />
              <span className="flex-1">
                <span className="block font-body text-sm text-pencil">{r.label}</span>
                <span className="block font-body text-xs text-pencil/50">{r.desc}</span>
              </span>
              {role === r.value && <Check size={16} strokeWidth={2.5} className="text-ink shrink-0 mt-0.5" />}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={() => onSave(role)}>Save</Button>
        </div>
      </div>
    </div>
  );
};

const Spinner = () => (
  <div className="flex justify-center py-10">
    <div className="w-7 h-7 border-4 border-pencil border-t-accent rounded-full animate-spin" />
  </div>
);

export const TeamMembers = () => {
  const { toast, confirm } = useFeedback();
  const [members, setMembers] = useState([]);
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [editing, setEditing] = useState(null); // member being edited in modal
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ username: '', role: 'full' });
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [teamRes, myTeamsRes] = await Promise.all([teamApi.getTeam(), teamApi.getMyTeams()]);
      setMembers(teamRes.data.data.members);
      setSharedWithMe(myTeamsRes.data.data.teams);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.username.trim()) return;
    setAdding(true);
    try {
      const { data } = await teamApi.addMember(form.username.trim(), form.role);
      setMembers((prev) => [...prev, data.data.member]);
      setForm({ username: '', role: 'full' });
      setShowAdd(false);
      toast.success('Team member added', `${form.username} now has ${roleMeta(form.role).label}.`);
    } catch (err) {
      toast.error('Could not add member', err.response?.data?.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (memberId, name) => {
    const ok = await confirm({
      title: 'Remove access?',
      message: `${name} will lose access to your account immediately.`,
      confirmText: 'Remove',
      tone: 'danger',
    });
    if (!ok) return;
    setBusy(memberId);
    try {
      await teamApi.removeMember(memberId);
      setMembers((prev) => prev.filter((m) => m.member._id !== memberId));
      toast.success('Access removed');
    } catch {
      toast.error('Could not remove access');
    } finally {
      setBusy('');
    }
  };

  const handleSaveRole = async (role) => {
    const memberId = editing.member._id;
    setBusy(memberId);
    try {
      const { data } = await teamApi.updateRole(memberId, role);
      setMembers((prev) =>
        prev.map((m) => m.member._id === memberId ? { ...m, role: data.data.membership.role } : m)
      );
      setEditing(null);
      toast.success('Access updated');
    } catch {
      toast.error('Could not update access');
    } finally {
      setBusy('');
    }
  };

  const accessNow = async (team) => {
    // Record the access in the owner's activity log (best-effort), then enter.
    try { await teamApi.logAccess(team.owner._id); } catch { /* non-blocking */ }
    workspaceStore.getState().switchTo({
      ownerId: team.owner._id,
      username: team.owner.username,
      name: team.owner.name || team.owner.username,
      role: team.role,
    });
    window.location.href = '/';
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      {/* ── Team Members ── */}
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="shrink-0 w-10 h-10 flex items-center justify-center bg-postit border-2 border-pencil rounded-full">
              <Users size={18} strokeWidth={2.5} />
            </span>
            <div>
              <h2 className="font-heading text-2xl text-pencil">Team Members</h2>
              <p className="font-body text-sm text-pencil/60">People you've given access to your account.</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowAdd((s) => !s)} className="flex items-center gap-1.5 shrink-0">
            <UserPlus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">Add Team Member</span>
          </Button>
        </div>

        {showAdd && (
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 p-3 bg-muted/30 border-2 border-dashed border-pencil/30 rounded">
            <Input
              placeholder="Username or email"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              className="flex-1"
              autoFocus
            />
            <div className="flex gap-2">
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="font-body text-sm px-3 py-2 bg-white border-2 border-pencil focus:outline-none focus:border-ink"
                style={{ borderRadius: '9px 3px 8px 3px / 3px 8px 3px 9px' }}
              >
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <Button type="submit" loading={adding} className="shrink-0">Add</Button>
            </div>
          </form>
        )}

        {members.length === 0 ? (
          <p className="font-body text-sm text-pencil/50 py-4 text-center">No team members yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-dashed border-pencil/20 font-heading text-xs text-pencil/60 text-left">
                <th className="py-2 pr-3 w-8">#</th>
                <th className="py-2 pr-3">Member</th>
                <th className="py-2 pr-3">Permission</th>
                <th className="py-2 pr-3 hidden sm:table-cell">Assigned On</th>
                <th className="py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m._id} className="border-b border-pencil/10 font-body text-sm">
                  <td className="py-3 pr-3 text-pencil/50">{i + 1}</td>
                  <td className="py-3 pr-3 min-w-0">
                    <span className="block text-pencil truncate">{m.member.email}</span>
                    <span className="block text-pencil/50 text-xs truncate">@{m.member.username}</span>
                  </td>
                  <td className="py-3 pr-3"><PermissionBadge role={m.role} /></td>
                  <td className="py-3 pr-3 text-pencil/60 hidden sm:table-cell whitespace-nowrap">
                    {formatDate(m.createdAt)}
                  </td>
                  <td className="py-3 text-right">
                    <KebabMenu
                      disabled={busy === m.member._id}
                      onUpdate={() => setEditing(m)}
                      onRemove={() => handleRemove(m.member._id, m.member.name || m.member.username)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* ── Account Access Shared With You ── */}
      <Card className="space-y-3">
        <h3 className="font-heading text-xl text-pencil">Account Access Shared With You</h3>
        {sharedWithMe.length === 0 ? (
          <p className="font-body text-sm text-pencil/50 py-4 text-center">
            No one has shared their account with you yet.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-dashed border-pencil/20 font-heading text-xs text-pencil/60 text-left">
                <th className="py-2 pr-3 w-8">#</th>
                <th className="py-2 pr-3">Shared By</th>
                <th className="py-2 pr-3">Permission</th>
                <th className="py-2">Access</th>
              </tr>
            </thead>
            <tbody>
              {sharedWithMe.map((t, i) => (
                <tr key={t._id} className="border-b border-pencil/10 font-body text-sm">
                  <td className="py-3 pr-3 text-pencil/50">{i + 1}</td>
                  <td className="py-3 pr-3 min-w-0">
                    <span className="block text-pencil truncate">{t.owner.name || t.owner.username}</span>
                    <span className="block text-pencil/50 text-xs truncate">@{t.owner.username}</span>
                  </td>
                  <td className="py-3 pr-3"><PermissionBadge role={t.role} /></td>
                  <td className="py-3">
                    <button
                      onClick={() => accessNow(t)}
                      className="flex items-center gap-1.5 font-body text-sm text-ink hover:text-accent hover:underline transition-colors"
                    >
                      <LogIn size={14} strokeWidth={2.5} />
                      Access Now
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {editing && (
        <UpdateAccessModal
          member={editing}
          saving={busy === editing.member._id}
          onClose={() => setEditing(null)}
          onSave={handleSaveRole}
        />
      )}
    </div>
  );
};
