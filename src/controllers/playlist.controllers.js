import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  const {name, description} = req.body
  

  // Steps
  // Get user data
  // create after auth
  
  if (!name || !description){
    throw new ApiError(400, "All fields are required")
  }
  
  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id
    //owner: new mongoose.Types.ObjectId("689fe34308d00fbf1aa23b23")
  })
  
  if (!playlist){
    throw new ApiError(500, "Playlist creation error")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200, playlist, "Playlist created")
  )
  
})

const getUserPlaylists = asyncHandler(async (req, res) => {
  //TODO: get user playlists
  
  const {userId} = req.params
  
  if (!isValidObjectId(userId)){
    throw new ApiError(400, "User not found")
  }
  
  const playlist = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id)
        //owner: new mongoose.Types.ObjectId("689fe34308d00fbf1aa23b23")
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      }
    },
    {
      $addFields: {
        totalVideos: {
          $sum: "$videos"
        },
        totalViews: {
          $sum: "$videos.views"
        }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      }
    },
    {
      $project: {
        name: 1,
        description: 1,
        owner: 1,
        videos: 1,
        ownerDetails: {
          username: 1,
          email: 1,
          avatar: 1
        }
      }
    }
  ])
  
  if (!playlist){
    throw new ApiError(400, "Playlist not fetched")
  }
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, playlist, "Playlists fetched")
  )
  
})

const getPlaylistById = asyncHandler(async (req, res) => {
  //TODO: get playlist by id
  
  const {playlistId} = req.params
  
  if (!isValidObjectId(playlistId)){
    throw new ApiError(400, "Invalid playlist Id")
  }
  
  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "vidId",
        as: "allVideosData",
        pipeline: [
          {
            $lookup: {
              from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "videoOwner",
            pipeline: [
              {
                $project: {
                  thumbnail: 1,
                  videoFile: 1,
                  views: 1,
                  duration: 1,
                  avatar: 1,
                  username: 1,
                }
              }
            ]
            }
          },
          {
            $project: {
              thumbnail: 1,
              videoFile: 1,
              title: 1,
              description: 1,
              duration: 1,
              views: 1
            }
          },
        ]
      }
    },
    {
      $unwind: "$allVideosData"
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1
            }
          }
        ]
      }
    },
    {
      $unwind: "$ownerDetails"
    }
  ])
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, playlist, "Fetched playlist")
  )
  
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  
  // Get playlist 
  // push vidId in videos []
  
  const {playlistId, videoId} = req.params
  
  if (!isValidObjectId(playlistId)){
    throw new ApiError(400, "Invalid Id")
  }
  
  const playlist = Playlist.findById({_id: playlistId})
  
  if (!req.user._id !== playlist.owner){
    throw new ApiError(400, "Unauthorised request")
  }
  
  const newPlaylist = await Playlist.findByIdAndUpdate(
    {_id: playlistId},
    {
      $addToSet: {
        videos: videoId
      }
    },
    {
      new: true
    }
  )
  
  return res
  .status(200)
  .json(
  new ApiResponse(200, newPlaylist, "Video added to Playlist")
  )
  
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // TODO: remove video from playlist
  
  const {playlistId, videoId} = req.params
  
  if (!isValidObjectId(playlistId)){
    throw new ApiError(400, "Invalid playlist")
  }
  
  const playlist = await Playlist.findById({_id: playlistId})
  
  if (req.user._id !== playlist.owner){
    throw new ApiError(400, "Unauthorised request")
  }
  
  const newPlaylist = await Playlist.findByIdAndUpdate(
    {_id : playlistId},
    {
      $pull: {
        videos: videoId
      }
    },
    {
      new: true
    }
  )
  
  console.log(newPlaylist)
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, newPlaylist, "Remove video from playlist")
  )

})

const deletePlaylist = asyncHandler(async (req, res) => {
  // TODO: delete playlist
  
  const {playlistId} = req.params
  
  if (!isValidObjectId(playlistId)){
    throw new ApiError(400, "Invalid playlist id")
  }
  
  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)
  
  if (!deletedPlaylist){
    throw new ApiError(400, "Playlist does not exist")
  }
  
  console.log(
    await Playlist.findOne({_id: playlistId})
  )
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, deletedPlaylist, "Playlist deleted")
  )
  
})

const updatePlaylist = asyncHandler(async (req, res) => {
  //TODO: update playlist
  
  const {playlistId} = req.params
  
  const {name, description} = req.body
  
  if (!isValidObjectId(playlistId)){
    throw new ApiError(400, "Invalid playlist Id")
  }
  
  if (!name || !description){
    throw new ApiError(400, "Name and description is required")
  }
  
  const playlist = await Playlist.findById(playlistId)
  
  if (!playlist){
    throw new ApiError(400, "Playlist not found")
  }
  
  if (req.user._id.toString() !== playlist.owner.toString()){
    throw new ApiError(400, "Unauthorised request")
  }
  
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      name,
      description,
    },
    {
      new: true
    }
  )
  
  return res
  .status(200)
  .json(
    new ApiResponse(200, updatedPlaylist, "Updated Playlist")
  )
  
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}