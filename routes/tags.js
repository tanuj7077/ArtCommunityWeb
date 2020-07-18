var express = require("express");
var router = express.Router({mergeParams: true});
var Campground = require("../models/campgrounds");
var Tag = require("../models/tag");

//all tags
router.get("/", function(req,res){
    
    tags = [];
    Tag.find({},function(err,foundTags){
        for(let t of foundTags){
            if(t.campgrounds.length>0){
                tags.push(t);
            }
        }
        res.render("campgrounds/explore",{tags: tags});
    });
});
router.get("/*", function(req,res){
    
    Tag.find({text:req.params[0]}).exec(function(err, foundTag){
        var arr=[];
        for(let campground of foundTag[0].campgrounds){
            Campground.findById(campground._id).exec(function(err, foundCampground){
                arr.push(foundCampground);
                if(arr.length==foundTag[0].campgrounds.length){
                    res.render("campgrounds/tag",{campgrounds: arr, tag:req.params[0]});
                }
            });
        }
    });
    
});



module.exports = router;