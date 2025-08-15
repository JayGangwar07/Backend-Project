import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

/* Global Variable */
const options = {
  httpOnly: true,
  secure: true
}

const generateAccessAndRefreshTokens = async (userId) => {
  
  try{
    
    const user = await User.findById(userId)
    
    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()
    
    //console.log(accessToken)
    
    user.refreshToken = refreshToken
    
    await user.save({validateBeforeSave: false})
    
    return {
      accessToken,
      refreshToken
    }
    
  }
  
  catch(error){
    throw new ApiError(502,"Couldnt generate access and refresh tokens")
  }
  
}

const registerUser = asyncHandler( async (req,res) => {
  
  /*     STEPS:-     */
  
  // User se data lo ✓
  // Check if data is correct✓
  // Check If user exists✓
  // Local Path Check✓
  // Cloudinary pe dalo ✓
  // Agar hua upload to DB mai entry karo
  // res main se password aur refreshToken nikal lo
  // return res/err
  
  // Data from User
  const {
    username,
    email,
    fullName,
    password
  } = req.body
  
  //console.log(req.body)

  // Validation
  if ([username,email,fullName,password].some( (field) => field?.trim() === "")){
    throw new ApiError(400,"All Fields Are Required")
  }
  
  // Exists Check
  const existedUser = await User.findOne({
    $or: [{username},{email}]
  })
  

  if (existedUser){
    throw new ApiError(409,"User already exists")
  }
  
  //console.log(req.files)
  // Local Path Check
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path
  }
  
  //console.log(coverImageLocalPath)
  
  if (!avatarLocalPath){
    throw new ApiError(400, "Avatar Is Required")
  }
  
  // upload to cloudinary and check
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  
  if (!avatar){
    throw new ApiError(400,"Image Upload Failed")
  }
  
  // DB Entry
  
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    password,
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || ""
  })
  
  const createdUser = await User.findById(user._id).select("-password -refreshToken")
  
  if (!createdUser){
    throw new ApiError(500,"Mongo Creation Failed")
  }
  
  return res.status(200).json(
    new ApiResponse(
      200,
      createdUser,
      "User Registered"
      )
  )

} )

const loginUser = asyncHandler( async (req,res) => {
  
  // STEPS:-
  // User se Email/Username and password lo✓
  // Validate the details✓
  // Comapre with DB✓
  // If details are correct give acces and refresh token
  
  const {
    username,
    email,
    password
  } = req.body
  
  if (!password){
    throw new ApiError(401,"Password is required")
  }
  
  if (!(username || email)){
    throw new ApiError(401,"Email/Username is required")
  }
  
  const user = await User.findOne({
    $or: [{email},{username}]
  })
  
  if (!user){
    throw new ApiError(402,"Acoount with provided details doesn't exist")
  }
  
  const isPasswordValid = await user.isPasswordCorrect(password)
  
  if (!isPasswordValid){
    throw new ApiError(401,"Invalid Password")
  }
  
  const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)
  
  // try commenting this ↓↓↓
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
  
  /*
  Declared in the top
  const options = {
  httpOnly: true,
  secure: true
}
  */
  
  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser, accessToken, refreshToken
      },
      "User Logged in Succesfully"
    )
  )
  
})

const logoutUser = asyncHandler( async (req,res) => {
  
  await User.findByIdAndUpdate(req.user._id, {
    $unset: {
      refreshToken: 1
    }
  },
  {
    new: true
  })
  
  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User Logged Out"))
})

const refreshAccessToken = asyncHandler( async (req,res) => {
  
  /*    STEPS    */
  // Take accessToken from cookie
  // Use accessToken to get MongoDB user
  
  // ↑ From auth middleware
  
  // Use generateAccessAndRefreshTokens() to get accessToken and refreshToken
  // Set new refreshToken and accessToken in cookie
  
  
  const token = req.cookies.refreshToken || req.header("Authorization")?.replace("Bearer ", "")
  
  if (!token){
    throw new ApiError(409, "Couldn't find token")
  }
  
  // console.log(token)
  
  const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
  
  if (!decodedToken){
    throw new ApiError(401,"Invalid Token")
  }
  
  const user = await User.findById(decodedToken._id)
  
  if (token !== user.refreshToken){
    throw new ApiError(401, "Inavlid or Expired Refresh Token")
  }
  
  const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(decodedToken._id)
  
  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(200, {
      "refreshToken": refreshToken
    }, "Refreshed The Tokens")
  )
  
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken
  }