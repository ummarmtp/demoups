const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
// MongoDB connection

mongoose.connect("mongodb+srv://ummarrahil:06031998Rahil@cluster0.7baglhg.mongodb.net/device?retryWrites=true&w=majority&appName=Cluster0").then(()=>{
  console.log("mongodb connected")
  initializeData();
}).catch((error)=>console.log(error));

// Define schema and model
const deviceData = new mongoose.Schema({
  battery: String,
  load: String,
  status: String,
  lastonline: String
});

const userModel=mongoose.model("data",deviceData);

const { time } = require('console');
process.env.TZ = 'Asia/Dubai'
'Asia/Dubai'

var lastseen=new Date();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = 3000;

app.use(bodyParser.json()); 
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
let sensorData = {
  battery:"0",
  load: "OFF",
  status:"OFFLINE",
  lastonline:""
};

var m=true;
var secound=0;
app.post('/data', async (req, res) => {
  console.log(req.body);
  if (req.body.battery !== undefined && req.body.load !== undefined) {
    sensorData.battery = req.body.battery;
    sensorData.load = req.body.load;
    m=false;
    secound=0;
    sensorData.lastonline=dateAndtimeString();
    sensorData.status="Online";
    lastseen=new Date();
    //const newSensorData = new userModel(sensorData);
    await userModel.updateOne({}, { $set: sensorData }, { upsert: true });
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
  secound++;
}



async function updateLastseen()
{
  // var time = new Date();
  // var mins = parseInt(time.getMinutes()) - parseInt(lastseen.getMinutes());
  // if (Math.abs(mins) < 1 && m == false) {
  //   sensorData.status = "Online";
  //   sensorData.lastonline=dateAndtimeString();
    
  // }
  // else {
  //   //   var day = lastseen.getDate();
  //   //   var month = lastseen.getMonth();
  //   //   var year = lastseen.getFullYear();
  //   //   var hour = lastseen.getHours();
  //   //   var min = lastseen.getMinutes();
  //   //   day=strLen(day);
  //   //   month=month+1;
  //   //  month= strLen(month);
  //   //   min=strLen(min);
  //   //   min=strLen(hour);
  //     //sensorData.status = hour + ":" + min + "  " + day + "/" +month  + "/" + year;
  //     //sensorData.lastonline = hour + ":" + min + "  " + day + "/" +month  + "/" + year;
  //     sensorData.status=dateAndtimeString();
  //     sensorData.lastonline=dateAndtimeString();
  //     m = true;
  // }
  if(secound>=1)
  {
    secound=2;
    sensorData.status ="offline";
    sensorData.lastonline=dateAndtimeString();
    
  }
  else
  {
    sensorData.status = "Online";
    sensorData.lastonline=dateAndtimeString();
    
   

  }
  //sensorData.load=sensorData.load=='1'?'0':'1'

  await userModel.updateOne({}, { $set: sensorData }, { upsert: true });
  io.emit('updateData', sensorData);
  console.log(sensorData);

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

function dateAndtimeString()
{
  var day1 = lastseen.getDate();
      var month1 = lastseen.getMonth();
      var year1 = lastseen.getFullYear();
       var hour1 = lastseen.getHours();
       var min1 = lastseen.getMinutes();
       var sec1 = lastseen.getSeconds();
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
  const latestData = await userModel.findOne({}, {}, { sort: { 'createdAt': -1 } });
  if (latestData) {
    secound=1;
    sensorData = latestData.toObject();
  } else {
    console.log("No data found in MongoDB. Using default values.");
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

// server.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`);
// });
