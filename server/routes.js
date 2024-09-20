const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Team = require('./models/Team');

router.post('/signup', async (req, res) => {
    try {
        const { username, password, name, skills, projects = [] } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword, name, skills, projects });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/signin', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id }, 'ICEBREAKERS', { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/teams', async (req, res) => {
    try {
        const { teamCode, leaderName, teamName } = req.body;
        const newTeam = new Team({ teamCode, leaderName, teamName });
        await newTeam.save();
        res.status(201).json({ message: 'Team created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
});

router.post('/members', async (req, res) => {
    try {
        const { teamCode } = req.body;
        const { members } = req.body;
        const team = await Team.findOne({ teamCode });
        if (!team) return res.status(404).json({ message: 'Team not found' });

        team.members.push(...members);
        await team.save();
        res.json({ message: 'Members added successfully', team });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const getAvailableUsers = async (skillRequired) => {
    try {
        const users = await User.find({ skills: skillRequired }).exec();
        return users;
    } catch (error) {
        console.error(error);
        return [];
    }
};

const assignSkillsWithinTasks = async (tasks) => {
    const taskSkillToUser = {};

    for (const task of tasks) {
        const taskName = task.name;
        const skills = task.skillsRequired;

        console.log(`\nAssigning skills for task: ${taskName}`);

        for (const skill of skills) {
            const skillRequired = skill.skill;
            const priority = skill.priority;
            const deadline = skill.deadline;

            const availableUsers = await getAvailableUsers(skillRequired);

            if (priority === 'High') {
                availableUsers.sort((a, b) => {
                    const aDuration = a.projects.find(p => p.task === skillRequired)?.duration || Infinity;
                    const bDuration = b.projects.find(p => p.task === skillRequired)?.duration || Infinity;
                    return aDuration - bDuration;
                });
            } else if (priority === 'Low') {
                availableUsers.sort((a, b) => {
                    const aDuration = a.projects.find(p => p.task === skillRequired)?.duration || -Infinity;
                    const bDuration = b.projects.find(p => p.task === skillRequired)?.duration || -Infinity;
                    return bDuration - aDuration;
                });
            } else {
                availableUsers.sort((a, b) => a.name.localeCompare(b.name));
            }

            let assigned = false;
            for (const user of availableUsers) {
                const userAssignedSkill = Object.values(taskSkillToUser).find(assignment => assignment.name === user.name);
                if (!userAssignedSkill) {
                    taskSkillToUser[`${taskName}_${skillRequired}`] = {
                        name: user.name,
                        priority: priority,
                        deadline: deadline,
                        status: 'Assigned'
                    };

                    user.projects.forEach(project => {
                        if (project.task === skillRequired) {
                            project.duration = Math.max(0, project.duration - 1);
                        }
                    });

                    await user.save();
                    assigned = true;
                    break;
                }
            }
            if (!assigned) {
                console.log(`No available user found for skill ${skillRequired} in task ${taskName}.`);
            }
        }
    }

    return taskSkillToUser;
};

router.post('/users/check', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        const user = await User.findOne({ username });
        if (user) {
            res.status(200).json({ message: 'User exists', user });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Change the status of a selected task to "completed"
router.post('/tasks/complete', async (req, res) => {
    const { teamCode, taskName } = req.body;

    try {
        const team = await Team.findOne({ teamCode });
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        const task = team.tasks.find(t => t.name === taskName);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        task.status = 'Completed';
        await team.save();

        res.status(200).json({ message: 'Task status updated to completed', task });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/teams/:teamCode/check', async (req, res) => {
    try {
        const { teamCode } = req.params;
        const team = await Team.findOne({ teamCode });
        if (team) {
            res.status(200).json({ message: 'Team code is valid' });
        } else {
            res.status(404).json({ message: 'Invalid room code' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/tasks', async (req, res) => {
    try {
        const { teamCode, name, assignedMember, skillsRequired, deadline, priority, status } = req.body;


        console.log('Received data:', req.body);

        if (!teamCode || !name || !assignedMember || !skillsRequired || !deadline || !priority || !status) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const team = await Team.findOne({ teamCode });
        if (!team) return res.status(404).json({ message: 'Team not found' });

        const newTask = {
            name,
            assignedMember,
            skillsRequired,
            deadline,
            priority,
            status // Include status here
        };

        team.tasks.push(newTask);
        await team.save();

        res.status(201).json({ message: 'Task created successfully', task: newTask });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/teams/members', async (req, res) => {
    try {
        const { teamCode } = req.body;
        if (!teamCode) {
            return res.status(400).json({ message: 'Team code is required' });
        }
        const team = await Team.findOne({ teamCode }).populate('members');
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }
        const memberUsernames = team.members.map(member => member.username);
        res.status(200).json({ members: memberUsernames });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }

    router.post('/teams/tasks', async (req, res) => {
        try {
            const { teamCode } = req.body;
            if (!teamCode) {
                return res.status(400).json({ message: 'Team code is required' });
            }

            const team = await Team.findOne({ teamCode }).populate('tasks');
            if (!team) {
                return res.status(404).json({ message: 'Team not found' });
            }

            res.status(200).json({ tasks: team.tasks });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
}); router.post('/assign-tasks', async (req, res) => {
    const tasks = req.body.tasks;

    try {
        const assignments = await assignSkillsWithinTasks(tasks);
        res.status(200).json({
            message: "Tasks assigned successfully",
            assignments: assignments
        });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while assigning tasks' });
    }
});

module.exports = router;
