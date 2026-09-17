require('dotenv').config()
const User=require('../models/User')
const bcrypt=require('bcrypt')
const cloudinary=require('cloudinary').v2
const cloudinaryConfig=require('../config/cloudinary')
const jwt=require('jsonwebtoken')
const mogoose=require('mongoose')


//signup
const signup=async(req,res)=>{
    try{
        const user= await User.find({email:req.body.email})

        if(user.length>0){
            return res.status(500).json({message: "Email already registered"})
        }

        if(req.body.password.length <8){
            return res.status(500).json({ message: "Password must be at least 8 characters"})
        }

    const hash=await bcrypt.hash(req.body.password,10)
console.log(hash);

    
        const newUser=await new User({
                
                email:req.body.email,
                channelName:req.body.channelName,
                password:hash,
                description:req.body.description

        })

        const data=await newUser.save()
        res.status(200).json({
            data,
            message:"Signup successfully"
        })
    }
    catch(err){
        console.log(err);
        res.status(500).json({msg:'registeration failed'})
    }
};



//login
const login=async(req,res)=>{
    try{
        const user=await User.findOne({email:req.body.email})
    if(!user){
        return res.status(500).json({message:"Email not registerd"})

    }
    console.log(user);
    
    const isMatch=await bcrypt.compare(req.body.password,user.password)
    console.log(user.password);
    
    console.log(isMatch);
    
    if(!isMatch){
        return res.status(500).json({message:"password not matched"})
    }
    const token =jwt.sign({
        _id:user._id,
        channelName:user.channelName,
        email:user.email
    },
    process.env.JWT_SECRET,
    {
        "expiresIn":'365d'
    })

    res.status(200).json({token:token,data:user,message:"Login Successfully"})
    }
    catch(err){
    console.log(err);
        
        res.status(500).json({msg:'Logined failed'})
    }
}

//subscribe
const subscribe=async(req,res)=>{
   try{
const channelId = req.params.channelId;
    const token=req.headers.authorization.split(" ")[1]
   
   const tokenData=jwt.verify(token,process.env.JWT_SECRET)
  if(tokenData._id==channelId){
    return res.status(500).json({message:'You cannot subsribe yourself'})
  }
  const channel=await User.findById(channelId)
if (!channel) {
    return res.status(404).json({
        message: "Channel not found"
    });
}
 if(channel.subscriber.map(id=>(id.toString())).includes(tokenData._id)){
    return res.status(500).json({message:"already subscribed"})
 }
   channel.subscriber.push(tokenData._id);
        await channel.save();
        console.log("subscirbe successfully");
        res.status(200).json({message: "subscirbe successfully"})
        
   const user=await User.findById(tokenData._id)
   user.subscribedTo.push(channelId)
 await  user.save()
    console.log(user);


}
   catch(err)
   {
    console.log(err);
            res.status(500).json({msg:'Subscribed failed'})

   }
    
}

//unsubscribe
const unsubscribe = async (req, res) => {

    try {
        const channelId = req.params.channelId;
        const token = req.headers.authorization.split(" ")[1]

        const tokenData = await jwt.verify(token, process.env.JWT_SECRET)

        const channel = await User.findById(channelId)
        if (!channel) {
            return res.status(404).json({
                message: "Channel not found"
            });
        }
        if (!channel.subscriber.map(id => (id.toString())).includes(tokenData._id)) {
            return res.status(500).json({ message: "You are not subscribe this channel" })
        }
        channel.subscriber = channel.subscriber.filter(
    userId => userId.toString() !== tokenData._id.toString()
);

        // channel.subscriber = channel.subscriber.filter((userId) => {
        //     userId != tokenData._id
        // });


        await channel.save();

        const user = await User.findById(tokenData._id)
        user.subscribedTo = user.subscribedTo.filter(
    userId => userId.toString() !== channelId.toString()
);

        // user.subscribedTo = channel.subscribedTo.filter((userId) => {
        //     userId != channelId
        // });

        console.log("unsubscirbe successfully");
        res.status(200).json({ message: "unsubscirbe successfully" })


        await user.save()
        console.log(user);


    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'Subscribed failed' })


    }

}


//Upload Profile Image
const uploadProfileImage = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1]
        const tokenData = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(tokenData._id)

        console.log(user);

        if (!req.files || !req.files.profileImage) {
            return res.status(500).json({ message: "Profile Image Required" })
        }
        if(user.profileImageId){

            await cloudinary.uploader.destroy(user.profileImageId)
        }
        const uploadImage = await cloudinary.uploader.upload(req.files.profileImage.tempFilePath, {
    
            folder: "YouTube/userProfile"
        });
        user.profileImageUrl = uploadImage.secure_url
        user.profileImageId = uploadImage.public_id
        const data = await user.save()
        res.status(200).json({
            message: "Image uploaded",
            data
        })

    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'something wrong' })

    }
}


//Uopload Cover Image
const uploadCoverImage = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1]
        const tokenData = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(tokenData._id)

        console.log(user);

        if (!req.files || !req.files.coverImage) {
            return res.status(500).json({ message: "Cover Image Required" })
        }

         if(user.coverImageId){

            await cloudinary.uploader.destroy(user.coverImageId)
        }
        const uploadImage = await cloudinary.uploader.upload(req.files.coverImage.tempFilePath, {
            folder: "YouTube/coverImage"
        });
        user.coverImageUrl = uploadImage.secure_url
        user.coverImageId = uploadImage.public_id
        const data = await user.save()
        res.status(200).json({
            message: "Cover image uploaded",
            data
        })

    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'something wrong' })

    }
}

//Get Channel Info
const getChannelInfo = async (req, res) => {
    try {
        const channelId = req.params.channelId
        const channel = await User.findById(channelId)
        if (!channel) {
            return res.status(500).json({
                message: "Channel not found"
            })
        }
        res.status(200).json({
            channelName: channel.channelName,
            email: channel.email,
            profileIImageUrl: channel.profileImageUrl,
            profileImageId: channel.profileImageId,
            coverImageUrl: channel.coverImageUrl,
            coverImageId: channel.coverImageId,
            description: channel.description,
            subscriber: channel.subscriber.length

        })

    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'something wrong' })

    }

}

//Get User Info 
const getUserInfo = async (req, res) => {
    try {
        // const userId = req.params.userId
        const token = req.headers.authorization.split(" ")[1]
        const tokenData = await jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(tokenData._id).populate("subscribedTo", "-password -subscribedTo")
        if (!user) {
            return res.status(500).json({
                message: "User not found"
            })
        }
        console.log(user)

        const userInfo = {
            channelName: user.channelName,
            email: user.email,
            profileIImageUrl: user.profileImageUrl,
            profileImageId: user.profileImageId,
            coverImageUrl: user.coverImageUrl,
            coverImageId: user.coverImageId,
            description: user.description,
            subscriber: user.subscriber.length,
            subscribedTo: user.subscribedTo
        }

        const info = []
        userInfo.subscribedTo.forEach(d => {
            const subscriberCount = d.subscriber.length
            const data = {
                id: d._id,
                channelName: d.channelName,
                subscribers: subscriberCount
            }
            info.push(data)
        })
        userInfo.subscribedTo = info
        res.status(200).json({
            userInfo
        })
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'something wrong' })

    }

}

module.exports = {
    signup,
    login,
    subscribe,
    unsubscribe,
    uploadProfileImage,
    uploadCoverImage,
    getChannelInfo,
    getUserInfo
} 