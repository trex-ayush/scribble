import { teamService } from '../services/team.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const teamController = {
  getTeam: asyncHandler(async (req, res) => {
    const data = await teamService.getTeam(req.user.id);
    ApiResponse.success(res, data);
  }),

  invite: asyncHandler(async (req, res) => {
    const { username, role } = req.body;
    const member = await teamService.addMember(req.user.id, username, role);
    ApiResponse.created(res, { member }, 'Member added');
  }),

  removeMember: asyncHandler(async (req, res) => {
    await teamService.removeMember(req.user.id, req.params.memberId);
    ApiResponse.success(res, null, 'Member removed');
  }),

  updateRole: asyncHandler(async (req, res) => {
    const membership = await teamService.updateRole(req.user.id, req.params.memberId, req.body.role);
    ApiResponse.success(res, { membership }, 'Role updated');
  }),

  getMyTeams: asyncHandler(async (req, res) => {
    const teams = await teamService.getMyTeams(req.user.id);
    ApiResponse.success(res, { teams });
  }),

  // Record an "Access Now" event in the owner's activity log.
  access: asyncHandler(async (req, res) => {
    await teamService.logAccess(req.user.id, req.params.ownerId);
    ApiResponse.success(res, null, 'Access recorded');
  }),
};
