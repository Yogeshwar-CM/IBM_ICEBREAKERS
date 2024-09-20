import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate, useParams } from "react-router-dom";
import "./App.css";

function Main() {

    const { roomId } = useParams();
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [taskData, setTaskData] = useState({
        name: '',
        assignedMember: '',
        skillsRequired: [],
        deadline: '',
        priority: '',
        teamCode: roomId
    });
    const [showMemberForm, setShowMemberForm] = useState(false);
    const [members, setMembers] = useState(['']);
    const [tasks, setTasks] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);

    const fetchMembers = async () => {
        try {
            const response = await axios.post(`http://localhost:3000/api/teams/members`, {
                teamCode: roomId
            });
            setMembers(response.data.members || []);
        } catch (error) {
            console.error('Error fetching members:', error);
        }
    };

    const fetchTasks = async () => {
        try {
            const response = await axios.post(`http://localhost:3000/api/teams/tasks`, {
                teamCode: roomId
            });
            setTasks(response.data.tasks || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    useEffect(() => {

        fetchMembers();
        fetchTasks();

        const interval = setInterval(() => {
            fetchMembers();
            fetchTasks();
        }, 20000);

        return () => {
            clearInterval(interval);
            if (socket) {
                socket.disconnect();
            }
        };
    }, [roomId]);

    const handleTaskChange = (e) => {
        const { name, value } = e.target;
        setTaskData({
            ...taskData,
            [name]: name === 'skillsRequired' ? value.split(',').map(skill => skill.trim()) : value
        });
    };

    const handleTaskSubmit = async () => {
        try {
            const { name, assignedMember, skillsRequired, deadline, priority, teamCode } = taskData;

            const response = await axios.post('http://localhost:3000/api/tasks', {
                name,
                assignedMember,
                skillsRequired,
                deadline,
                priority,
                teamCode
            });

            alert(response.data.message);
            // Optionally, you can also update the tasks state here
            setTasks([...tasks, response.data.task]);
            setShowTaskForm(false); // Close the modal after successful submission
            setTaskData({
                name: '',
                assignedMember: '',
                skillsRequired: [],
                deadline: '',
                priority: '',
                teamCode: roomId
            }); // Reset the task data
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Failed to create task');
        }
    };

    const handleAutoAssign = () => {
        const memberToAssign = members[Math.floor(Math.random() * members.length)];
        setTaskData({ ...taskData, assignedMember: memberToAssign });
        alert(`Assigned to: ${memberToAssign}`);
    };

    const handleNavigateToEditor = () => {
        navigate(`/editor/${roomId}`);
        if (socket) {
            socket.emit('join', roomId);
        }
    };

    const handleAddMember = () => {
        setMembers([...members, '']);
    };

    const handleMemberChange = (index, value) => {
        const newMembers = [...members];
        newMembers[index] = value;
        setMembers(newMembers);
    };

    const addMembersToTeam = async (newMembers) => {
        try {
            const validMembers = [];
            for (const username of newMembers) {
                const response = await axios.post('http://localhost:3000/api/users/check', { username });
                if (response.data.user) {
                    validMembers.push(response.data.user);
                }
            }

            if (validMembers.length < newMembers.length) {
                alert('Some usernames do not exist.');
                return;
            }
            await axios.post(`http://localhost:3000/api/members`, { teamCode: roomId, members: validMembers });
            alert('Members added successfully');
            setShowMemberForm(false);
            setMembers([...members, ...validMembers]);
        } catch (error) {
            console.error('Error adding members:', error.response ? error.response.data : error.message);
            alert('Failed to add members');
        }
    };

    const handleSubmitMembers = () => {
        if (members.some(member => member.trim() === '')) {
            alert('All member fields must be filled');
            return;
        }
        addMembersToTeam(members);
        setMembers(['']);
    };

    const handleTaskComplete = async (task) => {
        try {
            await axios.post('http://localhost:3000/api/tasks/complete', {
                teamCode: roomId,
                taskName: task.name
            });

            setTasks(tasks.filter(t => t !== task));
            setCompletedTasks([...completedTasks, task]);
            alert('Task marked as completed');
        } catch (error) {
            console.error('Error marking task as complete:', error);
            alert('Failed to mark task as complete');
        }
    };

    const closeModal = () => {
        setShowTaskForm(false);
        setShowMemberForm(false);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <header className="flex items-center justify-between p-4 bg-gray-800 nav">
                <img src="/images/ICEBREAKERS.png" alt="ICEBREAKERS Logo" />
                <button onClick={handleNavigateToEditor} className="px-4 py-2">
                    <i className="fa-solid fa-code"></i> Go to Editor
                </button>
            </header>

            <main className="p-4">
                <div className="main">
                    <div className="emd">
                        <div className="inner-emd">
                            <h2 className="mb-2">Members:</h2>
                            <ul className="mb-4">
                                {members.map((member, index) => (
                                    <li key={index} className="mb-1 flex items-center">
                                        <i className="fas fa-user mr-2"></i>{member}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="inner-btn">
                            <button onClick={() => setShowTaskForm(true)} className="px-2 py-1 mb-4 bg-blue-600 rounded-lg hover:bg-blue-500">
                                <i className="fas fa-plus mr-2"></i>Create Task
                            </button>
                            <button onClick={() => setShowMemberForm(true)} className="px-2 py-1 mb-4 bg-green-600 rounded-lg hover:bg-green-500">
                                <i className="fas fa-user-plus mr-2"></i>Add Members
                            </button>
                        </div>
                    </div>

                    <div class="notif">
                        <h2>Notifications</h2>
                        <div class="mnot">
                            <i class="fas fa-bell"></i>
                            <div>
                                <h3>CodeCollab - Reminder</h3>
                                <p>19-09-24</p>
                                <p>Review the new design mockups for the homepage.</p>
                            </div>
                        </div>
                        <div class="mnot">
                            <i class="fas fa-bell"></i>
                            <div>
                                <h3>CodeCollab - Reminder</h3>
                                <p>19-09-24</p>
                                <p>Finalize the API endpoints for the user authentication feature.</p>
                            </div>
                        </div>
                        <div class="mnot">
                            <i class="fas fa-bell"></i>
                            <div>
                                <h3>CodeCollab - Reminder</h3>
                                <p>19-09-24</p>
                                <p>Check the latest feedback from the QA team on the last build.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4 ah">Assigned Tasks</h2>
                    <div className="task-list">
                        {tasks.map((task, index) => (
                            <div key={index} className="task mb-4 p-4 bg-gray-800 rounded-lg shadow-md">
                                <h3 className="font-semibold mb-2 text-lg">{task.name}</h3>
                                <p className="text-gray-400">
                                    <i className="fas fa-user mr-1"></i> Assigned to: {task.assignedMember}
                                </p>
                                <p className="text-gray-400">
                                    <i className="fas fa-tools mr-1"></i> Skills Required: <span className="tag">{task.skillsRequired}</span>
                                </p>
                                <p className="text-gray-400">
                                    <i className="fas fa-calendar-alt mr-1"></i> Deadline: {task.deadline.slice(0, 10)}
                                </p>
                                <p className="text-gray-400">
                                    <i className="fas fa-flag mr-1"></i> Priority: {task.priority}
                                </p>
                                <button
                                    onClick={() => handleTaskComplete(task)}
                                    className="mt-2 flex items-center text-green-600 hover:text-green-500 transition duration-300"
                                >
                                    <i className="fas fa-check-circle mr-2"></i>
                                    <span className="font-semibold">Mark as Complete</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4">Completed Tasks</h2>
                    <div className="task-list">
                        {completedTasks.map((task, index) => (
                            <div key={index} className="task mb-4 opacity-50">
                                <h3 className="font-semibold mb-3 tn">{task.name}</h3>
                                <p className="text-gray-400">
                                    <i className="fas fa-user mr-1"></i> Assigned to: {task.assignedMember}
                                </p>
                                <p className="text-gray-400">
                                    <i className="fas fa-tools mr-1"></i> Skills Required: <span className="tag">{task.skillsRequired}</span>
                                </p>
                                <p className="text-gray-400">
                                    <i className="fas fa-calendar-alt mr-1"></i> Deadline: {task.deadline.slice(0, 10)}
                                </p>
                                <p className="text-gray-400">
                                    <i className="fas fa-flag mr-1"></i> Priority: {task.priority}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {showTaskForm && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>Create Task</h2>
                            <input type="text" name="name" placeholder="Task Name" onChange={handleTaskChange} required />
                            <input type="text" name="assignedMember" placeholder="Assigned Member" value={taskData.assignedMember} readOnly />
                            <button type="button" onClick={handleAutoAssign} className="auto-assign-btn">Auto Assign</button>
                            <input
                                type="text"
                                name="skillsRequired"
                                placeholder="Skills Required (comma separated)"
                                onChange={handleTaskChange}
                                required
                            />
                            <input type="date" name="deadline" onChange={handleTaskChange} required />
                            <select name="priority" onChange={handleTaskChange} required>
                                <option value="">Select Priority</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                            <button type="submit" className="bg-green-600 hover:bg-green-500" onClick={handleTaskSubmit}>Create Task</button>
                            <button type="button" onClick={closeModal} className="cancel-btn">Cancel</button>
                        </div>
                    </div>
                )}

                {showMemberForm && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>Add Members</h2>
                            {members.map((member, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    placeholder={`Member ${index + 1}`}
                                    value={member}
                                    onChange={(e) => handleMemberChange(index, e.target.value)}
                                    required
                                />
                            ))}
                            <button type="button" onClick={handleAddMember} className="bg-blue-600 hover:bg-blue-500">Add Another Member</button>
                            <button type="submit" className="bg-green-600 hover:bg-green-500" onClick={handleSubmitMembers}>Add Members</button>
                            <button type="button" onClick={closeModal} className="cancel-btn">Cancel</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Main;