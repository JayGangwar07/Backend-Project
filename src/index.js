import 'dotenv/config'
import connectDB from "./db/index.js"
import mongoose from "mongoose"
import { DB_NAME } from "./constants.js"
import { app } from "./app.js"


/*
dotenv.config({
  path: './.env'
})*/

connectDB()
.then(() => {
  
  app.listen(process.env.PORT || 8080, () => {
    
    console.log("Server Is Running at: ", process.env.PORT)
    
  })
  
})
.catch((err) => {
  console.log("Index.js connection error!!!",err)
})