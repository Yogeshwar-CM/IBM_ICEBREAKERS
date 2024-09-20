const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const projectSchema = new Schema({
    task: { type: String, required: true },
    duration: { type: Number, required: true }
});

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    skills: { type: [String], required: true },
    projects: { type: [projectSchema], required: true }
});

module.exports = mongoose.model('User', userSchema);
