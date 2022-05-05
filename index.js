// Place your server entry point code here
//minimist stuff
const args = require('minimist')(process.argv.slice(2));
const express = require('express')
const db = require("./src/services/database.js")
const app = express()
const morgan = require('morgan')
const fs = require('fs')
const http = require('http')

app.use(express.json())
app.use(express.static("./public"))

const port = args.port || args.p || process.env.PORT || 5000
args['port', 'help', 'debug', 'log']


const help = (`
server.js [options]
--port, -p	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.
--debug, -d If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.
--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.
--help, -h	Return this message and exit.
`)
// If --help, echo help text and exit
if (args.help || args.h) {
    console.log(help);
    process.exit(0);
}


var log = args.log || 'true'

if (log == 'true') {
  const accessLog = fs.createWriteStream('access.log', {flags: 'a'})
  app.use(morgan('accesslog', {stream: accessLog}))
}

app.use((req, res, next) => {

  let logdata = {
      remoteaddr: req.ip,
      remoteuser: req.user,
      time: Date.now(),
      method: req.method,
      url: req.url,
      protocol: req.protocol,
      httpversion: req.httpVersion,
      status: res.statusCode,
      referer: req.headers["referer"],
      useragent: req.headers["user-agent"],
  };

  const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent)

  next();
});

const debug = args.debug || false

if (debug == 'true') {
  app.get('/app/log/access', (req, res) => {
    const stmt = db.prepare("SELECT * FROM accesslog").all();
    res.status(200).json(stmt);
  });
  app.get('/app/error', (req, res) => {
    throw new Error('Error Test Successful.');
  });
}

//BEGIN COIN FUNCTIONS
function coinFlip() {
  let num = Math.floor(Math.random() * 10);
  if (num % 2 == 0) {
    return "heads";
  } else {
    return "tails";
  }
  }
  
  function coinFlips(flips) {
    let theResult = ""
    let bruh = [];
    for (let i = 0; i < flips; i++) {
      //bruh[i] = coinFlip();
      theResult = coinFlip()
      bruh.push(theResult)
    }
  return bruh;
  }
  
  function countFlips(array) {
    let nHeads = 0;
    let nTails = 0;
    if (array.length == 0) {
      return "the array is empty.";
    }
  
    var returnable = {
      heads: 0,
      tails: 0
    }
    //end edge case 
  
    array.forEach(flip => {
      if (flip == "heads") {
        returnable.heads++
      } else {
        returnable.tails++
      }
    })
    return returnable

  }

  function flipACoin(call) {
      let flip = coinFlip()
      const obj = { call: call, flip: flip, result: 'lose' }
      if (call == flip) {
          obj.result = 'win';
      }
      return obj;

  }

//server start
const server = app.listen(port, () => {
  console.log("Server running on port %PORT%".replace("%PORT%",port))
});

app.get("/app/", (req, res, next) => {
        res.statusCode = 200;
    // Respond with status message "OK"
        res.statusMessage = 'OK';
        res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });
        res.end(res.statusCode+ ' ' +res.statusMessage)
});

app.get('/app/flip/', (req, res) => {
  res.statusCode = 200;
  res.statusMessage = 'OK'
  res.json({flip:coinFlip()})
});


app.post('/app/flip/coins/', (req, res, next) => {
  const flips = coinFlips(req.body.number)
  const count = countFlips(flips)
  res.status(200).json({"raw":flips,"summary":count})
})
//END

app.get('/app/flips/:number', (req, res, next) => {
  res.statusCode = 200;
  res.statusMessage = 'OK'
  var flips = coinFlips(req.params.number)
  var summary = countFlips(flips)
  res.status(200).json({"raw" : flips, "summary" : summary})
});

app.get('/app/flip/call/heads', (req, res) => {
  res.statusCode = 200;
  res.send(flipACoin('heads'))
  res.writeHead(res.statusCode, {'Content-Type': 'text/plain'})
})

app.get('/app/flip/call/heads', (req, res) => {
  res.statusCode = 200;
  res.send(flipACoin('tails'))
  res.writeHead(res.statusCode, {'Content-Type': 'text/plain'})
})


app.use(function(req, res){
  res.status(404).send('404 NOT FOUND')
});

process.on('SIGINT', () => {
  server.close(() => {
  console.log('\nApp stopped.');
  })
})