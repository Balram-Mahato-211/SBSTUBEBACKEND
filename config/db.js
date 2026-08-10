const mongoose=require('mongoose')
const connectDB=async()=>{
   try {
const dns = require('dns');
dns.setServers(['8.8.8.8']);
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("connect with DB");
        
    }
    catch (err) {
        console.log(err);

    }
    
}

module.exports=connectDB