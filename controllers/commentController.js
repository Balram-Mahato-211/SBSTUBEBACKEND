const jwt = require("jsonwebtoken");
const mogoose = require("mongoose");
const Comment = require("../models/Comment");
const Video = require("../models/Video");

const addComment = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    const tokenData = await jwt.verify(token, process.env.JWT_SECRET);

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
      return res.status(404).json({
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
    const token = req.headers.authorization.split(" ")[1];
    const tokenData = jwt.verify(token, process.env.JWT_SECRET);

    const userId = tokenData._id;
    const comments = await Comment.find({
      videoId: req.params.videoId,
    })
      .populate("userId", "channelName profileImageUrl")
      .populate("replies.userId", "channelName profileImageUrl")
      .sort({ createdAt: -1 });

   
    const result = comments.map((comment) => ({
      ...comment.toObject(),

      
      isLiked: comment.likedBy.some(
        (id) => id.toString() === userId.toString()
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

const deleteComment = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    const tokenData = await jwt.verify(token, process.env.JWT_SECRET);

    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        msg: "comment not found",
      });
    }

    const video = await Video.findById(comment.videoId);

    if (
      // comment.userId != tokenData.userId &&
      // video.userId != tokenData.userId
      comment.userId.toString() !== tokenData._id.toString() &&
      video.uploadedBy.toString() !== tokenData._id.toString()
    ) {
      return res.status(500).json({
        msg: "not authorized",
      });
    }

    await Comment.findByIdAndDelete(req.params.commentId);

    res.status(200).json({
      msg: "comment deleted",
    });
  } catch (err) {
    console.log(err);

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
      return res.status(404).json({
        msg: "comment not found",
      });
    }

    const reply = comment.replies.id(req.params.replyId);

    if (!reply) {
      return res.status(404).json({
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
      return res.status(404).json({
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

    // Remove dislike if exists

    // if (comment.dislikedBy.includes(userId)) {

    //     comment.dislikedBy.pull(userId);
    //     comment.dislikeCount--;
    // }

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

// const comments = [
//   {
//     _id: 2345,
//     commentText: "video thik tha",
//     userId: 1234,
//     videoId: 2224,
//     commentBy: [222, 456, 666, 265],
//   },

//   {
//     _id: 1145,
//     commentText: "video was awesome",
//     userId: 456,
//     videoId: 2224,
//     commentBy: [123, 456, 789],
//   },

//   {
//     _id: 3389,
//     commentText: "bahut achha video hai",
//     userId: 789,
//     videoId: 2224,
//     commentBy: [222, 789, 999, 456],
//   },

//   {
//     _id: 4472,
//     commentText: "content kaafi useful tha",
//     userId: 222,
//     videoId: 2224,
//     commentBy: [111, 333, 555],
//   },

//   {
//     _id: 5567,
//     commentText: "nice video",
//     userId: 999,
//     videoId: 2224,
//     commentBy: [222, 456, 999],
//   },
// ];
// const result = comments.map(comment => ({
//   commentId: comment._id,
//   userId: comment.commentBy.includes(userId) ? userId : null
// }));

module.exports = {
  addComment,
  reply,
  allComments,
  deleteComment,
  deleteReply,
  likeComment,
};
