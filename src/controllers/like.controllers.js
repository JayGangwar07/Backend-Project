import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {Video} from "../models/video.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on video
  
  const {videoId} = req.params
  
  if (!videoId){
    throw new ApiError(400, "Invalid video like request")
  }
  
  
  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id
  })
  
  let likeState = false
  
  if (existingLike){
    likeState = true
  }
  
  let like;
  
  if (!likeState){
    
    like = await Like.create({
      video: videoId,
      likedBy: req.user._id
    })
    
  }
  
  let deleted;
  
  if (likeState){
    deleted = await Like.deleteOne({
    $and: [
      {video: videoId},
      {likedBy: req.user._id}
    ]
  })
  }
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, like || deleted, "Like Toggled")
  )
  
})

const toggleCommentLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on comment
  
  const {commentId} = req.params
  
  if (!isValidObjectId(commentId)){
    throw new ApiError(400, "Invalid request")
  }
  
  console.log(commentId)
  
  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id
  })
  
  console.log(existingLike)
  
  if (existingLike){
    const deleted = await Like.deleteOne({
      comment: commentId,
      likedBy: req.user._id
    })
    
    return res
    .status(200)
    .json(
      new ApiResponse(200, deleted, "Unliked comment")
    )
  }
  
  const like = await Like.create({
    comment: commentId,
    likedBy: req.user?._id
  })
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, like, "Liked comment")
  )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on tweet
  
  const {tweetId} = req.params
  
  if (!isValidObjectId(tweetId)){
    throw new ApiError(400, "Invalid request for tweet")
  }
  
  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id
  })
  
  if (existingLike){
    
    const deleted = await Like.deleteOne({
      tweet: tweetId,
      likedBy: req.user._id
    })
    
    return res
    .status(200)
    .json(
      new ApiResponse(200, deleted, "Unliked tweet")
    )
    
  }
  
  const like = await Like.create({
    tweet: tweetId,
    likedBy: req.user._id
  })
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, like, "Liked tweet")
  )
  
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  
  /*const likes = await Like.find({
    video: {
      $exists: true
    },
    likedBy: req.user._id
  })*/
  
  const likes = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "vidId",
        as: "likedVideos",
        pipeline: [
          {
            $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails"
          }
          },
          {
            $unwind: "$ownerDetails"
          }
        ]
      }
    },
    {
      $unwind: "$likedVideos"
    },
    {
      $sort: {
        "likedVideos.createdAt": -1
      }
    },
    {
      $project: {
        _id: 0,
        likedVideos: {
          _id: 1,
          vidId: 1,
          videoFile: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          duration: 1,
          createdAt: 1,
          isPublished: 1,
          ownerDetails: {
            username: 1,
            coverImg: 1,
            avatar: 1
          }
        }
      }
    },
  ])
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, likes, "Fetched all liked videos")
  )
  
})

export {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos
}