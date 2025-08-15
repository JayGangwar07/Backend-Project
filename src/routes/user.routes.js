import { Router } from "express"
import { registerUser,loginUser,logoutUser,refreshAccessToken } from "../controllers/user.controllers.js"
import { verifyJwt } from "../middlewares/auth.middlewares.js"
import { upload } from "../middlewares/multer.middlewares.js"

const router = Router()

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
router.route("/logout").post(verifyJwt, logoutUser)
router.route("/refresh").post(refreshAccessToken)

export default router