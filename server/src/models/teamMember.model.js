import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['full', 'read'], required: true },
    // pending → invite sent, accepted → active member
    status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
  },
  { timestamps: true }
);

// One membership per owner-member pair.
teamMemberSchema.index({ owner: 1, member: 1 }, { unique: true });
teamMemberSchema.index({ member: 1, status: 1 });

export const TeamMember = mongoose.model('TeamMember', teamMemberSchema);
