var express = require("express");
var router = express.Router({mergeParams: true});
var Campground = require("../models/campgrounds");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var moment = require("moment");
//COMMENTS Routes
//comments new
router.get("/new", middleware.isLoggedIn, function(req,res){
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        } else{
            res.render("comments/new", {campground: campground});//new for comment
        }
    });
});

//comments save
router.post("/", middleware.isLoggedIn, function(req, res){
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        } else{
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    req.flash("error", "Something went wrong");
                    console.log(err);
                } else{
                    //add username and id to comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.datePosted = moment().format('ddd MMM DD YYYY HH:mm');
                    comment.save();

                    campground.comments.push(comment);
                    //campground.comment = campground.comments.length;
                    campground.save();
                    req.flash("success", "Successfully added comment");
                    res.redirect("/campgrounds/" + campground._id);
                }
            });
        }
    });
});

//COMMENT EDIT route
router.get("/:comment_id/edit", middleware.checkCommentOwner, function(req,res){
    Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err){
            res.redirect("back");
        } else{
            res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});
        }
    });
});

//COMMENT UPDATE route
router.put("/:comment_id", middleware.checkCommentOwner, function(req,res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err){
            res.redirect("back");
        } else{
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

//COMMENT DELETE route
router.delete("/:comment_id", middleware.checkCommentOwner, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("back");
        } else{
            //updating comment count
            Campground.findById(req.params.id, function(err, campground){
                if(err){
                    console.log(err);
                    res.redirect("back");
                } else{
                    campground.comment = campground.comment-1;
                    campground.save();
                    req.flash("success", "Comment deleted");
                    res.redirect("/campgrounds/" + req.params.id);
                }
            }); 
        }
    });
})

module.exports = router;