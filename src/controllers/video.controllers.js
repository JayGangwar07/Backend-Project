import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
  /*  DONE  */
  // TODO: get video, upload to cloudinary, create video
  
  /*    STEPS:-    */
  
  // Get data from user
  // Get files from multer
  // Check for dupe
  // Create video
  
  const { title, description} = req.body
  
  if (!title || !description){
    throw new ApiError(400, "Title and description are required")
  }
  
  const existingVideo = await Video.findOne({title})
  
  if (existingVideo){
    throw new ApiError(400, "Video already exists")
  }
  
  const thumbnailLocalPath = req.files?.thumbnail[0].path
  const videoLocalPath = req.files?.videoFile[0].path
  
  if (!thumbnailLocalPath || !videoLocalPath){
    throw new ApiError(400, "Video and thumbnail are required")
  }
  
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
  const video = await uploadOnCloudinary(videoLocalPath)
  
  if (!thumbnail || !video){
    throw new ApiError(500, "upload on cloudinary failed")
  }
  
  //console.log(video)
  
  const videoDB = await Video.create({
    videoFile: video?.url,
    thumbnail: thumbnail?.url,
    title,
    description,
    duration: video.duration,
  })
  
  console.log(videoDB)
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, {videoDB}, "Video uploaded")
  )
  
})

const getVideoById = asyncHandler(async (req, res) => {
  // DONE
  
  //TODO: get video by id
  
  /*    STEPS:-    */
  
  // get videoId
  // use findOne
  // if found show data
  
  const { videoId } = req.params
  
  if (!videoId?.trim()){
    throw new ApiError(400, "videoId is required")
  }
  
  const video = await Video.findOne({vidId: videoId})
  
  if (!video){
    throw new ApiError(400, "Video Not Found!!!")
  }
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, {video}, "Video Found!")
  )
  
})

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail

  const { videoId } = req.params
  
  const video = await Video.findById(videoId)
  
  if (!req.user?._id === video._id){
    throw new ApiError(400, "Unauthorised request")
  }
  
  if (!videoId?.trim()){
    throw new ApiError(400, "video id is required")
  }
  
  const {
    title,
    description
  } = req.body
  
  const thumbnailLocalPath = req.file?.path
  
  if (!(title || description || thumbnailLocalPath)){
    throw new ApiError(400, "Title or description or thumbnail is required")
  }
  
  if (thumbnail){
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    
    video.thumbnail = thumbnail
  }
  
  if (title) video.title = title
  
  if (description) video.description = description
  
  await video.save()
  
  return res
  .status(200)
  json(
    new ApiResponse(200, {video}, "Details updated")
  )
  
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}