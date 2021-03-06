// load up the user model
var mysql = require('mysql');
const { rand } = require('../config/passport'); //terakhir di edit kemungkinan ini yang undefined di console
var dbconfig = require('../config/database');
const { session } = require('passport');
const nodemailer = require("nodemailer");

var connection = mysql.createConnection(dbconfig.connection);
connection.query('USE ' + dbconfig.database);
// import('../config/passport'); mengimport dari passport. respon: module not found

// app/routes.js
module.exports = function(app, passport) {

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', function(req, res) {
		res.render('index.ejs'); // load the index.ejs file
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function(req, res) {
		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/dashboard', // redirect to the secure dashboard section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true, // allow flash messages
		}),
        function(req, res) {
            console.log("hello");
			//kondisional jika isverifed = 0 maka tidak di ijinkan login
			// if ()

            if (req.body.remember) {
              req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
              req.session.cookie.expires = false;
            }
        res.redirect('/');
    });

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup', function(req, res) {
		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage')});
	});

	app.get('/entermail', function(req, res, next) { //referer from login page
		// bagaimana cara agar url hanya dirender ketika hanya menerima rujukan dari url yang ditentukan? referer jawabannya
		// protected area using referer. reference: https://stackoverflow.com/questions/26293380/prevent-direct-access-to-html-page-in-node-js
		let referrer = req.get('referrer'); // get url referrer
		let host = req.get('host'); // get link host
		console.log(host);
		console.log(referrer); // show url referrer except direct will show undefined
		if (referrer !== 'http://'+host+'/login'){ //host setup
			return res.status(404).end('Page Protected');
		} else {
			res.render('entermail.ejs', { message: req.flash('entermailMsg')});
		}
	})

	app.get('/verification', function(req, res, next) { //referef from entermail page
		async function mailer(){

			// let host = "localhost:3000";

			// create reusable transporter object using the default SMTP transport
			let transporter = nodemailer.createTransport({
			host: "smtp.gmail.com",
			port: 465,
			secure: true, // true for 465, false for other ports
			auth: {
				user: 'mynotesverify@gmail.com',// email
				pass: PasswordHere,// password
				expires: 2000,
			},
			});
		
			// send mail with defined transport object
			let info = await transporter.sendMail({
				from: '"MyNotes Email Verification" <mynotesverify@mynotes.com>', // sender address
				to: req.query.username, // list of receivers // no receipent defined
				subject: "Verify Your Email", // Subject line
				// text: "Test text", // plain text body
				html: "<p>Hi "+req.query.username+", dont share this code to another human, include <b>MyNotes</b> team!</p></br>Your Code Is:"+rand, // html body
				});
		
			console.log("Message sent: %s", info.messageId);
			// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

			// khusus link verifikasi
			// if ((req.protocol + "://" + req.get('host')) == ("http://"+ host)){
			//     if(req.query.id == rand){
			//         connection.query("UPDATE users SET isVerified=? WHERE email=?",[1, newUserMysql.username]);
			//     }
			// }
			}
			let referrer = req.get('referrer'); // get url referrer
			let host = req.get('host'); // get link host
			console.log(referrer); // show url referrer except direct will show undefined
			if (referrer !== 'http://'+host+'/entermail'){ //host setup
				return res.status(404).end('Page Protected');
			} else {
			mailer().rand; //memanggil function mailer
			res.render('verification.ejs', { message: req.flash('verifyMessage') });
			}
	});

	app.post('/verification', (req, res) => {
		// console.log(rand);
		if (req.body.otp == rand){
			connection.query('UPDATE users SET isVerified=? WHERE email=?',[1, req.user.email]);
			res.redirect('/dashboard');
		} else {
			req.flash('verifyMessage', 'Oops! Wrong otp.'); //jika email tidak diverifikasi dalam 2 hari maka di hapus
			res.redirect('/verification');
		}
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/verification', // redirect to the secure page dashboard section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// Dashboard SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	// app.get('/dashboard', isLoggedIn, function(req, res) {
		// res.render('dashboard.ejs', {
			// user : req.user // get the user out of session and pass to template ( display database id, user and pw )
		// });
	// });

	//  DISPLAYING NOTES ON DASHBOARD
	app.get('/dashboard', isLoggedIn, (req, res) => { //TypeError: argument callback must be a function when provided
	//   ERROR 1052 (23000): Column 'email' in where clause is ambiguous?
		const kuery = 'SELECT * FROM notes WHERE email=?';
		connection.query(kuery, [req.user.email], //mengambil dari row data packekt //cannt read properly 'foreach' of undefined adalah masalahnya di definisi variabel di server tidak terdefinisi
			(error, results) => {
			console.log(req.user);
			res.render('dashboard.ejs', {notes : results, user : req.user, message : req.flash('message')}); //mendefinisikan user
		  }
		);
	  });
	  
	  // =====================================
	  // LOGOUT ==============================
	  // =====================================
	  app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
	// save notes
	app.post('/save', isLoggedIn, (req, res, next) => {
		const simpan = "INSERT INTO notes ( id, title, note, email ) values ('',?,?,?)";
		connection.query(simpan,[req.body.title, req.body.teks, req.user.email]);
			// menampilkan kotak dialog
			req.flash('message', 'Sukses, Your notes has been saved!'); // req.flash is the way to set flashdata using connect-flash);
			res.redirect('/dashboard'); //dashboard
		});

		//   mengedit data
		  app.get('/edit/:id', isLoggedIn, (req, res) => {
			  connection.query('SELECT * FROM notes WHERE id=?', [req.params.id], (error, results) => {
			  res.render('edit.ejs', {notes : results[0]});
			})
		  })
		  
		// mengupdate data
		app.post('/update/:id', isLoggedIn, (req, res) => {
			connection.query('UPDATE notes SET title=?, note=? WHERE id=?',[req.body.title, req.body.note, req.params.id], (error, results) => {
				res.redirect('/dashboard');
			})
		})

	app.post('/delete/:id', isLoggedIn, (req, res) => {
		// lakukan konfirmasi dengan confirm()
		// jika tombol delete di tekan akan memunculkan dialog konfirmasi dan jika ok maka akan dihapus jika tidak didismiss
		connection.query(
			'DELETE FROM notes WHERE id = ?',
			[req.params.id],
			(error, results) => {
			  res.redirect('/dashboard');
			}
		  );
	  });
};

// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}
