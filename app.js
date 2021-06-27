//jshint esversion:6

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
const date = require(__dirname + '/date.js');
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
const day = date.getDate();

const dbUrl = process.env.MONGO_DB;
mongoose.connect(
  dbUrl,
  { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }
);


//Provide starting content for static pages
const homeStartingContent =
  "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent =
  "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent =
  "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";


//Set up the Post Schema
const postSchema = new Schema({
  title: {
    type: String,
    required: { true: "You must supply a title" },
  },
  body: String,
  authorMeta: {
    author: String,
  },
  slug: String,
  category: [String],
  comments: [{ body: String, date: Date }],
  createdDate: { type: Date, default: Date.now },
  publishDate: { type: Date, default: Date.now },
  image: {
    data: Buffer,
    type: String
  },
  featured: Boolean,
  archived: Boolean,
  hidden: Boolean,
  meta: {
    votes: Number,
    favs: Number,
  },
  slug: String
});
const Post = mongoose.model("Post", postSchema);

//If no posts, here's a filler
const postFiller = new Post({
  title: "Post Filler",
  slug: "post-filler",
  body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Id venenatis a condimentum vitae sapien pellentesque habitant morbi. Libero id faucibus nisl tincidunt eget nullam non nisi. Scelerisque viverra mauris in aliquam sem fringilla ut. Neque sodales ut etiam sit amet nisl purus in mollis. Auctor urna nunc id cursus metus aliquam eleifend. Dolor sit amet consectetur adipiscing elit. Cras semper auctor neque vitae tempus quam pellentesque. Elit pellentesque habitant morbi tristique senectus et netus. Porta non pulvinar neque laoreet suspendisse interdum consectetur Congue eu consequat ac felis donec et. Dictum at tempor commodo ullamcorper a lacus. Curabitur vitae nunc sed velit. Aenean euismod elementum nisi quis. Neque volutpat ac tincidunt vitae semper quis lectus nulla. Facilisis gravida neque convallis a cras semper. Cras tincidunt lobortis feugiat vivamus at. Scelerisque eleifend donec pretium vulputate sapien nec sagittis aliquam. Fermentum dui faucibus in ornare quam. In tellus integer feugiat scelerisque varius morbi. Feugiat nibh sed pulvinar proin",
});
const defaultPost = [postFiller];

//Set up home page for dynamic content
app.get("/", function (req, res) {

  Post.find({featured: true}, function(err, foundFeatured) {
    if (!err) {
      if (foundFeatured.length === 0) {
        res.render("home", { homeIntro: homeStartingContent, posts: defaultPost, _: _ });
      } else {
        res.render("home", { homeIntro: homeStartingContent, posts: foundFeatured, _: _ });
      }
    }
  });
});

//Static menu item pages
app.get("/about", function (req, res) {
  res.render("about", {
    aboutContent: aboutContent,
  });
});

app.get("/contact", function (req, res) {
  res.render("contact", {
    contactContent: contactContent,
  });
});

app.get("/compose", function (req, res) {
  res.render("compose");
});

//Compose new post and redirect to home screen
app.post("/compose", function (req, res) {

  //Declare the objects 
  const title = req.body.postTitle;
  const body = req.body.postBody;
  const catNames = req.body.postCategory;
  const slug = _.kebabCase(title);
  const categories = catNames.split(',');
  const featured = req.body.postFeatured;

  // Now save the post
  const newPost = new Post ({
    title: title,
    body: body,
    category: categories,
    featured: featured,
    slug: slug
  });
  newPost.save(function (err) {
    if (!err) {
    res.redirect("/");
    }
  });
});


// Send requests for full articles to corellating address by id or, if manually typed, return an array of matching post titles
app.get("/posts/:postWanted", function (req, res) {

  const requestedPost = req.params.postWanted;

  Post.find({ _id: requestedPost}, function(err, foundById) {
    if (err) {
      Post.find({title: _.startCase(requestedPost)}, function(err, foundByName) {
        if (err) {
          console.log(err);
        } else if (foundByName.length === 0) {
          const error = "404 Item not found!"
          res.render("error", { error: error});
        } else {
          console.log(foundByName);
          res.render("post", { post: foundByName});
        }
      });
    } else {
    console.log(foundById);
    res.render("post", { post: foundById});
    }
  });
});


//Define the server listening port
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log("Server started successfully");
});
