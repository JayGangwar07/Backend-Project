import mongoose from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"
import { nanoid } from "nanoid"

const videoSchema = new mongoose.Schema({
  
  vidId: {
    type: String,
    unique: true,
    default: () => nanoid(5)
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
    deafult: true
  },
  
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
  
},{timestamps: true})

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video",videoSchema)