const mongoose=require('mongoose')
const userSchema=new mongoose.Schema({
    channelName: {
      type: String,
      required:true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
    },

    

    profileImageUrl: {
      type: String,
      default: "",
    },

    profileImageId: {
      type: String,
      default: "",
    },
     coverImageUrl: {
      type: String,
      default: "",
    },

    coverImageId: {
      type: String,
      default: "",
    },
    description:{
        type:String,
       required:true
    },
    subscriber:[
        {
            type:mongoose.Schema.Types.ObjectId,
            default:[],
            ref:'User'
        }
    ],
    subscribedTo:[
        {
            type:mongoose.Schema.Types.ObjectId,
            default:[],
            ref:'User'
        }
    ]
},
{
    timestamps: true,
  }

)

module.exports=mongoose.model('User',userSchema)