const jwt = require("jsonwebtoken");
const mogoose = require("mongoose");
const Comment = require("../models/Comment");
const Video = require("../models/Video");

const addComment = async (req, res) => {
  try {
    // sirf login user comment kar sakta hai
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(500).json({
        message: "Please login first",
      });
    }

    const tokenData = jwt.verify(token, process.env.JWT_SECRET);

    if (!req.body.comment?.trim()) {
      return res.status(500).json({
        message: "Comment cannot be empty",
      });
    }

    const newComment = new Comment({
      videoId: req.params.videoId,
      userId: tokenData._id,
      commentText: req.body.comment,
    });

    const savedComment = await newComment.save();

    res.status(200).json({
      msg: "comment added",
      data: savedComment,
    });
  } catch (err) {
    console.log(err);

    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(500).json({
        message: "Invalid or expired token, please login again",
      });
    }

    res.status(500).json({
      error: err,
    });
  }
};

const reply = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    const tokenData = await jwt.verify(token, process.env.JWT_SECRET);

    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(500).json({
        msg: "comment not found",
      });
    }

    const newReply = {
      // userId : tokenData.userId,
      userId: tokenData._id,
      replyText: req.body.reply,
    };

    comment.replies.push(newReply);

    await comment.save();

    res.status(200).json({
      msg: "reply added",
      data: comment,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: err,
    });
  }
};

// 

  const allComments = async (req, res) => {
  try {
    // comments sab dekh sakte hain, login ho to isLiked bhi batao
    let userId = null;
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      try {
        userId = jwt.verify(token, process.env.JWT_SECRET)._id.toString();
      } catch (err) {
        console.log("Invalid token:", err);
      }
    }

    const comments = await Comment.find({
      videoId: req.params.videoId,
    })
      .populate("userId", "channelName profileImageUrl")
      .populate("replies.userId", "channelName profileImageUrl")
      .sort({ createdAt: -1 });

   
    const result = comments.map((comment) => ({
      ...comment.toObject(),

      
      isLiked: !!userId && comment.likedBy.some(
        (id) => id?.toString() === userId
      ),
    }));

    res.status(200).json({
      totalComments: result.length,
      data: result,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: err,
    });
  }
};

//comment edit
const editComment = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(500).json({
        message: "Please login first",
      });
    }

    const tokenData = jwt.verify(token, process.env.JWT_SECRET);

    if (!req.body.comment?.trim()) {
      return res.status(500).json({
        message: "Comment cannot be empty",
      });
    }

    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(500).json({
        message: "comment not found",
      });
    }

    if (comment.userId.toString() !== tokenData._id.toString()) {
      return res.status(500).json({
        message: "You can edit only your own comment",
      });
    }

    comment.commentText = req.body.comment;
    await comment.save();

    res.status(200).json({
      msg: "comment updated",
      data: comment,
    });
  } catch (err) {
    console.log(err);

    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(500).json({
        message: "Invalid or expired token, please login again",
      });
    }

    res.status(500).json({
      error: err,
    });
  }
};

// comment delete 
const deleteComment = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(500).json({
        message: "Please login first",
      });
    }

    const tokenData = jwt.verify(token, process.env.JWT_SECRET);
    const userId = tokenData._id.toString();

    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(500).json({
        message: "comment not found",
      });
    }

    const video = await Video.findById(comment.videoId);

    // purane videos me uploadedBy nahi hai
    const isCommentOwner = comment.userId.toString() === userId;
    const isVideoOwner = video?.uploadedBy?.toString() === userId;

    if (!isCommentOwner && !isVideoOwner) {
      return res.status(500).json({
        message: "You are not allowed to delete this comment",
      });
    }

    await Comment.findByIdAndDelete(req.params.commentId);

    res.status(200).json({
      msg: "comment deleted",
    });
  } catch (err) {
    console.log(err);

    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(500).json({
        message: "Invalid or expired token, please login again",
      });
    }

    res.status(500).json({
      error: err,
    });
  }
};

const deleteReply = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    const tokenData = await jwt.verify(token, process.env.JWT_SECRET);

    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(500).json({
        msg: "comment not found",
      });
    }

    const reply = comment.replies.id(req.params.replyId);

    if (!reply) {
      return res.status(500).json({
        msg: "reply not found",
      });
    }

    if (reply.userId != tokenData.userId) {
      return res.status(500).json({
        msg: "not authorized",
      });
    }

    reply.deleteOne();

    await comment.save();

    res.status(200).json({
      msg: "reply deleted",
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: err,
    });
  }
};

const likeComment = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    const tokenData = jwt.verify(token, process.env.JWT_SECRET);

    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(500).json({
        msg: "Comment not found",
      });
    }

    // const userId = tokenData.userId;
    const userId = tokenData._id;

    // Already liked
    if (comment.likedBy.includes(userId)) {
      comment.likedBy.pull(userId);
      comment.likeCount--;

      await comment.save();

      return res.status(200).json({
        msg: "Like removed",
        data: comment,
      });
    }

    

    comment.likedBy.push(userId);
    comment.likeCount++;

    await comment.save();

    res.status(200).json({
      msg: "Comment liked",
      data: comment,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: err,
    });
  }
};


module.exports = {
  addComment,
  reply,
  allComments,
  editComment,
  deleteComment,
  deleteReply,
  likeComment,
};
