const express = require("express");


const {
  addComment,
  reply,
  allComments,
  editComment,
  deleteComment,
  deleteReply,
  likeComment
} = require("../controllers/commentController");

const router = express.Router();

// router.post('/addComment/:videoId')
// router.post('/reply/:commentId')
// router.get('/allComments/:videoId')
// router.delete('/deleteComment/:commentId')
// router.delete('/deleteReply/:commentId/:replyId')
router.post("/addComment/:videoId", addComment);

router.post("/reply/:commentId", reply);

router.get("/allComments/:videoId", allComments);

router.put("/editComment/:commentId", editComment);

router.delete("/deleteComment/:commentId", deleteComment);

// router.delete("/deleteReply/:commentId/:replyId", deleteReply);

router.put("/likeComment/:commentId", likeComment);



module.exports = router;