import { Router } from 'express';
import {
    isVideoLiked,
    tweetLikes,
    isTweetLiked,
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
} from "../controllers/like.controllers.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId")
.post(toggleVideoLike);

router.route("/:videoId")
.get(isVideoLiked)

router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike)
router.route("/videos").get(getLikedVideos);
router.route("/g/:tweetId").get(tweetLikes)
router.route("/:tweetId").get(isTweetLiked)

export default router