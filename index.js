const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
// MongoDB connection
  mongoose.connect("mongodb+srv://ummarrahil:06031998Rahil@cluster0.7baglhg.mongodb.net/device?retryWrites=true&w=majority&appName=Cluster0").then(()=>{
  //mongoose.connect("mongodb://127.0.0.1:27017/device").then(()=>{
  console.log("mongodb connected")
  initializeData();
}).catch((error)=>console.log(error));

// Define schema and model
const deviceData = new mongoose.Schema({
  id:String,
  battery: String,
  load: String,
  status: String,
  lastonline: String,
  lastDate:Date
}

);

const userModel=mongoose.model("data",deviceData);

const { time } = require('console');
process.env.TZ = 'Asia/Dubai'
'Asia/Dubai'

var secound = new Array(2).fill(0);
var lastseen = new Array(2).fill(new Date());

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = 3000;

app.use(bodyParser.json()); 
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
let sensorData = [{
  id:"1",
  battery:"0",
  load: "OFF",
  status:"OFFLINE",
  lastonline:"",
  lastDate:new Date()
},
{
  id:"2",
  battery:"0",
  load: "OFF",
  status:"OFFLINE",
  lastonline:"",
  lastDate:new Date()
}
];

var m=true;

app.post('/data', async (req, res) => {
  console.log(req.body);
  if (req.body.battery !== undefined && req.body.load !== undefined) {
    sensorData[parseInt(req.body.id)-1].battery = req.body.battery;
    sensorData[parseInt(req.body.id)-1].load = req.body.load;
    m=false;
    secound[parseInt(req.body.id)-1]=0;
    lastseen[parseInt(req.body.id)-1]=new Date();
    sensorData[parseInt(req.body.id)-1].lastDate=lastseen[parseInt(req.body.id)-1];
    sensorData[parseInt(req.body.id)-1].lastonline=dateAndtimeString(parseInt(req.body.id)-1);
    sensorData[parseInt(req.body.id)-1].status="Online";
    
    
    //const newSensorData = new userModel(sensorData);
    await userModel.updateOne({id:req.body.id}, { $set: sensorData[parseInt(req.body.id)-1] }, { upsert: true });
  }
  else
  {
    console.log("interrupt");
  }

  
  io.emit('updateData', sensorData);
  res.send('Data received');
});

app.get('/', async(req, res) => {
  res.render('index', { data: sensorData });
});
app.get('/user', async(req, res) => {
  const data=await userModel.find();
  res.json(data);
});



setInterval(updateLastseen, 50000);
setInterval(secCount, 50000);
function secCount()
{
  for(let i=0;i<2;i++)
  {
    secound[i]++;

  }
  
}



async function updateLastseen()
{
 
  for( m=0;m<2;m++)
  {
    console.log(m);
    if(secound[m]>=1)
      {
        secound[m]=2;
        sensorData[m].status ="offline";
        sensorData[m].lastonline=dateAndtimeString(m);
        sensorData[m].lastDate=lastseen[m];
      }
      else
      {
        sensorData[m].status = "Online";
        sensorData[m].lastonline=dateAndtimeString(m);
        sensorData[m].lastDate=lastseen[m];
      }
      
      await userModel.updateOne({id:(i+1).toString()}, { $set: sensorData }, { upsert: true });
  }
 
  io.emit('updateData', sensorData);
  //await userModel.updateMany({}, { $set: sensorData }, { upsert: true });
  console.log(sensorData);
  //
  

  
} 

function strLen(data) {
  var value=data.toString().length;
  if(value==1)
  {
      return "0"+data
  }
  else{
      return data
  }
}

function dateAndtimeString(k)
{
       var day1 = lastseen[k].getDate();
       var month1 = lastseen[k].getMonth();
       var year1 = lastseen[k].getFullYear();
       var hour1 = lastseen[k].getHours();
       var min1 = lastseen[k].getMinutes();
       var sec1 = lastseen[k].getSeconds();
      day1=strLen(day1);
      month1=month1+1;
     month1= strLen(month1);
     min1=strLen(min1);
      hour1=strLen(hour1);
      sec1=strLen(sec1);
      var output=hour1 + ":" + min1+":" + sec1+ "  " + day1 + "/" +month1  + "/" + year1;
      return output;
}


io.on('connection', (socket) => {
  console.log('New client connected');
  socket.emit('updateData', sensorData); // Send the initial data to the new client
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });  
});

async function initializeData() {
  const latestData = await userModel.find({}, {}, { sort: { 'createdAt': -1 } });
  if (latestData) {
    
    sensorData = latestData.map(doc => doc.toObject());
    for(let i=0;i<2;i++)
    {
      lastseen[i]=sensorData[i].lastDate;
      if(sensorData.status[i]=="ofline")
      {
        secound[i]=2;
      }
      else{
        secound[i]=0;
      }
    }
    console.log(sensorData);
  } else { 
    console.log("No data found in MongoDB. Using default values.");
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}


