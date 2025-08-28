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
    owner: req.user._id,
    //owner: "689fe34308d00fbf1aa23b23",
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
  
  // 68afccf46337e12b0adedb3d
  
  const {userId} = req.params
  
  if (!isValidObjectId(userId)){
    throw new ApiError(400, "Inavlid User Id")
  }
  
  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likesData",
      }
    },
    {
      $addFields: {
        isLiked: {
          $cond: {
            if: {$in: [new mongoose.Types.ObjectId(req.user._id),"$likesData.likedBy"]},
            then: true,
            else: false
          }
        },
        totalLikes: {
          $size: "$likesData"
        }
      }
    },
    {
      $unwind: "$likesData"
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails"
      }
    },
    {
      $project: {
        content: 1,
        owner: 1,
        createdAt: 1,
        isLiked: 1,
        totalLikes: 1,
        ownerDetails: {
          username: 1,
          avatar: 1
        }
      }
    }
  ])
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, tweets, "Fetched all tweets")
  )
  
})

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  
  const {content} = req.body
  
  const {tweetId} = req.params
  
  if (!isValidObjectId){
    throw new ApiError(400, "Invalid tweet id")
  }
  
  if (!content?.trim()){
    throw new ApiError(400, "Content is required")
  }
  
  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {content},
    {new: true}
  )
  
  if (!tweet){
    throw new ApiError(500, "Couldnt find tweet")
  }
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, tweet, "Updated tweet")
  )
  
})

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  
  const {tweetId} = req.params
  
  if (!isValidObjectId(tweetId)){
    throw new ApiError(400, "Invalid tweet id")
  }
  
  const deletedTweet = await Tweet.findByIdAndDelete(
    tweetId
  )
  
  if (!deletedTweet){
    throw new ApiError(500, "Tweet not found")
  }
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, deletedTweet, "Deleted Tweet")
  )
  
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}