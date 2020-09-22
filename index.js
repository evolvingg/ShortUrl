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
    const shortUrls = await ShortUrl.find()
    res.render('index', { shortUrls: shortUrls,searched:null })
  }
  catch(err) {
    res.render('error',{msg:err});
    console.log(err,':--');
  }
});

app.post('/shortUrls', async (req, res) => {
  try {
    let { url, customUrl } = req.body;
    const expiryTime = req.body.expiryTime;
    const shortUrls = await ShortUrl.find();
  
    console.log("custom name:", customUrl,url,expiryTime)
  
    if(!expiryTime) {
      res.render('error',{msg:"provide expire time"});
    }
    else if(expiryTime && Number.isNaN(expiryTime)){
      res.render('error',{msg:"provide valid expire time"});
    }
  
    let searched = await ShortUrl.findOne({url:url});
    console.log('here----',searched)
    if(searched) {
      searched.searched++;
      searched.save();
      res.render('index',{ searched, shortUrls})
    }
    else {
      const currentDate = new Date().getTime();
      const expiryDate = new Date(currentDate + parseInt(expiryTime) * 1000);
      if (customUrl == ''){
        await ShortUrl.create({ url, customUrl, expiryDate })
      }
      else {
        let nameExists = await ShortUrl.findOne({ customUrl });
        if(nameExists){
          res.render('error',{msg:"name already exists, choose another"});
        }
        else {
          await ShortUrl.create({ url, urlCode:customUrl, expiryDate, customUrl })
        }
      }
    }
    res.redirect('/')
  }
  catch(err) {
    res.render('error',{msg:err});
    console.log(err,':--');
  }
})

 
app.get('/:shortUrl', async (req, res) => {
  try {
    const shortUrl = await ShortUrl.findOne({urlCode: req.params.shortUrl})

    if(shortUrl == null) {
      res.render('error',{msg:'link expired'});
      return res.sendStatus(404);
    }
    shortUrl.hits++;
    shortUrl.save();
    res.redirect(shortUrl.url)
  }
  catch(err) {
    res.render('error',{msg:err});
    console.log(err,':--');
  }
})

app.listen(port, () => console.log("Server started at port " + port));