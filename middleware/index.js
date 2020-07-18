//all the middlewares
var Campground = require("../models/campgrounds");
var Comment= require("../models/comment");
var Tag = require("../models/tag");
var fs = require('fs');
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

            //Delete images
            var filePath =__dirname + "/../public/uploads/" + foundCampground.image;
            fs.unlink(filePath, function(er){
                if(er){
                    console.log(er);
                }
                else{
                    console.log("file deleted");
                    return next();
                }
            });

            //Delete comments
            for(let comment of foundCampground.comments){
                Comment.findByIdAndDelete(comment._id,function(err){
                });
            }

            //Deleting campgrounds from associated tags
            for(let tag of foundCampground.tags){
                Tag.find({}, function(err, allTags){
                    if(err){
                        console.log(err);
                    } else{
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
    //req.flash("error", "You need to login first");
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
    //req.flash("error", "You need to login first");
}



module.exports = middlewareObj