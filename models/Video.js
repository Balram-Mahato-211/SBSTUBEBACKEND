const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    videoUrl: {
      type: String,
      required: true,
    },

    videoPublicId: {
      type: String,
      required: true,
    },

   
    thumbnailUrl: {
      type: String,
      required: true,
    },

    thumbnailPublicId: {
      type: String,
      required: true,
    },

   
    views: {
      type: Number,
      default: 0,
    },

    
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

      tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],

   
    likesUser: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
      },
    ],

    
    dislikeUser: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
      },
    ],
    
    duration:{
    type:Number,
    default:0
}
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Video", videoSchema);