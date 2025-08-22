import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  
  /*    STEPS:-    */
  
  // Auth middleware
  // get content
  // Create document
  
  const {content} = req.body
  
  if (!content.trim()){
    throw new ApiError(400, "Content is required")
  }
  
  /*if (!req.user._id){
    throw new ApiError(400, "Unauthorised request")
  }*/
  
  const tweet = await Tweet.create({
    owner: req.user?._id,
    content,
  })
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, tweet, "Tweet Posted")
  )
  
})

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  
  /*    STEPS:-    */
  
  // get user _id
  // aggregate for like and subscribers and comments owner details
  // display res
  
  
  
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}