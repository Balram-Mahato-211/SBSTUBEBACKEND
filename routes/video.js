const express = require("express");

const router = express.Router();

const {
  uploadVideo,
  getAllVideos,
  getVideoById,
  likeUnlike,
  dislikeUndislike,
  editVideo,
  deleteVideo
} = require("../controllers/videoController");


router.post("/upload", uploadVideo);

router.get("/all", getAllVideos);

router.get('/videoById/:id',getVideoById);

router.post("/likeUnlike", likeUnlike);

router.post("/dislikeUndislike", dislikeUndislike);

router.put("/edit/:id", editVideo);

router.delete("/delete/:id", deleteVideo);



module.exports = router;