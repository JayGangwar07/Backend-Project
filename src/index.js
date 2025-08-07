import 'dotenv/config'
import connectDB from "./db/index.js"
import mongoose from "mongoose"
import { DB_NAME } from "./constants.js"
/*
dotenv.config({
  path: './.env'
})*/

connectDB()