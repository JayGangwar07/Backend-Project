import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
  // TODO: toggle subscription
  
  const {channelId} = req.params
  
  if (!isValidObjectId(channelId)){
    throw new ApiError(400, "Invalid channel")
  }
  


  if (channelId === String(req.user._id)){
    throw new ApiError(400, "Can't subscribe to own channel")
  }
  
  const alreadySubscribed = await Subscription.findOne({
    channel: channelId,
    subscriber: req.user._id
  })
  
  console.log(alreadySubscribed)
  
  if (alreadySubscribed){
    
    const unsubscribe = await Subscription.deleteOne({
    channel: channelId,
    subscriber: req.user._id
    })
    
    return res
    .status(200)
    .json(
      new ApiResponse(200, unsubscribe, "Unsubscribed")
    )
  }
  
  const subscribe = await Subscription.create({
    channel: channelId,
    subscriber: req.user._id
  })
  
  console.log(subscribe)
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, subscribe, "Subscribed")
  )
  
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  
  const {channelId} = req.params
  
  if (!isValidObjectId(channelId)){
    throw new ApiError(400, "Invalid channel")
  }
  
  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              coverImage: 1,
              avatar: 1,
              createdAt: 1,
            }
          },
        ]
      }
    },
  ])
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, subscribers, "Fetcjed subscribers")
  )

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  
  const { subscriberId } = req.params
  
  if (!isValidObjectId(subscriberId)){
    throw new ApiError("User not found")
  }
  
  const channelsSubscribedTo = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
              coverImg: 1,
              createdAt: 1
            }
          }
        ]
      }
    },
  ])
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, channelsSubscribedTo, "Fetched channels")
  )
  
})

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels
}