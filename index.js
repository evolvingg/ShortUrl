const express = require("express");
const mongoose = require("mongoose");
const app = express();
const ShortUrl = require('./models/shortUrls');

const port = process.env.PORT || 5000;
require('dotenv').config();

mongoose.connect('mongodb://tanvi:DNGUBIEAXOAryyfM@cluster0-shard-00-00-6utpu.mongodb.net:27017,cluster0-shard-00-01-6utpu.mongodb.net:27017,cluster0-shard-00-02-6utpu.mongodb.net:27017/url-shortner?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority', {
  useNewUrlParser: true, useUnifiedTopology: true
})


app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false}))

app.get('/', async (req, res) => {
  try {
    const shortUrls =  await ShortUrl.find();
    res.render('index',{shortUrl: shortUrls[shortUrls.length-1]});
  }
  catch(err) {
    console.log(err,':--');
  }
});

app.post('/shortUrls', async (req, res) => {
  try {
      await ShortUrl.create({url: req.body.Url, custom: req.body.customUrl, expiryDate: req.body.expiryTime});

    const d = new Date;
    const exp = new Date(req.body.expiryTime);
    console.log(exp.toDateString(),'---',d.toDateString())
    if(d.toDateString() === exp.toDateString()) {
      await ShortUrl.findOneAndRemove({urlCode:req.body.urlCode})
    }
    res.redirect('/');
  }
  catch(err) {
    console.log(err,':--');
  }
});
 
app.get('/:shortUrl', async (req, res) => {
  try {
    const shortUrl = await ShortUrl.findOne({urlCode: req.params.shortUrl})

    if(shortUrl == null) {
      return res.sendStatus(404);
    }

    shortUrl.hits++;
    shortUrl.save();


    res.redirect(shortUrl.url)
  }
  catch(err) {
    console.log(err,':--');
  }
})

app.listen(port, () => console.log("Server started at port " + port));