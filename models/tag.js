var mongoose = require("mongoose");
 
var tagSchema = new mongoose.Schema({
    text: String,
    campgrounds: [
        {
           type: mongoose.Schema.Types.ObjectId,
           ref: "Campground"
        }
    ]
});
 
module.exports = mongoose.model("Tag", tagSchema);