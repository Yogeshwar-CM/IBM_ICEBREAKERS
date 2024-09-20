import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [formType, setFormType] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [teamId, setTeamId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [skills, setSkills] = useState('');

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://ibm-icebreakers.vercel.app/api/signup', { username, password, name, skills });
      console.log(res.data.message);
      setFormType('login'); // Switch to login after sign-up
    } catch (err) {
      console.error(err.response.data.error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://ibm-icebreakers.vercel.app/api/signin', { username, password });
      setToken(res.data.token);
      setIsAuthenticated(true);
    } catch (err) {
      console.error(err.response.data.message);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    const generateRandomCode = () => Math.floor(100000 + Math.random() * 900000);
    const code = generateRandomCode();
    setTeamCode(code);

    try {
      const res = await axios.post('https://ibm-icebreakers.vercel.app/api/teams', { teamName, leaderName: username, teamCode }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(res.data.message);
      navigate(`/main/${code}`); // Navigate to the room after successful creation
    } catch (err) {
      console.error(err.response.data.error);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    try {
      const checkRes = await axios.get(`https://ibm-icebreakers.vercel.app/api/teams/${teamId}/check`);
      if (checkRes.status === 200) {
        toast.success("Success");
        navigate(`/main/${teamId}`);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('Invalid room code');
      } else {
        toast.error('An error occurred');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      {!isAuthenticated ? (
        <div className="w-full max-w-md p-8 bg-gray-800 shadow-md rounded-lg">
          {formType === 'signup' ? (
            <form onSubmit={handleSignup} className="space-y-4 sup">
              <h2 className="text-2xl font-bold text-center">Sign Up</h2>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-600 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-600 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-600 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Skills (comma separated)"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-600 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600"
              >
                Sign Up
              </button>
              <p
                className="text-center text-sm cursor-pointer hover:underline"
                onClick={() => setFormType('login')}
              >
                Already have an account? Log in
              </p>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4 sup">
              <h2 className="text-2xl font-bold text-center">Log In</h2>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-600 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-600 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600"
              >
                Log In
              </button>
              <p
                className="text-center text-sm cursor-pointer hover:underline"
                onClick={() => setFormType('signup')}
              >
                Don't have an account? Sign up
              </p>
            </form>
          )}
        </div>
      ) : (
        <div className="w-full max-w-2xl p-8 bg-gray-800 shadow-md rounded-lg">
          <div className="bt justify-between mb-4 ssup">
            <button
              onClick={() => setFormType('createTeam')}
              className={`w-full px-4 py-2 ${formType === 'createTeam' ? 'bg-blue-500' : 'bg-gray-700'} rounded-lg hover:bg-blue-600`}
            >
              Create Team
            </button>
            <button
              onClick={() => setFormType('joinTeam')}
              className={`w-full px-4 py-2 ${formType === 'joinTeam' ? 'bg-blue-500' : 'bg-gray-700'} rounded-lg hover:bg-blue-600`}
            >
              Join Team
            </button>
          </div>
          {formType === 'createTeam' ? (
            <form onSubmit={handleCreateTeam} className="space-y-4 sup">
              <h2 className="text-2xl font-bold text-center">Create a Team</h2>
              <input
                type="text"
                placeholder="Team Name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-600 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Team Code (Auto-generated)"
                value={teamCode}
                disabled
                className="w-full px-4 py-2 border border-gray-600 bg-gray-700 rounded-lg focus:outline-none"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600"
              >
                Create Team
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinTeam} className="space-y-4 sup">
              <h2 className="text-2xl font-bold text-center">Join a Team</h2>
              <input
                type="text"
                placeholder="Enter 6-Digit Team Code"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-600 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600"
              >
                Join Team
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;