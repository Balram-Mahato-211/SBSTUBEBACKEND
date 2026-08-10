const express=require('express')
const { signup ,login ,subscribe ,unsubscribe , uploadProfileImage , uploadCoverImage, getChannelInfo ,getUserInfo} = require('../controllers/userController')
const router=express.Router()

router.post('/signup',signup)

router.post('/login',login)

router.put('/subscribe/:channelId',subscribe)

router.put('/unsubscribe/:channelId',unsubscribe)

router.put('/uploadProfileImage',uploadProfileImage)

router.put('/uploadCoverImage',uploadCoverImage)

router.get('/getChannelInfo/:channelId',getChannelInfo)

router .get('/getUserInfo',getUserInfo)


module.exports=router