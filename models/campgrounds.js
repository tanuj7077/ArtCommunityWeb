var mongoose = require("mongoose");
 
var campgroundSchema = new mongoose.Schema({
   name: String,
   image: String,
   description: String,
   imageKey: String,
   datePosted: String,
   author:{
      id:{
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String
   },
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ],
   likesArray: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      }
   ],
   tags: [
      {
         type: String
      }
   ]
});
 
module.exports = mongoose.model("Campground", campgroundSchema);