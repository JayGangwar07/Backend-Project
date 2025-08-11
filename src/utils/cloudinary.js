import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

// Transfer to index.js
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function uploadOnCloudinary(localFilePath){
  
  try {
    
    if (!localFilePath) return
    
    const response = await cloudinary.uploader.upload(localFilePath,{
      resource_type: "auto"
    })
    //after upload
    console.log(response.url)
    
    return response
  }
  
  catch(error){
    
    fs.unlinkSync(localFilePath)
    
    return null
  }
}

export {uploadOnCloudinary}