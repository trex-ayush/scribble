import { teamService } from '../services/team.service.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Resolves the active workspace from the X-Workspace-Id header.
 *
 * - No header (or header = own id) → personal workspace.
 *     req.workspaceOwner = req.user.id, req.workspaceRole = 'owner'
 * - Header = another user's id → must be an accepted team member.
 *     req.workspaceOwner = ownerId, req.workspaceRole = membership.role
 *
 * Run AFTER authenticate.
 */
export const resolveWorkspace = async (req, res, next) => {
  try {
    const headerId = req.headers['x-workspace-id'];
    const userId = req.user.id.toString();

    const setContext = (owner, role) => {
      req.workspaceOwner = owner;
      req.workspaceRole = role;
      // Canonical names: who is logged in vs whose account is active.
      req.authUser = userId;
      req.activeAccount = owner;
      req.teamRole = role;
    };

    if (!headerId || headerId === userId) {
      setContext(userId, 'owner');
      return next();
    }

    const membership = await teamService.getMembership(userId, headerId);
    if (!membership) {
      throw ApiError.forbidden('You are not a member of this workspace');
    }

    setContext(headerId, membership.role);
    next();
  } catch (err) {
    next(err.isOperational ? err : ApiError.forbidden());
  }
};

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Centralized read-only enforcement. When acting inside a workspace as a
 * "read" member, every write method is rejected. The single source of truth
 * for the read-only rule — run AFTER resolveWorkspace on protected routes.
 */
export const enforceReadOnly = (req, res, next) => {
  if (WRITE_METHODS.includes(req.method) && req.workspaceRole === 'read') {
    return next(
      ApiError.forbidden('You have read-only access to this account and cannot make changes.')
    );
  }
  next();
};

// Convenience: authenticate-then-resolve workspace context + block read-only
// writes. Spread into a write route after `authenticate`.
export const workspaceWrite = [resolveWorkspace, enforceReadOnly];

/**
 * Blocks sensitive management actions while impersonating another account.
 * A team member accessing an owner's workspace must NOT be able to manage the
 * owner's team members or API keys (matches Pabbly's "shared-block").
 * Run AFTER authenticate on team / api-key routes.
 */
export const blockImpersonation = (req, res, next) => {
  const headerId = req.headers['x-workspace-id'];
  if (headerId && headerId !== req.user.id.toString()) {
    return next(ApiError.forbidden('Not allowed while accessing another account. Exit access first.'));
  }
  next();
};

// Role → allowed actions within a workspace.
const ROLE_ACTIONS = {
  owner: ['read', 'create', 'update', 'delete', 'publish'],
  full: ['read', 'create', 'update', 'delete', 'publish'],
  read: ['read'],
};

export const can = (role, action) => !!ROLE_ACTIONS[role]?.includes(action);
