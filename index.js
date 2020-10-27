const express = require("express");
const mongoose = require("mongoose");
const app = express();
const ShortUrl = require('./models/shortUrls');
const shortId = require('shortid');
const cacheService = require('./cacheService/cache');

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
    res.render('index', { shortUrls, searched: null })
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

    if (url) {
      const urlRegex = new RegExp(/((https):\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/);
      let result = urlRegex.test(url);
      if(!result) {
        res.render('error',{msg:"incorrect url format"});
      } 
    }
  
    console.log("custom name:", url,expiryTime);
    console.log('---cst---',customUrl)
  
    if(!expiryTime) {
      res.render('error',{msg:"provide expire time"});
    }
    else if(expiryTime && Number.isNaN(expiryTime)){
      res.render('error',{msg:"provide valid expire time"});
    }

    const urlCached = await cacheService.getValue(url);
    if(urlCached){
      console.log('cache----',urlCached);
      if(customUrl) {
        cacheService.replaceValue(url,{...urlCached,customUrl});
        res.render('index',{ searched:{...urlCached,customUrl}, shortUrls});
      }
      res.render('index',{ searched:urlCached, shortUrls});
    }

    if(!urlCached) {
      //not found in cache then hit db
      let searched = await ShortUrl.findOne({url:url});
      if(searched) {
        searched.searched++;
        searched.save();
        //searched 5 times so goes in cache
        if(searched.searched >= 5) {           
          cacheService.setValue( url,searched ); //in ms
        }
        console.log('db----',searched);
        res.render('index',{ searched, shortUrls})
      }
      else {
        const currentDate = new Date().getTime();
        const expiryDate = new Date(currentDate + parseInt(expiryTime) * 1000);
        if (customUrl == ''){
          await ShortUrl.create({ url, customUrl:shortId.generate().toLowerCase(), expiryDate })
        }
        else {
          let nameExists = await ShortUrl.findOne({ customUrl });
          if(nameExists){
            res.render('error',{msg:"name already exists, choose another"});
          }
          else {
            await ShortUrl.create({ url, customUrl, expiryDate })
          }
        }
      }
    }      

    res.redirect('/');
  }
  catch(err) {
    res.render('error',{msg:err});
    console.log(err,':--');
  }
})

 
app.get('/:shortUrl', async (req, res) => {
  try {
    const shortUrl = await ShortUrl.findOne({customUrl: req.params.shortUrl})

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