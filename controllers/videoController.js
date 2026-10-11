const Video = require("../models/Video");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

// upload vdo api
const uploadVideo = async (req, res) => {
  try {

    const token = req.headers.authorization.split(" ")[1];

    const tokenData = jwt.verify(token, process.env.JWT_SECRET);

    if (!req.files || !req.files.video || !req.files.thumbnail) {
      return res.status(400).json({
        message: "Video and Thumbnail required"
      });
    }

    const uploadVideo = await cloudinary.uploader.upload(
      req.files.video.tempFilePath,
      {
        resource_type: "video",
        folder: "YouTube/videos"
      }
    );

    const uploadThumbnail = await cloudinary.uploader.upload(
      req.files.thumbnail.tempFilePath,
      {
        folder: "YouTube/thumbnails"
      }
    );

    const newVideo = await Video.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
tags: JSON.parse(req.body.tags || "[]"),

      videoUrl: uploadVideo.secure_url,
      videoPublicId: uploadVideo.public_id,

      thumbnailUrl: uploadThumbnail.secure_url,
      thumbnailPublicId: uploadThumbnail.public_id,

      duration: uploadVideo.duration,

      uploadedBy: tokenData._id
    });

    res.status(200).json({
      message: "Video uploaded successfully",
      data: newVideo
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    error: err
    });
  }
};


//get all video
const getAllVideos = async (req, res) => {

  try {

    const videos = await Video.find()
      .populate("uploadedBy", "channelName profileImageUrl");

    res.status(200).json(videos);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Something went wrong"
    });

  }

};

// Get Video By ID
const getVideoById = async (req, res) => {
  try {

    const { id } = req.params;

const video = await Video.findByIdAndUpdate(
  id,
  { $inc: { views: 1 } },
  { new: true }
).populate("uploadedBy", "_id channelName profileImageUrl subscriber");

    if (!video) {
      return res.status(404).json({
        message: "Video not found"
      });
    }

    //no login -->sb false
    let likedStatus = false;
    let dislikeStatus = false;
    let subscribeStatus = false;

    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      try {
        const tokenData = jwt.verify(token, process.env.JWT_SECRET);
        const userId = tokenData._id.toString();

        likedStatus = video.likesUser.some(id => id.toString() === userId);
        dislikeStatus = video.dislikeUser.some(id => id.toString() === userId);
        subscribeStatus = video.uploadedBy.subscriber.some(id => id.toString() === userId);
      } catch (err) {
        console.log("Invalid token:", err);
      }
    }

    res.status(200).json({
      message: "Video fetched successfully",
      data: video,
      likedStatus,
      dislikeStatus,
      subscribeStatus
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Something went wrong"
    });

  }
 
};

const likeUnlike = async (req, res) => {
  try {

    // Login check - userId token not by body 
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Please login first"
      });
    }

    const tokenData = jwt.verify(token, process.env.JWT_SECRET);
    const userId = tokenData._id.toString();

    const { videoId } = req.body;

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        message: "Video not found"
      });
    }

    // Like already hai?
    const liked = video.likesUser.some(
      id => id.toString() === userId
    );

    // video.save() nahi - wo poora document validate karta hai aur purane videos
    // (jinme uploadedBy/videoPublicId nahi hai) pe fail ho jata hai.
    // Sirf likesUser/dislikeUser update karo. Dislike hai to wo bhi hatao.
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      liked
        ? { $pull: { likesUser: userId, dislikeUser: userId } }               // Unlike
        : { $addToSet: { likesUser: userId }, $pull: { dislikeUser: userId } }, // Like
      { returnDocument: "after" }
    );

    res.status(200).json({
      message: liked ? "Video Unliked" : "Video Liked",
      likesUser: updatedVideo.likesUser,
      dislikeUser: updatedVideo.dislikeUser,
      likedStatus: !liked,
      dislikeStatus: false
    });

  } catch (err) {

    console.log(err);

    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        message: "Invalid or expired token, please login again"
      });
    }

    res.status(500).json({
      message: "Something went wrong"
    });

  }
};

const dislikeUndislike = async (req, res) => {

  try {

    // Login check - userId token se lo, body se nahi
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Please login first"
      });
    }

    const tokenData = jwt.verify(token, process.env.JWT_SECRET);
    const userId = tokenData._id.toString();

    const { videoId } = req.body;

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        message: "Video not found"
      });
    }

    // if already dislike hai
    const disliked = video.dislikeUser.some(
      id => id.toString() === userId
    );

    // likeUnlike jaisa hi - save() ki jagah sirf arrays update karo. Like hai to wo bhi hatao.
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      disliked
        ? { $pull: { dislikeUser: userId, likesUser: userId } }               // Undislike
        : { $addToSet: { dislikeUser: userId }, $pull: { likesUser: userId } }, // Dislike
      { returnDocument: "after" }
    );

    res.status(200).json({
      message: disliked ? "Video Undisliked" : "Video Disliked",
      likesUser: updatedVideo.likesUser,
      dislikeUser: updatedVideo.dislikeUser,
      likedStatus: false,
      dislikeStatus: !disliked
    });

  } catch (err) {

    console.log(err);

    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        message: "Invalid or expired token, please login again"
      });
    }

    res.status(500).json({
      message: "Something went wrong"
    });

  }

};

// Edit Video
const editVideo = async (req, res) => {
  try {

    const token = req.headers.authorization.split(" ")[1];
    const tokenData = jwt.verify(token, process.env.JWT_SECRET);

    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        message: "Video not found"
      });
    }

    // if (video.uploadedBy.toString() !== tokenData._id) 
    if (video.uploadedBy.toString() !== tokenData._id.toString()){
      return res.status(401).json({
        message: "Invalid User"
      });
    }

    if (req.body.title) {
      video.title = req.body.title;
    }

    if (req.body.description) {
      video.description = req.body.description;
    }

    if (req.files && req.files.thumbnail) {

      await cloudinary.uploader.destroy(video.thumbnailPublicId);

      const uploadThumbnail = await cloudinary.uploader.upload(
        req.files.thumbnail.tempFilePath,
        {
          folder: "YouTube/thumbnails"
        }
      );

      video.thumbnailUrl = uploadThumbnail.secure_url;
      video.thumbnailPublicId = uploadThumbnail.public_id;
    }

    await video.save();

    res.status(200).json({
      message: "Video Updated Successfully",
      data: video
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: err.message,
    error: err
    });

  }
};


// Delete Video
const deleteVideo = async (req, res) => {
  try {

    const token = req.headers.authorization.split(" ")[1];
    const tokenData = jwt.verify(token, process.env.JWT_SECRET);

    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        message: "Video not found"
      });
    }

    // if (video.uploadedBy.toString() !== tokenData._id) 
    if (video.uploadedBy.toString() !== tokenData._id.toString()){
      return res.status(401).json({
        message: "Invalid User"
      });
    }

    await cloudinary.uploader.destroy(video.thumbnailPublicId);

    await cloudinary.uploader.destroy(
      video.videoPublicId,
      {
        resource_type: "video"
      }
    );

    await Video.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Video Deleted Successfully"
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Something went wrong"
    });

  }
};

module.exports = {
  uploadVideo,
  getAllVideos,
  getVideoById,
  likeUnlike,
  dislikeUndislike,
  editVideo,
  deleteVideo
};