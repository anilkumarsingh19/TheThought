const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caption: {
    type: String,
    maxlength: 500,
    default: ''
  },
  videoUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String
  },
  duration: {
    type: Number, // in seconds
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  shares: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  hashtags: [{
    type: String,
    trim: true
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  visibility: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public'
  },
  isProcessed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better performance
reelSchema.index({ author: 1, createdAt: -1 });
reelSchema.index({ hashtags: 1 });
reelSchema.index({ createdAt: -1 });
reelSchema.index({ views: -1 });

// Extract hashtags from caption
reelSchema.pre('save', function(next) {
  const hashtagRegex = /#([A-Za-z0-9_]+)/g;
  const matches = this.caption.match(hashtagRegex);
  if (matches) {
    this.hashtags = matches.map(tag => tag.slice(1).toLowerCase());
  }
  next();
});

// Virtual for like count
reelSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
reelSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for share count
reelSchema.virtual('shareCount').get(function() {
  return this.shares.length;
});

// Ensure virtual fields are serialized
reelSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Reel', reelSchema);
