import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { Subscription } from "../models/subscription.models.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { v2 as cloudinary } from "cloudinary"
import mongoose from "mongoose"


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

const changePassword = asyncHandler( async (req,res) => {
  
  /*    STEPS:-    */
  // Take current and new Password and username/email
  // validate details
  // findByIdAndUpdate()
  
  const {username, password, newPassword} = req.body
  
  if ([username, password, newPassword].some((i)=>i.trim() === "")){
    throw new ApiError(401, "Details are required")
  }
  
  const user = await User.findById(req.user._id)
  //console.log(user)
  
  const isPasswordValid = await user.isPasswordCorrect(password)
  
  if (!isPasswordValid){
    throw new ApiError(401,"Invalid Password")
  }
  
  user.password = newPassword
  await user.save({validateBeforeSave: false})
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, {oldPassword: password,newPassword}),"Password changed"
  )
  
})

const getDetails = asyncHandler( async (req,res) => {
  
  const user = req.user
  
  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {
        data: user
      },
    )
  )
})

const updateDetails = asyncHandler(async(req,res) => {
  
  const {
    fullName,
    email
  } = req.body
  
  if ([fullName,email].some((i)=>i.trim()==="")){
    throw new ApiError(400,"All Details are required")
  }
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email
      }
    },
    {new: true}
  ).select("-password -refreshToken")
  
  return res
  .status(200)
  .json(
    new ApiResponse(200,{user})
  )
  
})

const updateAvatar = asyncHandler(async(req,res) => {
  
  /*    STEPS:-    */
  
  // verifyJwt()
  // req.file
  // uploadOnCloudinary()
  // findByIdAndUpdate()
  
  const avatarLocalPath = req.file?.path
  
  if (!avatarLocalPath){
    throw new ApiError(401, "Avatar is required")
  }
  
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  
  if (!avatar.url){
    throw new ApiError(500, "Error while uploading avatar")
  }
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar?.url
      }
    },
    {
      new: true
    }
    )
  
  cloudinary.v2.uploader
  .destroy(user.avatar)
  .then(result=>console.log(result))
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, {data: req.user}, "Avatar Updated")
  )
  
})

const updateCoverImage = asyncHandler(async(req,res) => {
  
  /*    STEPS:-    */
  
  // verifyJwt()
  // req.file
  // uploadOnCloudinary()
  // findByIdAndUpdate()
  
  const coverImageLocalPath = req.file?.path
  
  if (!coverImageLocalPath){
    throw new ApiError(401, "Avatar is required")
  }
  
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  
  if (!coverImage.url){
    throw new ApiError(500, "Error while uploading cover image")
  }
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage?.url
      }
    },
    {
      new: true
    }
    )
  
  cloudinary.v2.uploader
  .destroy(coverImage)
  .then(result=>console.log(result));
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, {data: req.user}, "cover image Updated")
  )
  
})

const getChannelProfile = asyncHandler(async (req,res) => {
  
  const { username } = req.params
  
  if (!username){
    throw new ApiError(400, "Invalid request")
  }
  const channel = await User.aggregate([
  {
    $match: {
      username: username?.toLowerCase()
    }
  },
  {
    $lookup: {
      from: "subscriptions",
      localField: "_id",
      foreignField: "channel",
      as: "subscribers"
    }
  },
  {
    $lookup: {
      from: "subscriptions",
      localField: "_id",
      foreignField: "subscriber",
      as: "subscribedTo"
    }
  },
  {
    $addFields: {
      subscribers: { $size: "$subscribers" },
      subscribedTo: { $size: "$subscribedTo" },
      isSubscribed: {
        $cond: {
          if: { $in: [req.user?._id, "$subscribers.subscriber"] },
          then: true,
          else: false
        }
      }
    }
  },
  {
    $project: {
      username: 1,
      fullName: 1,
      email: 1,
      subscribers: 1,
      subscribedTo: 1,
      avatar: 1,
      coverImage: 1
    }
  }
])

  //console.log(channel)
  
  if (!channel?.length){
    throw new ApiError(402, "Channel not found")
  }
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, channel[0],"Data Fetched")
  )
  
})

const getWatchHistory = asyncHandler( async (req,res) => {
  /*
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId("689fe34308d00fbf1aa23b23")
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    avatar: 1,
                    fullName: 1,
                  }
                },
              ]
            }
          },
          {
                  $addFields: {
                    owner: {
                      $first: "$owner"
                    }
                  }
                }
        ]
      }
    }
  ])
  */
  

  const user = await User.aggregate([
        {
            $match: {
              _id: new mongoose.Types.ObjectId(req.user._id),
               // _id: new mongoose.Types.ObjectId("689fe34308d00fbf1aa23b23")
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
  
  console.log(user)
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, user, "History Fetched")
  )
  
})

export {
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
  }