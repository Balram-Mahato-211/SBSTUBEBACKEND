const mongoose = require('mongoose')

// reply schema
const replySchema = new mongoose.Schema({
    
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },

    replyText : {
        type : String,
        required : true,
        trim : true
    },

    createdAt : {
        type : Date,
        default : Date.now
    }

})


const commentSchema = new mongoose.Schema({

    // kis video par comment hai
    videoId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Video',
        required : true
    },

    // kis user ne comment kiya
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },

    // comment text
    commentText : {
        type : String,
        // required : true,
        trim : true
    },

    // replies array
    replies : [replySchema],

    // like users
    likedBy : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User'
    }],

    // dislike users
    // dislikedBy : [{
    //     type : mongoose.Schema.Types.ObjectId,
    //     ref : 'User'
    // }],

    likeCount : {
        type : Number,
        default : 0
    },

    // dislikeCount : {
    //     type : Number,
    //     default : 0
    // }

},
{
    timestamps : true
})

module.exports = mongoose.model('Comment',commentSchema)