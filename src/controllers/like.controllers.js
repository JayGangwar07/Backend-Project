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
  
  /*
  {name: "jay"}
  {name: "yash"}
  */
  
  // if (existingLikes[0].likedBy === req.user?._id)
  let likeState = false
  
  const existingLikes = await Like.findOne({
    video: videoId,
    likedBy: req.user._id
  })
  
  if (existingLikes){
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
    const {commentId} = req.params
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}