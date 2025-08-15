import { User } from "../models/user.models.js"
import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"

export const verifyJwt = asyncHandler( async (req,res,next) => {
  
  // Authorization Bearer <token>
  try{
    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "")
  
  if (!token){
    throw new ApiError(409, "Couldn't find token")
  }
  
  console.log(token)
  
  const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
  
  if (!decodedToken){
    throw new ApiError(401,"Invalid Token")
  }
  
  console.log(decodedToken)
  
  const user = await User.findById(decodedToken._id).select("-password -refreshToken")
  
  if (!user){
    throw new ApiError(401, "Unauthorized request")
  }
  
  req.user = user
  
  next()
  }
  
  catch(error){
    throw new ApiError(401,error?.message || "Invalid Access Token")
  }
  
})