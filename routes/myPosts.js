var express = require("express");
var router = express.Router({mergeParams: true});
var Campground = require("../models/campgrounds");

  //--------------------My Posts---------------------
router.get("/", function(req,res){
    Campground.find({}, function(err, allCampgrounds){
        if(err){
            console.log(err);
        }
        else{
            var foundCamps=[];
            var len;
            for(let campground of allCampgrounds){
                if(campground.author.username == req.user.username){
                    foundCamps.push(campground);
                }
            }
            len=foundCamps.length;
            res.render("campgrounds/myPosts",{campgrounds: foundCamps, len:len});
        }
    });
});

module.exports = router;