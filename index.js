const express = require("express");
const mongoose = require("mongoose");
const app = express();
const ShortUrl = require('./models/shortUrls');


const Memcached = require('memcached');
const MEMCACHE_PORT = 11211;
// time in seconds, default set to 30 mins
const DEFAULT_CACHE_LIFETIME = 30 * 60;
const memcached = new Memcached(`localhost:${MEMCACHE_PORT}`, { retries: 10, retry: 10000, remove: true });

memcached.connect( 'localhost:11211', function( err, conn ){
  if( err ) {
  console.log( conn.server,'error while memcached connection!!');
  }
});

const getValue = (key) => {
  return new Promise((resolve, reject) => {
    memcached.get(key, function (err, data) {
      if (data) {
        return resolve(data);
      }
      return resolve('');
    });
  });
}

 const setValue = (key, value, lifetime = DEFAULT_CACHE_LIFETIME) => {
  return new Promise((resolve, reject) => {
    memcached.set(key, value, lifetime, function (err) {
      if (err) {
        return reject(err);
      }
      return resolve(value);
    });
  });
}

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
  
    console.log("custom name:", customUrl,url,expiryTime);
  
    if(!expiryTime) {
      res.render('error',{msg:"provide expire time"});
    }
    else if(expiryTime && Number.isNaN(expiryTime)){
      res.render('error',{msg:"provide valid expire time"});
    }

    const urlCached = await getValue(url);
    console.log('cache----',urlCached);
    if(urlCached){
      res.render('index',{ searched:urlCached, shortUrls});
    }

    if(!urlCached) {
      //not found in cache then hit db
      let searched = await ShortUrl.findOne({url:url});
      if(searched) {
        //searched 5 times so goes in cache
        if(searched.searched >= 5) {           
          setValue( url,searched ); //in ms
        }
        searched.searched++;
        searched.save();
        console.log('db----',searched);
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