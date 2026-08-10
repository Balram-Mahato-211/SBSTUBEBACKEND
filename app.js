const express=require('express')
const app=express()
const cors = require('cors');
const bodyParser=require('body-parser');
const fileUpload = require('express-fileupload');
const connectDB=require('./config/db')

//import routes
const userRoutes=require('./routes/user')
const videoRoutes = require("./routes/video");
const commentRoutes=require("./routes/comment")
connectDB()

app.use(cors());

app.use(bodyParser.json())
app.use(bodyParser.urlencoded())
app.use(fileUpload(
    {
    
    useTempFiles:true,        
    tempFileDir:'./tmp/'

    }
))


app.use('/user',userRoutes);
app.use("/video", videoRoutes);
app.use('/comment',commentRoutes)


module.exports=app