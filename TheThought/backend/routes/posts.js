const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all posts (feed)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { visibility: 'public' };
    
    // If user is authenticated, show posts from followed users too
    if (req.user) {
      query = {
        $or: [
          { visibility: 'public' },
          { author: { $in: req.user.following } }
        ]
      };
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
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new post
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, visibility = 'public' } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Content too long' });
    }

    const post = new Post({
      author: req.user._id,
      content: content.trim(),
      visibility
    });

    await post.save();
    await post.populate('author', 'username displayName profilePic');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get post by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username displayName profilePic')
      .populate('likes', 'username displayName')
      .populate('comments.author', 'username displayName profilePic');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Like/Unlike post
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const isLiked = post.likes.includes(req.user._id);
    
    if (isLiked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();

    res.json({
      message: isLiked ? 'Post unliked' : 'Post liked',
      isLiked: !isLiked,
      likeCount: post.likes.length
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Comment on post
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = {
      author: req.user._id,
      content: content.trim()
    };

    post.comments.push(comment);
    await post.save();
    await post.populate('comments.author', 'username displayName profilePic');

    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Share post
router.post('/:id/share', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const isShared = post.shares.includes(req.user._id);
    
    if (!isShared) {
      post.shares.push(req.user._id);
      await post.save();
    }

    res.json({
      message: 'Post shared successfully',
      shareCount: post.shares.length
    });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete post
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search posts
router.get('/search/:query', optionalAuth, async (req, res) => {
  try {
    const { query } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const searchQuery = {
      $and: [
        {
          $or: [
            { content: { $regex: query, $options: 'i' } },
            { hashtags: { $in: [query.toLowerCase()] } }
          ]
        },
        { visibility: 'public' }
      ]
    };

    const posts = await Post.find(searchQuery)
      .populate('author', 'username displayName profilePic')
      .populate('likes', 'username displayName')
      .populate('comments.author', 'username displayName profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ posts });
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
