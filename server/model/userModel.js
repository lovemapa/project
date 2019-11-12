const mongoose = require('mongoose')
const Schema = mongoose.Schema
const userSchema = new Schema({
    
    name:{type:String},
    email:{type:String,unique:true},
    password:{type:String, length: 8-15},
    token:{type:String},
    role: {type: String,enum: ['Accounts','Sales','PM','Developer'],required: true},
    isadmin:{type:Number,default:0}
})

const User = mongoose.model('user',userSchema)
module.exports = User;