const User = require('../models/users.models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        res.status(200).json({ message: 'User registered' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
        res.json({ token, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const updates = {};
        
        if (name) updates.name = name;
        if (email) updates.email = email;

        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            updates,
            { new: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ error: 'User not found' });
        
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { 
    register, 
    login,
    getUserProfile,
    updateUserProfile
};
