import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { nanoid } from "nanoid"


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
    vidId: nanoid(5),
    isPublished: true,
    _id: req.user?._id,
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
  // aggregate to find owner
  // show video
  
  const { videoId } = req.params
  
  const video = await Video.aggregate([
    {
      $match: {
        vidId: videoId
      }
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
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
              subscribers: {$size: "$subscribers"},
              subscribedTo: {$size: "$subscribedTo"},
              isSubscribed: {
                $cond: {
                  if : {
                    $in: [new mongoose.Types.ObjectId(req.user?._id), "$subscribers.subscriber"]
                  },
                  then: true,
                  else: false
                }
              }
            }
          },
          {
            $project: {
              isSubscribed: 1,
              subscribers: 1,
              subscribedTo: 1,
              avatar: 1,
              username: 1,
            }
          },
        ]
      }
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes"
        },
        owner: {
          $first: "$owner"
        },
        isLiked: {
          $cond: {
            if: {$in: [new mongoose.Types.ObjectId(req.user?._id),"$likes.likedBy"]},
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        isLiked: 1,
        likesCount: 1,
        owner: 1,
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        createdAt: 1,
        comments: 1,
      },
    },
  ])
  
  console.log(video)
  
  if (!video.length){
    throw new ApiError(400, "Video Not Found")
  }
  
  await Video.findOneAndUpdate({
    vidId: videoId
  },{
    $inc: {
      views: 1
    }
  })
  
  await User.findOneAndUpdate({
    _id: req.user?._id
  },{
    $addToSet: {
      watchHistory: videoId
    }
  })
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, video, "Video feteched")
  )
  
})

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail

  const { videoId } = req.params
  
  const video = await Video.findOne({vidId: videoId})
  
  if (!video){
    throw new ApiError(400, "Video Not Found")
  }
  
  if (req.user?._id !== video.owner){
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
  
  if (thumbnailLocalPath){
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    
    video.thumbnail = thumbnail.url
  }
  
  if (title) video.title = title
  
  if (description) video.description = description
  
  await video.save()
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, {video}, "Details updated")
  )
  
})

const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video
  
  /* STEPS */
  
  // get videoId
  // delete document
  
  const { videoId } = req.params
  
  const video = await Video.findOne({vidId: videoId})
  
  if (!video){
    throw new ApiError(400, "Video does not exist")
  }
  
  if (req.user?._id !== video.owner){
    throw new ApiError(400, "Unauthorised request")
  }
  
  await Video.deleteOne({vidId: videoId})
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, {data: "ok"}, "Video deleted")
  )
  
})

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  
  const video = await Video.findOne({vidId: videoId})
  
  if (!video){
    throw new ApiError(400, "Video not found")
  }
  
  if (req.user?._id !== video.owner){
    throw new ApiError(400, "Unauthorised request")
  }
  
  
  video.isPublished = !video.isPublished
  
  
  
  await video.save()
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, {video}, "isPublished updated")
  )
  
})

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus
}