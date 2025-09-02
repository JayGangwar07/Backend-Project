import { Router } from "express"
import { 
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getDetails,
  updateDetails,
  updateAvatar,
  updateCoverImage,
  getChannelProfile,
  getWatchHistory,
  } from "../controllers/user.controllers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router()

router.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);


router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1
    },
    {
      name: "coverImage",
      maxCount: 1
    },
  ]),
  registerUser
  )
router.route("/login").post(loginUser)

// Secured Routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh").post(refreshAccessToken)

// Secured Routes
router.route("/change-password").post(verifyJWT, changePassword)
router.route("/details").post(verifyJWT, getDetails)
router.route("/change-details").post(verifyJWT, updateDetails)
router.route("/avatar").post(verifyJWT, upload.single("avatar"), updateAvatar)
router.route("/cover").post(verifyJWT, upload.single("coverImage"), updateCoverImage)

router.route("/channel/:username").get(verifyJWT, getChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router
