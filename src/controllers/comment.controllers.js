import mongoose from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const {videoId} = req.params
  const {page = 1, limit = 10} = req.query
  
  const commentAggregate = await Comment.aggregate([
    {
      $match: {
        video: videoId
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignFiels: "_id",
        as: "owner"
      }
    }
  ])
  
  await Comment
  .aggregatePaginate(commentAggregate, page, limit)
  .then((results)=>{
    console.log(results)
  })
  .catch((err)=>{
    throw err
  })

})

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  
  // get content and videoId(url)
  // create and inject owner 
  
  const {content} = req.body
  
  const {videoId} = req.params
  
  if (!content.trim() || !videoId.trim()){
    throw new ApiError(400, "Content and video id are required")
  }
  
  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id
  })
  
  if (!comment){
    throw new ApiError(500, "Creation of comment failed")
  }
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, comment, "Comment added")
  )
  
})

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  
  const {commentId} = req.params
  
  const {content} = req.body
  
  if (!commentId){
    throw new ApiError(400, "Id is required")
  }
  
  if (!content.trim()){
    throw new ApiError(400, "content is required")
  }
  
  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {content: content},
    {new: true}
  )
  
  if (!comment){
    throw new ApiError(400, "Comment does not exist")
  }
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, comment, "Comment upadted")
  )
  
})

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  
  const {commentId} = req.params
  
  if (!commentId){
    throw new ApiError(400, "commentId is required")
  }
  
  const comment = await Comment.findById({_id: commentId})
  
  if (!comment){
    throw new ApiError(400, "Comment does not exist")
  }
  
  await Comment.deleteOne({
    _id: commentId
  })

  return res
  .status(200)
  .json(
    new ApiResponse(200, {}, "Comment deleted")
  )
  
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
  }