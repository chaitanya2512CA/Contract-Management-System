import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: [true, 'Please provide a team name'],
      trim: true,
      maxlength: [60, 'Team name cannot exceed 60 characters'],
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    joinCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'complete', 'disbanded'],
      default: 'open',
    },
  },
  {
    timestamps: true,
  }
);

teamSchema.index({ event: 1, joinCode: 1 });

export const Team = mongoose.model('Team', teamSchema);
