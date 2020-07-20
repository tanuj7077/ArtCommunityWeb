//all the middlewares
var Campground = require("../models/campgrounds");
var Comment= require("../models/comment");
var Tag = require("../models/tag");

//adding to aws s3
var aws = require("aws-sdk"),
    multerS3 = require("multer-s3");

const s3 = new aws.S3({
 accessKeyId: 'AKIATZVYTY44PPPVRSAH',
 secretAccessKey: '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',
 Bucket: 'god-art-bucket',
 region: 'ap-south-1'
});
var middlewareObj = {};

middlewareObj.checkCampgroundOwner = function(req, res, next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundCampground){
            if(err){
                res.redirect("back");
            } else{
                if(foundCampground.author.id.equals(req.user._id)){
                    next();
                } else{
                    res.redirect("back");
                }
            }
        });
    } else{
        res.redirect("back");
    }
}

middlewareObj.checkCommentOwner = function(req, res, next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err){
                req.flash("error", "Campground not found")
                res.redirect("back");
            } else{
                if(foundComment.author.id.equals(req.user._id)){
                    next();
                } else{
                    req.flash("error","You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to login first");
        res.redirect("back");
    }
}

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();//for next middleware in route
    }
    req.flash("error", "You need to login first");//key,value
    res.redirect("/login");//if not logged in
}

middlewareObj.deleteRelated = function(req, res, next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundCampground){

            s3.deleteObject({
                Bucket: 'god-art-bucket',
                Key: foundCampground.imageKey
            },function (err,data){
                if(err){
                    console.log(err);
                    return next()
                } else{
                    console.log(foundCampground.imageKey);
                    console.log(data);
                    console.log("file deleted");
                    return next();
                }
            })
            
            //Delete comments
            for(let comment of foundCampground.comments){
                Comment.findByIdAndDelete(comment._id,function(err){
                    console.log("comment deleted")
                });
            }

            //Deleting campgrounds from associated tags
            for(let tag of foundCampground.tags){
                Tag.find({}, function(err, allTags){
                    if(err){
                        console.log(err);
                    } else{
                        console.log("tags deleted");
                        for(let t of allTags){
                            if(t.text == tag){
                                for(var i = 0; i < t.campgrounds.length; i++){
                                    if( t.campgrounds[i].equals(foundCampground._id)){ 
                                        t.campgrounds.splice(i, 1); 
                                        console.log("deleted", foundCampground.name, "from", t.text);
                                        t.save();
                                        break;
                                    }
                                }
                                break;
                            }
                        }
                    }
                });
            }
        });
    }
}

middlewareObj.deleteComment = function(req, res, next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundCampground){
            for(let comment of foundCampground.comments){
                Comment.findByIdAndDelete(comment._id,function(err){
                });
            }
        });
    }
}



module.exports = middlewareObj