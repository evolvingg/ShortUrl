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

    //check if url is valid
    if (url) {
      const urlRegex = new RegExp(/((https):\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/);
      let result = urlRegex.test(url);
      if(!result) {
        res.render('error',{msg:"incorrect url format"});
      } 
    }
  
    console.log("custom name:", url,expiryTime);
    console.log('---cst---',customUrl);

    //expiry time should be correct
    if(!expiryTime) {
      res.render('error',{msg:"provide expire time"});
    }
    else if(expiryTime && Number.isNaN(expiryTime)){
      res.render('error',{msg:"provide valid expire time"});
    }

    const urlCached = await cacheService.getValue(customUrl);
    if(urlCached){
      console.log('cache----',urlCached);
      res.render('index',{ searched:urlCached, shortUrls});
    }

    if(!urlCached) {
      //not found in cache then hit db
      const currentDate = new Date().getTime();
      const expiryDate = new Date(currentDate + parseInt(expiryTime) * 1000);
      const newShortId = shortId.generate().toLowerCase();
      let newIdExists = await ShortUrl.findOne({ customUrl: newShortId });
      if (customUrl == ''){
        if (newIdExists) {
          res.render('error',{msg:"id was regenerated at server please try again"});
        }
        await ShortUrl.create({ url, customUrl:newShortId, expiryDate })
      }
      else {
        let nameExists = await ShortUrl.findOne({ customUrl });
        if(nameExists && nameExists.url!==url){
          res.render('error',{msg:"name already exists, choose another"});
        }
        else if (nameExists && nameExists.url===url) {
          //not found in cache then hit db
          nameExists.searched++;
          nameExists.save();
          //searched 5 times so goes in cache
          if(nameExists.searched >= 5) {           
            cacheService.setValue( customUrl,nameExists ); //in ms
          }
          console.log('db----',nameExists);
          res.render('index',{ searched:nameExists, shortUrls})
        }
        else {
          await ShortUrl.create({ url, customUrl, expiryDate })
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