import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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

export { registerUser }