var express = require("express");
var router = express.Router({mergeParams: true});
var Campground = require("../models/campgrounds");
var Comment = require("../models/comment");
var Tag = require("../models/tag");
var middleware = require("../middleware");
var fs = require('fs');
var moment = require("moment");

var multer = require('multer');
var path = require('path');

// Set The Storage Engine
const storage = multer.diskStorage({
    destination: './public/uploads/',
    //destination: '',
    filename: function(req, file, cb){
      cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });
  
  // Init Upload
var upload = multer({
    storage: storage,
    limits:{fileSize: 10000000},
    fileFilter: function(req, file, cb){
      checkFileType(file, cb);
    }
  }).single('image');
  
  // Check File Type
  function checkFileType(file, cb){
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);
  
    if(mimetype && extname){
      return cb(null,true);
    } else {
      cb('Error: Images Only!');
    }
  }
  
//INDEX
router.get("/", function(req,res){
    //get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
        if(err){
            console.log(err);
        }
        else{
            tags = [];
            Tag.find({},function(err,foundTags){
                for(let t of foundTags){
                    if(t.campgrounds.length>0){
                        tags.push(t.text);
                    }
                }
                res.render("campgrounds/index",{campgrounds: allCampgrounds, Tags: tags});
                //res.render("campgrounds/index",{campgrounds: allCampgrounds, tags: tags});
            })
        }
    });
});

//----------------SEARCH by Tags--------------------
router.post("/search", function(req, res){
    var tag = req.body.tag;
    res.redirect("../tags/"+tag);
})

//when creating new campground
//---------------------CREATE-----------------------
router.post("/", middleware.isLoggedIn, function(req,res){
    upload(req, res, function(err){
        if(err){
            res.redirect("/campgrounds");
        } else {
        if(req.file == undefined){
            res.redirect("/campgrounds");
        } else {
            var name = req.body.name;
            var image = req.file.filename;
            var desc = req.body.description;
            var Tags = req.body.tags;
            var datePosted = moment().format('ddd MMM DD YYYY HH:mm');
            var author = {
                        id: req.user._id,
                        username: req.user.username
                        }
            var newCampground = {tags: Tags, name: name, image: image, description: desc, author: author, datePosted: datePosted};
            //create a new campground and save to DB
            var tags=[];
            if(typeof(Tags)=="string"){//when only 1 tag is given it is interpreted as a string thus the need to convert to object
                tags=Tags.split(" ");
            } else if(typeof(Tags)=="undefined"){//when no tags given
                console.log("No tags added");
            }else{
                tags = Tags;
            }
            Campground.create(newCampground, function(err, newlyCreated){
                if(err){
                        console.log(err);
                } else{
                    //add the campground to different tags
                        var c=0;
                    for(let tag of tags){
                        Tag.find({}, function(err, allTags){
                            if(err){
                                console.log("couldn't search");
                            }else{
                                var c=0;
                                for(let i of allTags){
                                    if(i.text == tag){//if such tag exists
                                        i.campgrounds.push(newlyCreated._id);
                                        i.save();
                                        console.log("added campground to", i.text);
                                        c++;
                                        break;
                                    }
                                }
                                if(c==0){//if no such tags
                                    newTag={text: tag};
                                    Tag.create(newTag,function(err, createdTag){
                                        if(err){
                                            console.log("tag not created");
                                        }else{
                                            console.log("Created tag", createdTag.text);
                                            createdTag.campgrounds.push(newlyCreated._id);
                                            createdTag.save();
                                            c++;
                                        }
                                    });
                                }
                            }
                            });
                    }
                    console.log("Campground created")
                    res.redirect("/campgrounds");
                }
            });   
        }
        }
    });
});

//Show form to create new campground
//NEW
router.get("/new", middleware.isLoggedIn, function(req,res){
    var navSearch=1;
    tags = ["abstract","pop","cubism","outside","photography","insect","reptile","bird","beach","sea","night","ship",
    "sunset","flower","sky","nature","snow","tree","digital","river","bridge","festival","macro","aurora","clouds","mountain",
    "building","farm","sculpture","old","food","car","monochrome","garden","family","city","cat","dog","season",
    "winter","summer","spring","leaf","landscape","fanart","portrait","waterColor","games","sports"]
    res.render("campgrounds/new", {tags: tags, navSearch: navSearch});
})

//--------------------Display campground--------------------
router.get("/:id",function(req,res){
    
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        var foundCamps=[];
        var msg="";
        if(err){
            console.log(err);
        }else{
            //--------------------for other campground by same author-------------
            Campground.find({}, function(err, allCampgrounds){
                if(err){
                    console.log(err);
                }else{
                    for(let campground of allCampgrounds){
                        if(campground.author.username == foundCampground.author.username){
                            foundCamps.push(campground);
                        }
                    }
                    if( typeof(req.user) == "undefined" || !foundCampground.author.id.equals(req.user._id)){
                        msg += "Other submissions by " + foundCampground.author.username;
                        res.render("campgrounds/show",{campground: foundCampground, campgrounds:foundCamps, msg:msg}); 
                    }else{
                        foundCamps=[];
                        res.render("campgrounds/show",{campground: foundCampground, campgrounds:foundCamps, msg:msg});
                    }
                } 
            }); 
        }
    });
});

//--------------EDIT campground route form--------------
router.get("/:id/edit", middleware.checkCampgroundOwner, function(req,res){
    Campground.findById(req.params.id, function(err, foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});

//---------------UPDATE campground route-----------------
router.put("/:id",middleware.isLoggedIn, function(req,res){
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
        if(err){
            res.redirect("/campgrounds");
        } else{
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

//-----------------Adding likes-----------------
router.get("/:id/like", middleware.isLoggedIn, function(req,res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err){
            console.log(err);
        }
        else{
            var likesArray = foundCampground.likesArray;
            if(!likesArray.includes(req.user._id)){
                likesArray.push(req.user._id);
            }
            likedCampground = {likesArray: likesArray}
            Campground.findByIdAndUpdate(req.params.id, likedCampground, function(er, updatedCampground){
                if(er){
                    console.log(er);
                    res.redirect("back");
                } else{
                    res.redirect("back");
                }
            });
        }
    });
});

//----------DESTROY campground route-------------
router.delete("/:id", middleware.checkCampgroundOwner, middleware.deleteRelated, function(req,res){
    Campground.findByIdAndDelete(req.params.id,function(err){
        if(err){
            res.redirect("/campgrounds");
        }else{
            res.redirect("/campgrounds");
        }
    });
});



module.exports = router;
