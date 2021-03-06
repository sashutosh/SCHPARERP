
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose')
  , dataservice = require('./modules/dataservices')
  , messagedataservice = require('./modules/messagedataservice')
  , devicedataservice = require('./modules/devicedataservice')
  , gcm =  require('node-gcm');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var dbURI = 'mongodb://localhost/SchoolsDB';
if (process.env.NODE_ENV === 'production') {
	dbURI = process.env.MONGOLAB_URI;
}

console.log('Connecting to DB ' + dbURI);

mongoose.connect(dbURI);

var SchoolSchema = new mongoose.Schema({
	SchoolId: {type: String, required: true, unique: true },
	SchoolFullName: {type: String, required: true},
	SchoolFullAddress: String,
	SchoolMainTelephoneNumber: {type:Number ,required: true},
	AdditionalContactNumbers: 
		[
		 Number
		 ],
	SchoolWebSite: String,
	SchoolCity: String,
	SchoolState: String,
	SchoolAddressPOBox: Number,
	SchoolDistrict: String,
	SchoolType: String	
});

var ParentTypeSchema = new mongoose.Schema({
	ParentType: String
});

var StudentSchema = new mongoose.Schema({
	StudentId: {type: String, required: true, unique: true },
	SchoolId: String,
	StudentFirstName: {type: String, required: true},
	StudentMiddleName: String,
	StudentLastName: {type: String, required: true},
	StudentDOB : Date,
	Age : {type:Number, min:2, max: 24},
	StudentGender: String,
	StudentClassStandard: String,
	StudentFullAddress: String,
	ParentList: [
		{
			ParentType: String,
			ParentFirstName: {type: String, required: true},
			ParentLastname: {type: String, required: true},
			MobileNumber: {type:Number ,required: true},
			AlternateMobNumber: Number,
			EmailId: String,
			AlternateEmailID: String,
			PresentAddress: String,
			PresentAddressPOBox: Number,
			PermanentAddress: String,
			PermanentAddressPOBox: Number,
			Messages:
			[
			 {
			 Message: String,
			 Delivered: Boolean
			 }
			]
			
		}	
	]
});

var TeacherRoleSchema = new mongoose.Schema({
	TeacherRole: String
});

var TeacherSchema = new mongoose.Schema({
	TeacherId: {type: String, required: true, unique: true },
	SchoolId: String,
	TeacherFirstName: {type: String, required: true},
	TeacherMiddleName: String,
	TeacherLastName: {type: String, required: true},
	TeacherDOB : Date,
	Age : Number,
	TeacherGender: String,
	TeacherFullAddress: String,
	MobileNumber: {type:Number ,required: true},
	AlternateMobNumber: Number,
	EmailId: String,
	AlternateEmailID: String,
	PresentAddress: String,
	PresentAddressPOBox: Number,
	PermanentAddress: String,
	PermanentAddressPOBox: Number,
	Messages:
		[
		 {
		 Message: String,
		 Delivered: Boolean
		 }
		],
	TeacherRoleList: [
		{
			TeacherRoleType: String,
			TeacherRoleforStd: String,
			TeacherRoleforSubjectId: String,
			TeacherRoleforSubject: String
		}	
	]
});

var MobileDeviceMappingSchema = new mongoose.Schema({
	MobileNumber: Number,
	DeviceId: String
});

var MessageSchema = new mongoose.Schema({
	MessageId: String,
	From: String,
	To:
		[
		 String
		],
	Message: String,
	DateofMsg: Date,
	DeliveredToAll: Boolean,
	DeliveredSuccessfullyTo:
		[
		 String
		],
	DeliveredFailedTo:
		[
		 String
		]
});

var School = mongoose.model('School', SchoolSchema);

var Student = mongoose.model('Student', StudentSchema);

var ParentType = mongoose.model('ParentType', ParentTypeSchema);

var TeacherType = mongoose.model('TeacherType', TeacherRoleSchema);

var Teacher = mongoose.model('Teacher', TeacherSchema);

var MobileDevice = mongoose.model('MobileDevice', MobileDeviceMappingSchema);

var Message = mongoose.model('Message', MessageSchema);


app.get('/students/:StudentId', function(request, response) {
	console.log(request.url + ' : querying for ' +
	request.params.StudentId);
	dataservice.findStudentById(Student, request.params.StudentId,
	response);
	});

app.post('/students', function(request, response) {
	dataservice.updateStudent(Student, request.body, response)
	});

app.put('/students', function(request, response) {
	dataservice.createStudent(Student, request.body, response)
	});
	
app.del('/students/:StudentId', function(request,response) {
	console.log('request.params.StudentId');
	console.log(request.params.StudentId);
	dataservice.removeStudent(Student, request.params.StudentId, response);
	});
	
app.get('/students', function(request, response) {
		
		console.log('Listing all student with ' + request.params.key +
				'=' + request.params.value);
				dataservice.listStudent(Student, response);
	});
	

app.get('/teachers/:TeacherId', function(request, response) {
	console.log(request.url + ' : querying for ' +
	request.params.TeacherId);
	dataservice.findTeacherById(Teacher, request.params.TeacherId,
	response);
	});

app.post('/teachers', function(request, response) {
	dataservice.updateTeacher(Teacher, request.body, response)
	});

app.put('/teachers', function(request, response) {
	
	dataservice.createTeacher(Teacher, request.body, response)
	});
	
app.del('/teachers/:TeacherId', function(request,response) {
	console.log('request.params.TeacherId');
	console.log(request.params.TeacherId);
	dataservice.removeTeacher(Teacher, request.params.TeacherId, response);
	});
	
app.get('/teachers', function(request, response) {
		
		console.log('Listing all teachers with ' + request.params.key +
				'=' + request.params.value);
				dataservice.listTeachers(Teacher, response);
	});

app.get('/messages/:MessageId', function(request, response) {
	console.log(request.url + ' : querying for ' +
	request.params.MessageId);
	messagedataservice.findMessagebyId(Message, request.params.MessageId,
	response);
	});

app.post('/messages', function(request, response) {
	messagedataservice.updateMessage(Message, request.body, response)
	});

app.put('/messages', function(request, response) {
	
	messagedataservice.createMessage(Message, request.body, response)
	});
	
app.del('/messages/:MessageId', function(request,response) {
	console.log('request.params.MessageId');
	console.log(request.params.MessageId);
	messagedataservice.deleteMessage(Message, request.params.MessageId, response);
	});
	
app.get('/messages', function(request, response) {
		
		console.log('Listing all messages with ' + request.params.key +
				'=' + request.params.value);
		messagedataservice.listMessages(Message, response);
	});
	
app.get('/messages/from/:From', function(request, response) {
	console.log(request.url + ' : querying for ' +
	request.params.From);
	messagedataservice.findMessagesFrom(Message, request.params.From,
	response);
	});

app.get('/devices/:MobileNumber', function(request, response) {
	console.log(request.url + ' : querying for ' +
	request.params.MobileNumber);
	devicedataservice.findDeviceByMobileNumber(MobileDevice, request.params.MobileNumber,
	response);
	});

app.post('/devices', function(request, response) {
	devicedataservice.updateDevice(MobileDevice, request.body, response);
	});

app.put('/devices', function(request, response) {
	devicedataservice.createMobileDevice(MobileDevice, request.body, response);
	});
	
app.del('/devices/:MobileNumber', function(request,response) {
	console.log('request.params.MobileNumber');
	console.log(request.params.MobileNumber);
	devicedataservice.deleteDevice(MobileDevice, request.params.MobileNumber, response);
	});
	
app.get('/devices', function(request, response) {
		
		console.log('Listing all device with ' + request.params.key +
				'=' + request.params.value);
		devicedataservice.listDevices(MobileDevice, response);
	});

app.get('/devices/:DeviceId', function(request, response) {
	console.log(request.url + ' : querying for ' +
	request.params.DeviceId);
	devicedataservice.findDeviceByDeviceID(MobileDevice, request.params.DeviceId,
	response);
	});

app.put('/SendMessage', function(request, response) {

	var message = new gcm.Message({
	    
	    data: {
	    	"type" : "Notice",
	        "body": request.body.MessageBody,
	        "title": request.body.MessageTitle
	    },
	    notification: {
	        title: "From Ashutosh purohit node app ",
	        icon: "ic_launcher",
	        body: "This is a notification that will be displayed ASAP."
	    }
	});
	
	// Set up the sender with you API key
	var sender = new gcm.Sender('AIzaSyDvbQO3k8lkZzsN6xpRmYmg9RkDDpbPKgA');
	var registrationTokens = [];
	
	MobileDevice.find({}, function(error, result) {
		if (error) 
		{
		console.error(error);
		return null;
		}
		else
		{
			var resultcount =0;
			if(result !=undefined)
			{
				console.log("inside result");
				console.log(result.length);
				for(resultcount =0; resultcount<result.length; resultcount++)
				{
					console.log("for");
					console.log(result[resultcount].DeviceId);
					registrationTokens.push(result[resultcount].DeviceId);

				}
			}

			// Now the sender can be used to send messages
			// ... or retrying a specific number of times (10)
			sender.send(message, { registrationTokens: registrationTokens }, 10, function (err, response) {
			  if(err) 
				  {
				  console.error(err);
				  }
			  else   
				  {
				   console.log(response);
				  }
			});
	
	  }
		
	});

	
	
	// Send to a topic, with no retry this time
	sender.sendNoRetry(message, { topic: '/topics/global' }, function (err, response) {
	    if(err) {console.error(" Error " + err);}
	    else    {console.log("Success " + response);}
	});
	
	
	response.end('Ended final');
	});

app.put('/SendMessageToSingleUser', function(request, response) {

	var message = new gcm.Message({
	    
	    data: {
	    	"type" : "Notice",
	        "body": request.body.MessageBody,
	        "title": request.body.MessageTitle
	    },
	    notification: {
	        title: "From Ashutosh purohit node app ",
	        icon: "ic_launcher",
	        body: "This is a notification that will be displayed ASAP."
	    }
	});


	var registrationTokens = [];
	MobileDevice.findOne({MobileNumber: request.body.MobileNumber},
	 function(error, data) {
		if (error)
		{
		console.error(error);
		return null;
		}
		else 
		{			
			if(data !=undefined)
			{
				console.log(data.DeviceId);
				registrationTokens.push(data.DeviceId);	
				// Set up the sender with you API key
				var sender = new gcm.Sender('AIzaSyDvbQO3k8lkZzsN6xpRmYmg9RkDDpbPKgA');

				// Now the sender can be used to send messages
				// ... or retrying a specific number of times (10)
				sender.send(message, { registrationTokens: registrationTokens }, 10, function (err, response) {
				  if(err) {console.error(err);}
				  else    {console.log(response);}
				});
			}
		}
	});
	
	
	response.end('Ended final')
	});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
