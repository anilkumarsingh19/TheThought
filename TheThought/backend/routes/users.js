const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get user profile by username
router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's posts and reels
    const posts = await Post.find({ author: user._id, visibility: 'public' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('author', 'username displayName profilePic');

    const reels = await Reel.find({ author: user._id, visibility: 'public' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('author', 'username displayName profilePic');

    const profile = user.getPublicProfile();
    profile.posts = posts;
    profile.reels = reels;
    profile.postsCount = await Post.countDocuments({ author: user._id });
    profile.reelsCount = await Reel.countDocuments({ author: user._id });

    // Check if current user is following this user
    if (req.user) {
      profile.isFollowing = req.user.following.includes(user._id);
    }

    res.json({ user: profile });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's posts
router.get('/:username/posts', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { author: user._id };
    
    // If not the user's own posts and user is private, only show to followers
    if (req.user && req.user._id.toString() !== user._id.toString()) {
      if (user.privacy === 'private' && !user.followers.includes(req.user._id)) {
        return res.status(403).json({ error: 'This user\'s posts are private' });
      }
    } else if (!req.user && user.privacy === 'private') {
      return res.status(403).json({ error: 'This user\'s posts are private' });
    }

    const posts = await Post.find(query)
      .populate('author', 'username displayName profilePic')
      .populate('likes', 'username displayName')
      .populate('comments.author', 'username displayName profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        hasNext: page < Math.ceil(totalPosts / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's reels
router.get('/:username/reels', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { author: user._id };
    
    // If not the user's own reels and user is private, only show to followers
    if (req.user && req.user._id.toString() !== user._id.toString()) {
      if (user.privacy === 'private' && !user.followers.includes(req.user._id)) {
        return res.status(403).json({ error: 'This user\'s reels are private' });
      }
    } else if (!req.user && user.privacy === 'private') {
      return res.status(403).json({ error: 'This user\'s reels are private' });
    }

    const reels = await Reel.find(query)
      .populate('author', 'username displayName profilePic')
      .populate('likes', 'username displayName')
      .populate('comments.author', 'username displayName profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalReels = await Reel.countDocuments(query);

    res.json({
      reels,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReels / limit),
        totalReels,
        hasNext: page < Math.ceil(totalReels / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user reels error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's followers
router.get('/:username/followers', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const followers = await User.find({ _id: { $in: user.followers } })
      .select('username displayName profilePic isVerified')
      .skip(skip)
      .limit(limit);

    res.json({
      followers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(user.followers.length / limit),
        totalFollowers: user.followers.length,
        hasNext: page < Math.ceil(user.followers.length / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's following
router.get('/:username/following', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const following = await User.find({ _id: { $in: user.following } })
      .select('username displayName profilePic isVerified')
      .skip(skip)
      .limit(limit);

    res.json({
      following,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(user.following.length / limit),
        totalFollowing: user.following.length,
        hasNext: page < Math.ceil(user.following.length / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users
router.get('/search/:query', optionalAuth, async (req, res) => {
  try {
    const { query } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const searchQuery = {
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } }
      ]
    };

    const users = await User.find(searchQuery)
      .select('username displayName profilePic isVerified followersCount followingCount')
      .skip(skip)
      .limit(limit);

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
