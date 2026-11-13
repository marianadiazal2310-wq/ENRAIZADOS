const mongoose=require("mongoose");
const schema=new mongoose.Schema({name:{type:String,required:true,trim:true,maxlength:100},email:{type:String,required:true,lowercase:true,trim:true},message:{type:String,required:true,trim:true,maxlength:2000},status:{type:String,enum:["nuevo","respondido"],default:"nuevo"}},{timestamps:true});
module.exports=mongoose.model("Contact",schema);