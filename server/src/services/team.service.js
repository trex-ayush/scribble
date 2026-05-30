import { TeamMember } from '../models/teamMember.model.js';
import { User } from '../models/user.model.js';
import { ActivityLog } from '../models/activityLog.model.js';
import { ApiError } from '../utils/ApiError.js';

// What each role can do on the owner's posts.
const ROLE_PERMISSIONS = {
  full: ['read', 'create', 'update', 'delete', 'publish'],
  read: ['read'],
};

export const teamService = {
  // Check whether userId has permission to perform action on owner's content.
  async checkPermission(userId, ownerId, action) {
    if (userId.toString() === ownerId.toString()) return true;
    const membership = await TeamMember.findOne({
      owner: ownerId,
      member: userId,
      status: 'accepted',
    });
    return !!(membership && ROLE_PERMISSIONS[membership.role]?.includes(action));
  },

  // Get a member's role for a specific owner.
  async getMembership(userId, ownerId) {
    return TeamMember.findOne({ owner: ownerId, member: userId, status: 'accepted' });
  },

  // Directly add a member — no invite/accept step needed.
  async addMember(ownerId, usernameOrEmail, role) {
    const target = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });
    if (!target) throw ApiError.notFound('User not found');
    if (target._id.toString() === ownerId.toString())
      throw ApiError.badRequest('You cannot add yourself');

    const existing = await TeamMember.findOne({ owner: ownerId, member: target._id });
    if (existing) throw ApiError.badRequest('This user is already a team member');

    // Directly accepted — no pending step.
    const membership = await TeamMember.create({
      owner: ownerId,
      member: target._id,
      role,
      status: 'accepted',
    });
    return TeamMember.findById(membership._id)
      .populate('member', 'username name email')
      .lean();
  },

  // Owner removes a member or cancels a pending invite.
  async removeMember(ownerId, memberId) {
    const result = await TeamMember.findOneAndDelete({ owner: ownerId, member: memberId });
    if (!result) throw ApiError.notFound('Member not found');
  },

  // Owner changes a member's role.
  async updateRole(ownerId, memberId, role) {
    const membership = await TeamMember.findOneAndUpdate(
      { owner: ownerId, member: memberId, status: 'accepted' },
      { role },
      { new: true }
    ).populate('member', 'username name email');
    if (!membership) throw ApiError.notFound('Member not found');
    return membership;
  },

  // Owner's team members.
  async getTeam(ownerId) {
    const members = await TeamMember.find({ owner: ownerId, status: 'accepted' })
      .populate('member', 'username name email')
      .sort({ createdAt: 1 })
      .lean();
    return { members };
  },

  // Teams the user is a member of.
  async getMyTeams(memberId) {
    return TeamMember.find({ member: memberId, status: 'accepted' })
      .populate('owner', 'username name')
      .sort({ createdAt: 1 })
      .lean();
  },

  // Audit "Access Now": records an entry in the OWNER's activity log stamped
  // with the member's identity (Pabbly-style: owner sees who entered & when).
  async logAccess(memberId, ownerId) {
    const membership = await TeamMember.findOne({
      owner: ownerId,
      member: memberId,
      status: 'accepted',
    }).populate('member', 'username name email');
    if (!membership) throw ApiError.forbidden('You do not have access to this account');

    const m = membership.member;
    await ActivityLog.create({
      actor: memberId,
      actorEmail: m.email,
      actorName: m.name || m.username,
      account: ownerId,
      viaTeam: true,
      source: 'Team Member Login',
      origin: 'USER',
      action: 'Created',
      method: 'POST',
      path: `/team/access/${ownerId}`,
      eventData: m.username,
      payload: { accessedBy: m.email, role: membership.role },
    });
    return { ok: true };
  },
};
