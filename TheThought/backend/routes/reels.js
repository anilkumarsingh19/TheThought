const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Reel = require('../models/Reel');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads/reels';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'reel-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// Get all reels (feed)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { visibility: 'public' };
    
    // If user is authenticated, show reels from followed users too
    if (req.user) {
      query = {
        $or: [
          { visibility: 'public' },
          { author: { $in: req.user.following } }
        ]
      };
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
    console.error('Get reels error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload new reel
router.post('/', authMiddleware, upload.single('video'), async (req, res) => {
  try {
    const { caption, visibility = 'public', duration } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    if (!duration) {
      return res.status(400).json({ error: 'Video duration is required' });
    }

    const videoUrl = `/uploads/reels/${req.file.filename}`;

    const reel = new Reel({
      author: req.user._id,
      caption: caption || '',
      videoUrl,
      duration: parseInt(duration),
      visibility
    });

    await reel.save();
    await reel.populate('author', 'username displayName profilePic');

    res.status(201).json({
      message: 'Reel uploaded successfully',
      reel
    });
  } catch (error) {
    console.error('Upload reel error:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Server error' });
  }
});

// Get reel by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id)
      .populate('author', 'username displayName profilePic')
      .populate('likes', 'username displayName')
      .populate('comments.author', 'username displayName profilePic');

    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    // Increment view count
    reel.views += 1;
    await reel.save();

    res.json({ reel });
  } catch (error) {
    console.error('Get reel error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Like/Unlike reel
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    const isLiked = reel.likes.includes(req.user._id);
    
    if (isLiked) {
      reel.likes.pull(req.user._id);
    } else {
      reel.likes.push(req.user._id);
    }

    await reel.save();

    res.json({
      message: isLiked ? 'Reel unliked' : 'Reel liked',
      isLiked: !isLiked,
      likeCount: reel.likes.length
    });
  } catch (error) {
    console.error('Like reel error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Comment on reel
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const reel = await Reel.findById(req.params.id);
    
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    const comment = {
      author: req.user._id,
      content: content.trim()
    };

    reel.comments.push(comment);
    await reel.save();
    await reel.populate('comments.author', 'username displayName profilePic');

    const newComment = reel.comments[reel.comments.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Share reel
router.post('/:id/share', authMiddleware, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    const isShared = reel.shares.includes(req.user._id);
    
    if (!isShared) {
      reel.shares.push(req.user._id);
      await reel.save();
    }

    res.json({
      message: 'Reel shared successfully',
      shareCount: reel.shares.length
    });
  } catch (error) {
    console.error('Share reel error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete reel
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    if (reel.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this reel' });
    }

    // Delete the video file
    const videoPath = path.join('public', reel.videoUrl);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    await Reel.findByIdAndDelete(req.params.id);

    res.json({ message: 'Reel deleted successfully' });
  } catch (error) {
    console.error('Delete reel error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search reels
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
            { caption: { $regex: query, $options: 'i' } },
            { hashtags: { $in: [query.toLowerCase()] } }
          ]
        },
        { visibility: 'public' }
      ]
    };

    const reels = await Reel.find(searchQuery)
      .populate('author', 'username displayName profilePic')
      .populate('likes', 'username displayName')
      .populate('comments.author', 'username displayName profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ reels });
  } catch (error) {
    console.error('Search reels error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
