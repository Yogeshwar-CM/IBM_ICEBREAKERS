const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    name: { type: String, required: true },
    assignedMember: { type: String, required: true },
    skillsRequired: { type: [String], required: true },
    deadline: { type: Date, required: true },
    priority: { type: String, required: true, enum: ['Low', 'Medium', 'High'] },
    status: {
        type: String,
        required: true,
        enum: ['Assigned', 'Completed'],
        default: 'Assigned'
    }
});

const teamSchema = new mongoose.Schema({
    teamCode: { type: String, required: true },
    leaderName: { type: String, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    teamName: { type: String, required: true },
    tasks: { type: [taskSchema], default: [] }
});

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;