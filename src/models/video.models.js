import mongoose from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"
import { nanoid } from "nanoid"

const videoSchema = new mongoose.Schema({
  
  vidId: {
    type: String,
    default: () => nanoid(5),
    unique: true,
    index: true
  },
  
  videoFile: {
    type: String, //Cloudinary
    required: true,
  },
  
  thumbnail: {
    type: String, //Cloudinary
    required: true
  },
  
  title: {
    type: String,
    required: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  duration: {
    type: Number,
    required: true
  },
  
  views: {
    type: Number,
    default: 0,
  },
  
  isPublished: {
    type: Boolean,
    default: true
  },
  
  owner: {
    type: mongoose.Types.ObjectId,
    ref: "User"
  }
  
},{timestamps: true})

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video",videoSchema)