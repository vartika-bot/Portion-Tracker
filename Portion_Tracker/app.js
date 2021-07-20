var express=require("express");
var path=require("path");
var http=require("http");
var bodyParser=require("body-parser");
var MongoClient=require("mongodb").MongoClient;
var cookieParser=require("cookie-parser");
var ObjectId=require("mongodb").ObjectId;


const helpers = require('./helpers');
const multer = require('multer');
var fs=require('fs');
const nodemailer=require('nodemailer');
const exphbs=require('express-handlebars');
// const dotenv = require('dotenv');
// const morgan = require('morgan');
const mongoose =require('mongoose');
const { Console } = require("console");
const { User}= require("parse")
var url1=require("url");
const { getMaxListeners } = require("process");




const app=express();


var server=http.createServer(app);
app.use(bodyParser.urlencoded({extended: false}));
app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, 'views'));
// app.set(express.static(path.join(__dirname, ('/public'))));
app.use(cookieParser());
// app.use('/', require('/router'))
const storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, 'public/images/');
	},
	
	// By default, multer removes file extensions so let's add them back
	filename: function(req, file, cb) {
		cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
	}
});
// // load assets
app.use('/css', express.static(path.resolve(__dirname, "style.css")))
// app.use('/js', express.static(path.resolve(__dirname, "views/js")))
// app.use('/js', require('router'))

var email, name, joiningdate, branchs, phonenumber,  branch;
var name, fees, chapter,details;
var favourite, t, c, chapters, duration, start, end;



app.get("/", function(req, res){
	res.sendFile(path.join(__dirname, './views/index.html'));
});
//////////////////////////////////// ADMIN RENDER//////////////////////////////////////////////////////////


///////////////////////////////////////////// REGISTER AND LOGIN ///////////////////////////////////////////////////////



var otp = Math.random();
otp = otp * 1000000;
otp = parseInt(otp);
console.log(otp);

var pass = Math.random();
pass = pass* 1000000;
pass = parseInt(pass);
console.log(pass);


let transporter = nodemailer.createTransport({
	host: "smtp@gmail.com",
	port: 465,
	secure: true,
	service : 'Gmail',
	
	auth: {
		user: 'Your E-mail',
		pass: 'password',
	}
	
});


app.get("/login", function(req, res){
	var userid=req.cookies["userid"];
	if(userid!=null && userid!=""){
		res.redirect("/profile");
	}else{
		res.render("login", {responseMessage: ''});
	}
});


app.post("/login", function(req, res){
	//check the credentials
	var email=req.body.email;
	var password=req.body.password;
	
	var url="mongodb://localhost:27017/";
	
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		var dbo=db.db("revision");
		dbo.collection("users").find({email: email, password: password}).toArray(function(err, data){
		
			
			if(data.length!=0){
				//if right, then store in cookies and redirect user to profile
				     if(data[0]._id=="609bfab25b5f980f08c461a3"){
			        	res.redirect("/admin");
			        	db.close();
				        }
				     else{
				      res.cookie("userid", data[0]._id, {expire: Date.now()+36000});
				      res.redirect("/profile");
				       db.close();
				}
			}
			else{
				//else show error
				res.render("login", {responseMessage : "wrong"});
				db.close();
			}
        });
		});
	});

app.get("/admin", function(req, res){
	res.render("admin");
});

app.get("/register", function(req, res){
	var userid=req.cookies["userid"];
	if(userid!=null && userid!=""){
		res.redirect("/profile");
	}else{
		res.render("register", {responseMessage: ''});
	}
});



app.post("/register", function(req, res){


 

	let upload = multer({ storage: storage, fileFilter: helpers.imageFilter }).single('profile_pic');
	upload(req, res, function(err) {
		// req.file contains information of uploaded file
		
		var url="mongodb://localhost:27017/";
		MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
			if(err) throw err;
			var dbo=db.db("revision");
			dbo.collection("users").find({email: req.body.email}).toArray(function(err, data){
				if(data.length!=0){
					
					fs.unlink(req.file.path, function(err){});
					
					res.render("register", {responseMessage : 'exists'});
					db.close();
				}else{
					var obj={
						username: req.body.username,
						email: req.body.email,
						password: req.body.password,
						profilepic: req.file.path,
						branch: req.body.branch,
						phonenumber: req.body.phonenumber,
					};
					dbo.collection("users").insertOne(obj, function(req, data){
						res.render("register",{responseMessage : 'success'});
					});
				 
	 
				
					
				}
			});
			email= req.body.email;
			console.log(email);
			var mailOptions={
			   to: req.body.email,
			   subject: "Otp for registration is: ",
			   html: "<h3>OTP for account verification is </h3>"  + "<h1 style='font-weight:bold;'>" + otp +"</h1>" // html body
		   };
		   
		   transporter.sendMail(mailOptions, (error, info) => {
			   if (error) {
				   return console.log(error);
			   }
			   console.log('Message sent: %s', info.messageId);
			   console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
		   
		   });
		});
	});
	
});

app.get('/otp', function(req,res){
	res.render('otp');
});

//////////////////////////////////////////////////profile///////////////////////////////////////////////////////////
app.get("/profile", function(req, res){
	var userid=req.cookies["userid"];
	if(userid==null || userid==""){
		res.redirect("/login");
	}else{
		//else get the cookie information and fetch data from databased
		var url="mongodb://localhost:27017/";
		
		MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
			if(err) throw err;
			var dbo=db.db("revision");
			dbo.collection("users").find({_id: ObjectId(userid)}).toArray(function(err, data){
				var username=data[0].username;
				var email=data[0].email;
				var password=data[0].password;
				var image=data[0].profilepic;
				var branch=data[0].branch;
				var phonenumber=data[0].phonenumber;
				
				
		    res.render('profile', {username: username, email: email, password: password, profilepic: image, branch: branch, phonenumber: phonenumber});
				db.close();
			});
		});
	}
});

// app.get("/update_user", function(req, res){
// 	const userid=req.body._id;
// 	console.log(userid);
// 	if(userid==null || userid==""){
// 		res.redirect("/student");
// 	}else{
// 		//else get the cookie information and fetch data from databased
// 		var url="mongodb://localhost:27017/";
		
// 		MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
// 			if(err) throw err;
// 			var dbo=db.db("lectureDB");
// 			dbo.collection("studentDB").find({_id: ObjectId(userid)}).toArray(function(err, data){
// 				var name=data[0].name;
// 				var email=data[0].email;
// 				var phonenumber=data[0].phonenumber;
// 				var joiningdate=data[0].joiningdate;
// 				var branchs=data[0].branchs;
				
				
// 		    res.render('profile', {name: name, email: email, phonenumber: phonenumber, joiningdate: joiningdate, branchs: branchs});
// 				db.close();
// 			});
// 		});
// 	}
// });


app.get("/public/images/:image", function(req, res){
	res.sendFile(__dirname+"/public/images/"+req.params.image);
});

app.get("/logout", function(req, res){
	res.clearCookie("userid");
	res.redirect("/login");
});

///////////////////////////////////////////// REGISTER AND LOGIN ///////////////////////////////////////////////////////






/////////////////////////////////////////// post DB////////////////////////////////////////////////////////////////////



app.post("/add-user", function(req, res){
	var name=req.body.name;
	var email=req.body.email;
	var phonenumber= req.body.phonenumber;
	var joiningdate=req.body.joiningdate;
	var branchs=req.body.branchs;
	var url = "mongodb://localhost:27017/lectureDB";  
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) { 
		var dbo = db.db("lectureDB"); 
		if (err) throw err;  
		dbo.collection("studentDB").insertOne( {
			name: req.body.name,
			email: req.body.email,
			phonenumber: req.body.phonenumber,
			joiningdate: req.body.joiningdate,
			branchs: req.body.branchs	
		},
		function(err) {
			if (err) throw err;  
			res.redirect("/student");
			res.end();
			
		});
		
	}); 
}); 


app.post("/add_user_v", function(req, res){
	var name=req.body.name;
	var email=req.body.email;
	var phonenumber= req.body.phonenumber;
	var joiningdate=req.body.joiningdate;
	var branchs=req.body.branchs;
	var url = "mongodb://localhost:27017/lectureDB";  
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) { 
		var dbo = db.db("lectureDB"); 
		if (err) throw err;  
		dbo.collection("studentVashi").insertOne( {
			name: req.body.name,
			email: req.body.email,
			phonenumber: req.body.phonenumber,
			joiningdate: req.body.joiningdate,
			branchs: req.body.branchs	
		},
		function(err) {
			if (err) throw err;  
			res.redirect("/student_v");
			res.end();
			
		});
		
	}); 
}); 
app.post("/add_user_t", function(req, res){
	var name=req.body.name;
	var email=req.body.email;
	var phonenumber= req.body.phonenumber;
	var joiningdate=req.body.joiningdate;
	var branchs=req.body.branchs;
	var url = "mongodb://localhost:27017/lectureDB";  
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) { 
		var dbo = db.db("lectureDB"); 
		if (err) throw err;  
		dbo.collection("studentThane").insertOne( {
			name: req.body.name,
			email: req.body.email,
			phonenumber: req.body.phonenumber,
			joiningdate: req.body.joiningdate,
			branchs: req.body.branchs	
		},
		function(err) {
			if (err) throw err;  
			res.redirect("/student_t");
			res.end();
			
		});
		
	}); 
}); 




app.post("/add_courses", function(req, res){
	var name=req.body.name;
	var fees=req.body.fees;
	var chapter= req.body.chapter;
	var url = "mongodb://localhost:27017/lectureDB";  
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) { 
		var dbo = db.db("lectureDB"); 
		if (err) throw err;  
		dbo.collection("course").insertOne( {
			name: req.body.name,
			fees: req.body.fees,
			chapter: req.body.chapter
			
		},
		function(err) {
			if (err) throw err;  
			res.redirect("/courses_new");
			res.end();
			
		});
		
	}); 
}); 


app.get("/student", function(req, res){
	name=name;
	email=email;
	phonenumber=phonenumber;
	joiningdate=joiningdate;
	branchs=branchs;
	
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
	
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		var dbo=db.db("lectureDB");
		dbo.collection("studentDB").find().toArray(function(err, data){
			db.close();
			if(!err){
				res.render('student', {details: data});
				
			}
		});
	});
},
);
// app.get("/verified", function(req, res){
	
	
// 	username= req.body.username;
// 	email =req.body.email;
// 	password= req.body.password;
	
// 	branch = req.body.branch;
// 	phonenumber = req.body.phonenumber;
// 	console.log(email);
// 	//else get the cookie information and fetch data from databased
// 	var url="mongodb://localhost:27017/";
	
// 	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
// 		if(err) throw err;
// 		var dbo=db.db("revision");
// 		dbo.collection("users").find().toArray(function(err, data){
// 			var username=data[0].username;
// 			var email=data[0].email;
// 			var password=data[0].password;
		
// 			var branch=data[0].branch;
// 			var phonenumber=data[0].phonenumber;
// 			console.log(email);
// 			db.close();
// 			if(!err){
// 				res.render('verified', {email: email});
				
// 			}
// 		});
// 	});
// },
// );
app.get("/view_s", function(req, res){
	name=name;
	email=email;
	phonenumber=phonenumber;
	joiningdate=joiningdate;
	branchs=branchs;
	
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
	
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		var dbo=db.db("lectureDB");
		dbo.collection("studentDB").find().toArray(function(err, data){
			db.close();
			if(!err){
				res.render('view_s', {details: data});
				
			}
		});
	});
},
);

app.get("/student_v", function(req, res){
	name=name;
	email=email;
	phonenumber=phonenumber;
	joiningdate=joiningdate;
	branchs=branchs;
	
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
	
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		var dbo=db.db("lectureDB");
		dbo.collection("studentVashi").find().toArray(function(err, data){
			db.close();
			if(!err){
				res.render('student_v', {details: data});
				
			}
		});
	});
},
);
app.get("/view_s_v", function(req, res){
	name=name;
	email=email;
	phonenumber=phonenumber;
	joiningdate=joiningdate;
	branchs=branchs;
	
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
	
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		var dbo=db.db("lectureDB");
		dbo.collection("studentVashi").find().toArray(function(err, data){
			db.close();
			if(!err){
				res.render('view_s_v', {details: data});
				
			}
		});
	});
},
);
app.get("/student_t", function(req, res){
	name=name;
	email=email;
	phonenumber=phonenumber;
	joiningdate=joiningdate;
	branchs=branchs;
	
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
	
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		var dbo=db.db("lectureDB");
		dbo.collection("studentThane").find().toArray(function(err, data){
			db.close();
			if(!err){
				res.render('student_t', {details: data});
				
			}
		});
	});
});
app.get("/view_s_t", function(req, res){
	name=name;
	email=email;
	phonenumber=phonenumber;
	joiningdate=joiningdate;
	branchs=branchs;
	
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
	
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		var dbo=db.db("lectureDB");
		dbo.collection("studentThane").find().toArray(function(err, data){
			db.close();
			if(!err){
				res.render('view_s_t', {details: data});
				
			}
		});
	});
});


//////////////////////////////////////   VIEW STUDENTS /////////////////////////////////////////////////////////

/////////////////////////////////  ADMIN VIEW STUDENT LECTURES///////////////////////////////////////////////
app.get("/ad_s_k",function(req, res){
	
	
	urlparam =url1.parse(req.url, true);
	userid = urlparam.query.id;
	console.log(userid);
	var url="mongodb://localhost:27017/lectureDB";
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		else{
			var dbo=db.db("lectureDB");
			dbo.collection("studentDB").find({_id:ObjectId(userid)}).toArray(function(err, data){
				var name=data[0].name;
			    var email=data[0].email;
				var phonenumber=data[0].phonenumber;
				var joiningdate=data[0].joiningdate;
				var branchs=data[0].branchs;
				
						dbo.collection("class").find({favourite:name}).toArray(function(err, info){
					if(data.length!=0){
                     res.render("ad_s_k", {name: name, email: email, phonenumber: phonenumber, joiningdate: joiningdate, branchs: branchs,favourite:favourite, details: info})
		               db.close();
					 }
					 else{
						 db.close();
					 }
				}
		);
	}
)
}
});
});
app.get("/ad_teach",function(req, res){
	
	urlparam =url1.parse(req.url, true);
	userid = urlparam.query.id;
	console.log(userid);
	var url="mongodb://localhost:27017/lectureDB";
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		else{
			var dbo=db.db("lectureDB");
			dbo.collection("teacher").find({_id:ObjectId(userid)}).toArray(function(err, data){
				var name=data[0].name;
				var email=data[0].email;
				var phonenumber=data[0].phonenumber;
				var c=data[0].c;
				var branch=data[0].branch;
				dbo.collection("class").find({t:name}).toArray(function(err, info){
					dbo.collection("classvashi").find({t:name}).toArray(function(err, vashi){
						dbo.collection("classThane").find({t:name}).toArray(function(err, thane){
							if(data.length!=0){
								res.render("ad_teach", {name: name, email: email, phonenumber: phonenumber, c:c, branch: branch, details: info, vashi: vashi, thane:thane})
								db.close();
							}
							else{
								db.close();
							}
						}
						);
					}
					)
				}
				)}
				);
			}
		});
	});
app.get("/ad_s_t",function(req, res){
	
	
	urlparam =url1.parse(req.url, true);
	userid = urlparam.query.id;
	console.log(userid);
	var url="mongodb://localhost:27017/lectureDB";
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		else{
			var dbo=db.db("lectureDB");
			dbo.collection("studentThane").find({_id:ObjectId(userid)}).toArray(function(err, data){
				var name=data[0].name;
			    var email=data[0].email;
				var phonenumber=data[0].phonenumber;
				var joiningdate=data[0].joiningdate;
				var branchs=data[0].branchs;
				dbo.collection("classThane").find({favourite:name}).toArray(function(err, info){
					if(data.length!=0){
                     res.render("ad_s_t", {name: name, email: email, phonenumber: phonenumber, joiningdate: joiningdate, branchs: branchs,favourite:favourite, details: info})
		               db.close();
					 }
					 else{
						 db.close();
					 }
				}
		);
	}
)
}
});
});
app.get("/ad_s_v",function(req, res){
	
	
	urlparam =url1.parse(req.url, true);
	userid = urlparam.query.id;
	console.log(userid);
	var url="mongodb://localhost:27017/lectureDB";
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		else{
			var dbo=db.db("lectureDB");
			dbo.collection("studentVashi").find({_id:ObjectId(userid)}).toArray(function(err, data){
				var name=data[0].name;
			    var email=data[0].email;
				var phonenumber=data[0].phonenumber;
				var joiningdate=data[0].joiningdate;
				var branchs=data[0].branchs;
				dbo.collection("classvashi").find({favourite:name}).toArray(function(err, info){
					if(data.length!=0){
                     res.render("ad_s_v", {name: name, email: email, phonenumber: phonenumber, joiningdate: joiningdate, branchs: branchs,favourite:favourite, details: info})
		               db.close();
					 }
					 else{
						 db.close();
					 }
				}
		);
	}
)
}
});
});


////////////////////////////////      update     app.get             ///////////////////////////////////////

app.get("/update_user",function(req, res){
	
	urlparam =url1.parse(req.url, true);
	userid = urlparam.query.id;
	console.log(userid);
	var url="mongodb://localhost:27017/lectureDB";
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		else{
			var dbo=db.db("lectureDB");
			dbo.collection("studentDB").find({_id:ObjectId(userid)}).toArray(function(err, data){
				var name=data[0].name;
				var email=data[0].email;
				var phonenumber=data[0].phonenumber;
				var joiningdate=data[0].joiningdate;
				var branchs=data[0].branchs;
									if(data.length!=0)
					{
                       res.render("update_user", {name: name, email: email, phonenumber: phonenumber, joiningdate: joiningdate, branchs: branchs})
		db.close();
					
					   }
					else{
						res.render("update_user",'')
					}
				}
		);
	}
});
});

app.get("/update_user_v",function(req, res){
	
	urlparam =url1.parse(req.url, true);
	userid = urlparam.query.id;
	console.log(userid);
	var url="mongodb://localhost:27017/lectureDB";
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		else{
			var dbo=db.db("lectureDB");
			dbo.collection("studentVashi").find({_id:ObjectId(userid)}).toArray(function(err, data){
				var name=data[0].name;
				var email=data[0].email;
				var phonenumber=data[0].phonenumber;
				var joiningdate=data[0].joiningdate;
				var branchs=data[0].branchs;
									if(data.length!=0)
					{
                       res.render("update_user_v", {name: name, email: email, phonenumber: phonenumber, joiningdate: joiningdate, branchs: branchs})
		db.close();
					
					   }
					else{
						res.render("update_user_v",'')
					}
				}
		);
	}
});
});

app.get("/update_user_t",function(req, res){
	
	urlparam =url1.parse(req.url, true);
	userid = urlparam.query.id;
	console.log(userid);
	var url="mongodb://localhost:27017/lectureDB";
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		else{
			var dbo=db.db("lectureDB");
			dbo.collection("studentThane").find({_id:ObjectId(userid)}).toArray(function(err, data){
				var name=data[0].name;
				var email=data[0].email;
				var phonenumber=data[0].phonenumber;
				var joiningdate=data[0].joiningdate;
				var branchs=data[0].branchs;
									if(data.length!=0)
					{
                       res.render("update_user_t", {name: name, email: email, phonenumber: phonenumber, joiningdate: joiningdate, branchs: branchs})
		db.close();
					
					   }
					else{
						res.render("update_user_t",'')
					}
				}
		);
	}
});
});
app.get("/update_teacher",function(req, res){
	
	urlparam =url1.parse(req.url, true);
	userid = urlparam.query.id;
	console.log(userid);
	var url="mongodb://localhost:27017/lectureDB";
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		else{
			var dbo=db.db("lectureDB");
			dbo.collection("teacher").find({_id:ObjectId(userid)}).toArray(function(err, data){
				var name=data[0].name;
				var email=data[0].email;
				var c=data[0].c;
				var phonenumber=data[0].phonenumber;
				var branch=data[0].branch;
				dbo.collection("course").find().toArray(function(err, item){
					console.log("We are connected");				
			        if(data.length!=0)
					{
                       res.render("update_teacher", {name: name, email: email, course:item, c:c, phonenumber: phonenumber, branch: branch})
	                   db.close();
					
					   }
					else{
						res.render("update_teacher",'')
					}
				}
		);
	}

);
	}
});
});
var stu=[];
app.get("/update_lecture",function(req, res){	
	urlparam =url1.parse(req.url, true);
	userid = urlparam.query.id;
	console.log(userid);
	var url="mongodb://localhost:27017/lectureDB";
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		else{
			var dbo=db.db("lectureDB");
			dbo.collection("class").find({_id:ObjectId(userid)}).toArray(function(err, data){
				var favourite=data[0].favourite;
				var t=data[0].t;
				var c=data[0].c;
				var chapters=data[0].chapters;
				var duration=data[0].duration;
				var start=data[0].start;
				var end=data[0].end;
				console.log("Here");
				dbo.collection("studentDB").find().toArray(function(err, stu){
					if(!err){
						dbo.collection("teacher").find().toArray(function(err, result){
							if(!err){
								dbo.collection("course").find().toArray(function(err, item){
									
									if(data.length!=0)
									{
										res.render("update_lecture", {stud: stu, teach: result, course:item, favourite: favourite, t:t, c:c, chapters:chapters, duration:duration, start:start, end:end})
										db.close();
									}
									else{
										res.render("update_lecture",'')
									}
									
									
								}	)
							}		
						})
					}
					console.log("We are connected");
					
					
				}	);
			});
		}
	});
});
app.get("/update_lecture_t",function(req, res){	
	urlparam =url1.parse(req.url, true);
	userid = urlparam.query.id;
	console.log(userid);
	var url="mongodb://localhost:27017/lectureDB";
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		else{
			var dbo=db.db("lectureDB");
			dbo.collection("classThane").find({_id:ObjectId(userid)}).toArray(function(err, data){
				var favourite=data[0].favourite;
				var t=data[0].t;
				var c=data[0].c;
				var chapters=data[0].chapters;
				var duration=data[0].duration;
				var start=data[0].start;
				var end=data[0].end;
				console.log("home t 1");
				dbo.collection("studentThane").find().toArray(function(err, stu){
					if(!err){
						dbo.collection("teacher").find().toArray(function(err, result){
							if(!err){
								dbo.collection("course").find().toArray(function(err, item){
									
									if(data.length!=0)
									{
										res.render("update_lecture_t", {stud: stu, teach: result, course:item, favourite: favourite, t:t, c:c, chapters:chapters, duration:duration, start:start, end:end})
										db.close();
									}
									else{
										res.render("update_lecture_t",'')
									}
									
									
								}	)
							}		
						})
					}
					console.log("home t");
					
					
				}	);
			});
		}

	});
});
app.get("/update_lecture_v",function(req, res){	
	urlparam =url1.parse(req.url, true);
	userid = urlparam.query.id;
	console.log(userid);
	var url="mongodb://localhost:27017/lectureDB";
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		else{
			var dbo=db.db("lectureDB");
			dbo.collection("classvashi").find({_id:ObjectId(userid)}).toArray(function(err, data){
				var favourite=data[0].favourite;
				var t=data[0].t;
				var c=data[0].c;
				var chapters=data[0].chapters;
				var duration=data[0].duration;
				var start=data[0].start;
				var end=data[0].end;
				console.log("got home v");
				dbo.collection("studentVashi").find().toArray(function(err, stu){
					if(!err){
						dbo.collection("teacher").find().toArray(function(err, result){
							if(!err){
								dbo.collection("course").find().toArray(function(err, item){
									
									if(data.length!=0)
									{
										res.render("update_lecture_v", {stud: stu, teach: result, course:item, favourite: favourite, t:t, c:c, chapters:chapters, duration:duration, start:start, end:end})
										db.close();
									}
									else{
										res.render("update_lecture_v",'')
									}
									
									
								}	)
							}		
						})
					}
					console.log("got home v");
					
					
				}	);
			});
		}
	});
});

app.get("/update_user",function(req, res){
	
	urlparam =url1.parse(req.url, true);
	userid = urlparam.query.id;
	console.log(userid);
	var url="mongodb://localhost:27017/lectureDB";
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		else{
			var dbo=db.db("lectureDB");
			dbo.collection("studentDB").find({_id:ObjectId(userid)}).toArray(function(err, data){
				var name=data[0].name;
				var email=data[0].email;
				var phonenumber=data[0].phonenumber;
				var joiningdate=data[0].joiningdate;
				var branchs=data[0].branchs;
									if(data.length!=0)
					{
                       res.render("update_user", {name: name, email: email, phonenumber: phonenumber, joiningdate: joiningdate, branchs: branchs})
		db.close();
					
					   }
					else{
						res.render("update_user",'')
					}
				}
		);
	}
});
});
app.get("/update_course",function(req, res){
	
	urlparam =url1.parse(req.url, true);
	userid = urlparam.query.id;
	console.log(userid);
	var url="mongodb://localhost:27017/lectureDB";
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		else{
			var dbo=db.db("lectureDB");
			dbo.collection("course").find({_id:ObjectId(userid)}).toArray(function(err, data){
				var name=data[0].name;
				var fees=data[0].fees;
				var chapter=data[0].chapter;
				dbo.collection("course").find().toArray(function(err, item){
					console.log("We are connected");				
			        if(data.length!=0)
					{
                       res.render("update_course", {name: name,fees:fees, chapter:chapter})
	                   db.close();
					
					   }
					else{
						res.render("update_course",'')
					}
				}
		);
	}

);
	}
});
});

////////////////////////////////////////// post update ///////////////////////////////////////////////////////////////////
app.post("/update_user", function(req, res){
	var name=name;
	var email=email;
	var phonenumber=phonenumber;
	var joiningdate=joiningdate;
	var branchs=branchs;
	
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
let query={
	_id:ObjectId(userid)
}
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		var dbo=db.db("lectureDB");
		if(err) throw err;
		
        let obj={
			$set:{
				name: req.body.name,	
			    email: req.body.email,
			    phonenumber: req.body.phonenumber,
			    joiningdate: req.body.joiningdate,
			    branchs: req.body.branchs
			}
		}
		dbo.collection("studentDB").updateOne(query,obj, function(err, stu){
		console.log("done");
			if(!err){
				res.redirect("/student");				}
				else{
					if(err, name=="ValidationError"){
						handleValidationError( err, req.body)	;
						res.render("update_user", {
							viewTitle:"Update Student Details",
							student: obj
						})			
					}
					else{
						console.log("Error:" + err);
					}
				}
		});
	});
});
app.post("/update_user_v", function(req, res){
	var name=name;
	var email=email;
	var phonenumber=phonenumber;
	var joiningdate=joiningdate;
	var branchs=branchs;
	
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
let query={
	_id:ObjectId(userid)
}
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		var dbo=db.db("lectureDB");
		if(err) throw err;
		
        let obj={
			$set:{
				name: req.body.name,	
			    email: req.body.email,
			    phonenumber: req.body.phonenumber,
			    joiningdate: req.body.joiningdate,
			    branchs: req.body.branchs
			}
		}
		dbo.collection("studentVashi").updateOne(query,obj, function(err, stu){
		console.log("done");
			if(!err){
				res.redirect("/student_v");				}
				else{
					if(err, name=="ValidationError"){
						handleValidationError( err, req.body)	;
						res.render("update_user_v", {
							viewTitle:"Update Student Details",
							student: obj
						})			
					}
					else{
						console.log("Error:" + err);
					}
				}
		});
	});
});
app.post("/update_user_t", function(req, res){
	var name=name;
	var email=email;
	var phonenumber=phonenumber;
	var joiningdate=joiningdate;
	var branchs=branchs;
	
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
let query={
	_id:ObjectId(userid)
}
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		var dbo=db.db("lectureDB");
		if(err) throw err;
		
        let obj={
			$set:{
				name: req.body.name,	
			    email: req.body.email,
			    phonenumber: req.body.phonenumber,
			    joiningdate: req.body.joiningdate,
			    branchs: req.body.branchs
			}
		}
		dbo.collection("studentThane").updateOne(query,obj, function(err, stu){
		console.log("done");
			if(!err){
				res.redirect("/student_t");				}
				else{
					if(err, name=="ValidationError"){
						handleValidationError( err, req.body)	;
						res.render("update_user_t", {
							viewTitle:"Update Student Details",
							student: obj
						})			
					}
					else{
						console.log("Error:" + err);
					}
				}
		});
	});
});



app.post("/update_teacher", function(req, res){
	var name=name;
	var email=email;
	var c=c;
	var phonenumber=phonenumber;
	var branch=branch;
	
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
let query={
	_id:ObjectId(userid)
}
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		var dbo=db.db("lectureDB");
		if(err) throw err;
		
        let obj={
			$set:{
				name: req.body.name,	
			    email: req.body.email,
			    phonenumber: req.body.phonenumber,
				c:req.body.c,
			    branch: req.body.branch
			}
		}
		dbo.collection("teacher").updateOne(query,obj, function(err, stu){
		console.log("done");
			if(!err){
				res.redirect("/teacher");				}
				else{
					if(err, name=="ValidationError"){
						handleValidationError( err, req.body)	;
						res.render("update_teacher", {
							viewTitle:"Update Teacher Details",
							teacher: obj
						})			
					}
					else{
						console.log("Error:" + err);
					}
				}
		});
	});
});


app.post("/update_lecture", function(req, res){
	var favourite=favourite;
	var t=t;
	var c=c;
	var chapters=chapters;
	var duration=duration;
	var start=start;
	var end=end;
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
let query={
	_id:ObjectId(userid)
}
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		var dbo=db.db("lectureDB");
		if(err) throw err;
		
        let obj={
			$set:{
				name: req.body.name,	
				favourite: req.body.favourite,
				 t: req.body.t,
				 c: req.body.c,
			     chapters: req.body.chapters,
				 duration: req.body.duration,
				 start : req.body.start,
				 end: req.body.end,
			}
		}
		dbo.collection("class").updateOne(query,obj, function(err, stu){
		console.log("done");
			if(!err){
				res.redirect("/home");				}
				else{
					if(err, name=="ValidationError"){
						handleValidationError( err, req.body)	;
						res.render("update_lecture", {
							viewTitle:"Update Lecture Details",
							class: obj
						})			
					}
					else{
						console.log("Error:" + err);
					}
				}
		});
	});
});

app.post("/update_lecture_t", function(req, res){
	var favourite=favourite;
	var t=t;
	var c=c;
	var chapters=chapters;
	var duration=duration;
	var start=start;
	var end=end;
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
let query={
	_id:ObjectId(userid)
}
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		var dbo=db.db("lectureDB");
		if(err) throw err;
		
        let obj={
			$set:{
				name: req.body.name,	
				favourite: req.body.favourite,
				 t: req.body.t,
				 c: req.body.c,
			     chapters: req.body.chapters,
				 duration: req.body.duration,
				 start : req.body.start,
				 end: req.body.end,
			}
		}
		dbo.collection("classThane").updateOne(query,obj, function(err, stu){
		console.log("done");
			if(!err){
				res.redirect("/home_t");				}
				else{
					if(err, name=="ValidationError"){
						handleValidationError( err, req.body)	;
						res.render("update_lecture_t", {
							viewTitle:"Update Lecture Details",
							class: obj
						})			
					}
					else{
						console.log("Error:" + err);
					}
				}
		});
	});
});
app.post("/update_lecture_v", function(req, res){
	var favourite=favourite;
	var t=t;
	var c=c;
	var chapters=chapters;
	var duration=duration;
	var start=start;
	var end=end;
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
let query={
	_id:ObjectId(userid)
}
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		var dbo=db.db("lectureDB");
		if(err) throw err;
		
        let obj={
			$set:{
				name: req.body.name,	
				favourite: req.body.favourite,
				 t: req.body.t,
				 c: req.body.c,
			     chapters: req.body.chapters,
				 duration: req.body.duration,
				 start : req.body.start,
				 end: req.body.end,
			}
		}
		dbo.collection("classvashi").updateOne(query,obj, function(err, stu){
		console.log("done");
			if(!err){
				res.redirect("/home_v");				}
				else{
					if(err, name=="ValidationError"){
						handleValidationError( err, req.body)	;
						res.render("update_lecture_v", {
							viewTitle:"Update Lecture Details",
							class: obj
						})			
					}
					else{
						console.log("Error:" + err);
					}
				}
		});
	});
});
app.post("/update_course", function(req, res){
	var name=name;
    var fees=fees;
	var chapter=chapter;
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
let query={
	_id:ObjectId(userid)
}
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		var dbo=db.db("lectureDB");
		if(err) throw err;
		
        let obj={
			$set:{
				name: req.body.name,	
			    fees: req.body.fees,
				chapter: req.body.chapter
			}
		}
		dbo.collection("course").updateOne(query,obj, function(err, stu){
		console.log("done");
			if(!err){
				res.redirect("/courses_new");				}
				else{
					if(err, name=="ValidationError"){
						handleValidationError( err, req.body)	;
						res.render("update_user", {
							viewTitle:"Update Student Details",
							student: obj
						})			
					}
					else{
						console.log("Error:" + err);
					}
				}
		});
	});
});
////////////////////////////////////////////deleting users/////////////////////////////////////////
app.post("/delete",function(req, res){
	var del=req.body.del
	console.log(del);
	var url="mongodb://localhost:27017/lectureDB";
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) { 
		var dbo=db.db("lectureDB");
		
		if (err) throw err; 
		dbo.collection("studentDB").deleteOne({_id: ObjectId(del)}, function(err,obj){
			if (err) throw err;  
			console.log("success");
			res.redirect("/student");
		}
		);
		
	});
});
app.post("/delete_st",function(req, res){
	var del=req.body.del
	console.log(del);
	var url="mongodb://localhost:27017/lectureDB";
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) { 
		var dbo=db.db("lectureDB");
		
		if (err) throw err; 
		dbo.collection("studentThane").deleteOne({_id: ObjectId(del)}, function(err,obj){
			if (err) throw err;  
			console.log("success");
			res.redirect("/student_t");
		}
		);
		
	});
});
app.post("/delete_sv",function(req, res){
	var del=req.body.del
	console.log(del);
	var url="mongodb://localhost:27017/lectureDB";
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) { 
		var dbo=db.db("lectureDB");
		
		if (err) throw err; 
		dbo.collection("studentVashi").deleteOne({_id: ObjectId(del)}, function(err,obj){
			if (err) throw err;  
			console.log("success");
			res.redirect("/student_v");
		}
		);
		
	});
});
app.post("/delete_teacher",function(req, res){
	var del=req.body.del
	console.log(del);
	var url="mongodb://localhost:27017/lectureDB";
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) { 
		var dbo=db.db("lectureDB");
		
		if (err) throw err; 
		dbo.collection("teacher").deleteOne({_id: ObjectId(del)}, function(err,obj){
			if (err) throw err;  
			console.log("success");
			res.redirect("/teacher");
		}
		);
		
	});
});
app.post("/delete_course",function(req, res){
	var del=req.body.del
	console.log(del);
	var url="mongodb://localhost:27017/lectureDB";
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) { 
		var dbo=db.db("lectureDB");
		
		if (err) throw err; 
		dbo.collection("course").deleteOne({_id: ObjectId(del)}, function(err,obj){
			if (err) throw err;  
			console.log("success");
			res.redirect("/courses_new");
		}
		);
		
	});
});
app.post("/delete_lecture",function(req, res){
	var del=req.body.del
	console.log(del);
	var url="mongodb://localhost:27017/lectureDB";
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) { 
		var dbo=db.db("lectureDB");
		
		if (err) throw err; 
		dbo.collection("class").deleteOne({_id: ObjectId(del)}, function(err,obj){
			if (err) throw err;  
			console.log("success");
			res.redirect("/home");
		}
		);
	
	});
});
app.post("/delete_lecture_t",function(req, res){
	var del=req.body.del
	console.log(del);
	var url="mongodb://localhost:27017/lectureDB";
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) { 
		var dbo=db.db("lectureDB");
		
		if (err) throw err; 
		dbo.collection("classThane").deleteOne({_id: ObjectId(del)}, function(err,obj){
			if (err) throw err;  
			console.log("success");
			res.redirect("/home_t");
		}
		);
	
	});
});
app.post("/delete_lecture_v",function(req, res){
	var del=req.body.del
	console.log(del);
	var url="mongodb://localhost:27017/lectureDB";
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) { 
		var dbo=db.db("lectureDB");
		
		if (err) throw err; 
		dbo.collection("classvashi").deleteOne({_id: ObjectId(del)}, function(err,obj){
			if (err) throw err;  
			console.log("success");
			res.redirect("/home_v");
		}
		);
	
	});
});
// app.put('/update-user', function (req, res) {
// 	// updating a data by it's ID and new value
// 	var url="mongodb://localhost:27017/lectureDB";
// 	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) { 
// 		var dbo=db.db("lectureDB");
		
// 		if (err) throw err; 
// 		dbo.collection("class").findOneAndUpdate({"_id": req.body.id}, function(err,obj){
// 	  { $set: { text: req.body.text }
// 	}
// 	if (!err) {
// 			console.log(req.user.name);
// 			console.log(req.body.name);
// 			res.redirect('/profile'); 
// 		}
// 		else {
// 			console.log('Error during record update : ' + err);
// 		}
// 	 });
// 	});
// });	  

////////////////////////////////////////// ! deleting users/////////////////////////////////////////



////////////////////////////////////////////////// ADD LECTURE/////////////////////////////////////////////////////////////////////////////////////////

app.post("/add_lecture", function(req, res){
	var favourite=req.body.favourite;
	var t=req.body.t;
	var c= req.body.c;
	var chapters=req.body.chapters;
	var duration=req.body.duration;
	var start=req.body.start;
	var end=req.body.end;
	var url = "mongodb://localhost:27017/";  
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) { 
		var dbo = db.db("lectureDB"); 
		if (err) throw err;  
		dbo.collection("class").insertOne( {
			favourite: req.body.favourite,
			t: req.body.t,
			c: req.body.c,
			chapters: req.body.chapters,
			duration: req.body.duration,
			start: req.body.start,
			end: req.body.end
		},
		function(err) {
			if (err) throw err;  
			res.redirect("/home");
			res.end();
			
		});
		
	}); 
}); 




app.get("/home", function(req, res){
	favourite=favourite;
	t=t;
	c= c;
	chapters=chapters;
	duration=duration;
	start=start;
	end=end;
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
	
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		var dbo=db.db("lectureDB");
		dbo.collection("class").find().toArray(function(err, data){
			db.close();
			if(!err){
				res.render('home', {details: data});
				
			}
		});
	});
});

///////////////////////////////////////////////////////// THANE LECTURES  //////////////////////////////////////////////////////////////////


app.post("/add_lecture_t", function(req, res){
	var favourite=req.body.favourite;
	var t=req.body.t;
	var c= req.body.c;
	var chapters=req.body.chapters;
	var duration=req.body.duration;
	var start=req.body.start;
	var end=req.body.end;
	var url = "mongodb://localhost:27017/";  
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) { 
		var dbo = db.db("lectureDB"); 
		if (err) throw err;  
		dbo.collection("classThane").insertOne( {
			favourite: req.body.favourite,
			t: req.body.t,
			c: req.body.c,
			chapters: req.body.chapters,
			duration: req.body.duration,
			start: req.body.start,
			end: req.body.end
		},
		function(err) {
			if (err) throw err;  
			res.redirect("/home_t");
			res.end();
			
		});
		
	}); 
}); 

app.get("/home_t", function(req, res){
	favourite=favourite;
	t=t;
	c= c;
	chapters=chapters;
	duration=duration;
	start=start;
	end=end;
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
	
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		var dbo=db.db("lectureDB");
		dbo.collection("classThane").find().toArray(function(err, data){
			db.close();
			if(!err){
				res.render('home_t', {details: data});
				
			}
		});
	});
});

app.get("/view_c_t", function(req, res){
	favourite=favourite;
	t=t;
	c= c;
	chapters=chapters;
	duration=duration;
	start=start;
	end=end;
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
	
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		var dbo=db.db("lectureDB");
		dbo.collection("classThane").find().toArray(function(err, data){
			db.close();
			if(!err){
				res.render('view_c_t', {details: data});
				
			}
		});
	});
});
app.get("/view_c", function(req, res){
	favourite=favourite;
	t=t;
	c= c;
	chapters=chapters;
	duration=duration;
	start=start;
	end=end;
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
	
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		var dbo=db.db("lectureDB");
		dbo.collection("class").find().toArray(function(err, data){
			db.close();
			if(!err){
				res.render('view_c', {details: data});
				
			}
		});
	});
});
app.get("/add_lecture_t", function(req, res) {
	name=name;
	branchs=branchs;
	var stud=[];
	var teach=[];
	var course=[];
	var url="mongodb://localhost:27017/";
	
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		
		if(err) throw err;
		var dbo=db.db("lectureDB");
		dbo.collection("studentThane").find().toArray(function(err, data){
			
			if(!err){
				dbo.collection("teacher").find().toArray(function(err, result){
					
					if(!err){
						dbo.collection("course").find().toArray(function(err, item){
							if(!err){
								
								res.render('add_lecture_t',{stud: data,teach: result,course:item });
								console.log("We are connected");
								
								
							}	
						}
						)
						console.log("We are connected");		
					}
				})
				console.log("We are connected");
			}
		});
	});
});
////////////////////////////////////////////////////// VASHI LECTURE ///////////////////////////////////////////////////////////////////
app.post("/add_lecture_v", function(req, res){
	var favourite=req.body.favourite;
	var t=req.body.t;
	var c= req.body.c;
	var chapters=req.body.chapters;
	var duration=req.body.duration;
	var start=req.body.start;
	var end=req.body.end;
	var url = "mongodb://localhost:27017/";  
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) { 
		var dbo = db.db("lectureDB"); 
		if (err) throw err;  
		dbo.collection("classvashi").insertOne( {
			favourite: req.body.favourite,
			t: req.body.t,
			c: req.body.c,
			chapters: req.body.chapters,
			duration: req.body.duration,
			start: req.body.start,
			end: req.body.end
		},
		function(err) {
			if (err) throw err;  
			res.redirect("/home_v");
			res.end();
			
		});
		
	}); 
}); 

app.get("/home_v", function(req, res){
	favourite=favourite;
	t=t;
	c= c;
	chapters=chapters;
	duration=duration;
	start=start;
	end=end;
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
	
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		var dbo=db.db("lectureDB");
		dbo.collection("classvashi").find().toArray(function(err, data){
			db.close();
			if(!err){
				res.render('home_v', {details: data});
				
			}
		});
	});
});
app.get("/view_c_v", function(req, res){
	favourite=favourite;
	t=t;
	c= c;
	chapters=chapters;
	duration=duration;
	start=start;
	end=end;
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
	
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		var dbo=db.db("lectureDB");
		dbo.collection("classvashi").find().toArray(function(err, data){
			db.close();
			if(!err){
				res.render('view_c_v', {details: data});
				
			}
		});
	});
});

app.get("/add_lecture_v", function(req, res) {
	name=name;
	branchs=branchs;
	var stud=[];
	var teach=[];
	var course=[];
	var url="mongodb://localhost:27017/";
	
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		
		if(err) throw err;
		var dbo=db.db("lectureDB");
		dbo.collection("studentVashi").find().toArray(function(err, data){
			
			if(!err){
				dbo.collection("teacher").find().toArray(function(err, result){
					
					if(!err){
						dbo.collection("course").find().toArray(function(err, item){
							if(!err){
								
								res.render('add_lecture_v',{stud: data,teach: result,course:item });
								console.log("We are connected");
								
								
							}	
						}
						)
						console.log("We are connected");		
					}
				})
				console.log("We are connected");
			}
		});
	});
});
///////////////////////////////////////////////////////////  USING DROPDOWNS IN LECTURE     //////////////////////////////////////////////
var stud=[];
var teach=[];
var course=[];
app.get("/add_lecture", function(req, res) {
	name=name;
	branchs=branchs;
	var stud=[];
	var teach=[];
	var course=[];
	var url="mongodb://localhost:27017/";
	
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		
		if(err) throw err;
		var dbo=db.db("lectureDB");
		dbo.collection("studentDB").find().toArray(function(err, data){
			
			if(!err){
				dbo.collection("teacher").find().toArray(function(err, result){
					
					if(!err){
						dbo.collection("course").find().toArray(function(err, item){
							if(!err){
								
								res.render('add_lecture',{stud: data,teach: result,course:item });
								console.log("We are connected");
								
								
							}	
						}
						)
						console.log("We are connected");		
					}
				})
				console.log("We are connected");
			}
		});
	});
});
///////////////////////////////////////////////////////////  !USING DROPDOWNS IN LECTURE     //////////////////////////////////////////////


app.get("/add_teacher", function(req, res) {
	name=name;
	branchs=branchs;
	var url="mongodb://localhost:27017/";
	
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		var dbo=db.db("lectureDB");
		dbo.collection("course").find().toArray(function(err, item){
			if(!err){
				res.render('add_teacher',{course:item });
				console.log("We are connected");		
			}		
		});
	});
	
});

//////////////////// ! ADD LECTURE/////////////////////////////////////////////////////////////////////////////////////////

app.get("/courses_new", function(req, res){
	name=name;
	fees=fees;
	chapter=chapter;
	
	
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
	
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		var dbo=db.db("lectureDB");
		dbo.collection("course").find().toArray(function(err, data){
			db.close();
			if(!err){
				res.render('courses_new', {details: data});
			}
		});
	});
},
);

// app.get("/student", function(req, res){
// 	res.render("student");
// });

/////////////////////////////////////////////////ADD COURSE//////////////////////////////////////////////////////////////////////////////





/////////////////////////////////////////////ADD TEACHER//////////////////////////////////////////////////////////////

app.post("/add_teacher", function(req, res){
	var name=req.body.name;
	var email=req.body.email;
	var phonenumber= req.body.phonenumber;
	var c=req.body.c;
	var branch=req.body.branch;
	var url = "mongodb://localhost:27017/lectureDB";  
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) { 
		var dbo = db.db("lectureDB"); 
		if (err) throw err;  
		dbo.collection("teacher").insertOne( {
			name: req.body.name,
			email: req.body.email,
			phonenumber: req.body.phonenumber,
			c: req.body.c,
			branch: req.body.branch	
		},
		function(err) {
			if (err) throw err;  
			res.redirect("/teacher");
			res.end();
			
		});
		
	}); 
});

app.get("/teacher", function(req, res){
	name=name;
	email=email;
	phonenumber=phonenumber;
	c=c;
	branch=branch;
	
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
	
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		var dbo=db.db("lectureDB");
		dbo.collection("teacher").find().toArray(function(err, data){
			db.close();
			if(!err){
				res.render('teacher', {details: data});
			}
			
			
		});
	});
},
);
app.get("/view_teacher", function(req, res){
	name=name;
	email=email;
	phonenumber=phonenumber;
	c=c;
	branch=branch;
	
	
	//else get the cookie information and fetch data from databased
	var url="mongodb://localhost:27017/lectureDB";
	
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		if(err) throw err;
		var dbo=db.db("lectureDB");
		dbo.collection("teacher").find().toArray(function(err, data){
			db.close();
			if(!err){
				res.render('view_teacher', {details: data});
			}
			
			
		});
	});
},
);





///////////////////////////////////student render////////////////////////////////////
app.get("/home", function(req, res){
	res.render("home");
});
app.get("/home_t", function(req, res){
	res.render("home_t");
});

app.get("/home_v", function(req, res){
	res.render("home_v");
});
app.get("/student_v", function(req, res){
	res.render("student_v");
});


app.get("/add-user", function(req, res){
	res.render("add_user");
});
app.get("/add_user_v", function(req, res){
	res.render("add_user_v");
});
app.get("/add_user_t", function(req, res){
	res.render("add_user_t");
});
// app.get("/update-user", function(req, res){
// 	res.render("update_user");
// });

app.get("/teacher", function(req, res){
	res.render("teacher");
});
app.get("/courses_new", function(req, res){
	res.render("courses_new");
});
app.get("/add_lecture", function(req, res){
	res.render("add_lecture");
});
app.get("/add_lecture_t", function(req, res){
	res.render("add_lecture_t");
});
app.get("/add_teacher", function(req, res){
	res.render("add_teacher");
});
app.get("/add_courses", function(req, res){
	res.render("add_courses");
});
////////////////////////   STUDENT RENDER//////////////////////////////////////







/////////////////otp///////////////////////////////////////////////////////


app.get("/forgot", function(req, res){
	res.render("forgot");
});
app.post("/forgot", function(req, res){
	res.render("forgot");
});

// app.get("/verified", function(req, res){
// 	var data = req.body.data;
// 	console.log(data);
	
// });




// var otp = Math.random();
// otp = otp * 1000000;
// otp = parseInt(otp);
// console.log(otp);

// var pass = Math.random();
// pass = pass* 1000000;
// pass = parseInt(pass);
// console.log(pass);


// let transporter = nodemailer.createTransport({
// 	host: "smtp@gmail.com",
// 	port: 465,
// 	secure: true,
// 	service : 'Gmail',
	
// 	auth: {
// 		user: 'svartika841@gmail.com',
// 		pass: 'vartikasingh1124',
// 	}
	
// });

app.post('/send',function(req,res){
	 var email=req.body.email;
	 console.log(email);

	var mailOptions={
		to: req.body.email,
		subject: "Otp for registration is: ",
		html: "<h3>OTP for account verification is </h3>"  + "<h1 style='font-weight:bold;'>" + otp +"</h1>" // html body
	};
	
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			return console.log(error);
		}
		console.log('Message sent: %s', info.messageId);
		console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
		
		res.render('otp');
	});
});


app.post('/pass_send',function(req,res){
	
   var email=req.body.email;
				var mailOptions={
					to: req.body.email,
					subject: "New Password is: ",
					html: "<h3>Your OTP is </h3>"  + "<h1 style='font-weight:bold;'>" + pass +"</h1>" // html body
				};
				
				transporter.sendMail(mailOptions, (error, info) => {
					if (error) {
						return console.log(error);
					}
					console.log('Message sent: %s', info.messageId);
					console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
					res.render('pass', {email:email});
					console.log(email);
				});
				
			}
);
		


app.post('/verify',function(req,res){
    if(req.body.otp==otp){
		res.render("done");	
	}
	else{
		res.render('otp',{msg : 'otp is incorrect'});
	}
});

app.get('/pass',function(req,res){
	var email = req.body.email;
	console.log(email);

});

app.post('/verify_pass',function(req,res){
	var email = req.body.email;
	console.log(email);
	console.log("email");
	if(req.body.pass==pass)
	{
		 res.render('done_pass', {email:email});
		 console.log(email);
	}
	else{
		res.render('pass',{msg : 'Password is incorrect'});
	}
});

app.post("/done_pass", function(req, res){

	var email= req.body.email;

	console.log(email);
	console.log("ok");
	//else get the cookie information and fetch data from databased
var url="mongodb://localhost:27017/";
let query={
	email: email
}
	MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db){
		var dbo=db.db("revision");
		if(err) throw err;
		
        let obj={
			$set:{
				password: req.body.password
			}
		}
		dbo.collection("users").updateOne(query,obj, function(err, stu){
		console.log("done");
			if(!err){
				res.redirect("/login");				}
				else{
					if(err, name=="ValidationError"){
						handleValidationError( err, req.body)	;
						res.render("done_pass", {
							viewTitle:"Update Student Details",
							student: obj
						})			
					}
					else{
						console.log("Error:" + err);
					}
				}
		});
	});
});

app.post('/resend',function(req,res){
	var mailOptions={
		to: email,
		subject: "Otp for registration is: ",
		html: "<h3>OTP for account verification is </h3>"  + "<h1 style='font-weight:bold;'>" + otp +"</h1>" // html body
	};
	
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			return console.log(error);
		}
		console.log('Message sent: %s', info.messageId);
		console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
		res.render('otp',{msg:"otp has been sent"});
	});	
});

app.get("/done", function(req,res){
	app.render("done");
});
app.post("/done", function(req,res){
	app.render("done");
});

server.listen(3000);

