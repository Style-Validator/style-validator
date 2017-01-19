var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
	host: 'smtp.gmail.com',
	port: 465,
	secure: true, // use SSL
	auth: {
		user: 'igari.takeharu@gmail.com',
		pass: 'ryamxambmmnxekbf'
	}
});

// setup e-mail data with unicode symbols
var mailOptions = {
	from: 'igari.takeharu@gmail.com', // sender address
	to: 'alert.igari.takeharu@gmail.com', // list of receivers
	subject: 'Caught exception: ', // Subject line
	text: 'https://dashboard.heroku.com/apps/style-validator/logs'
};

// send mail with defined transport object
transporter.sendMail(mailOptions, function(error, info){
	if(error){
		return console.log(error);
	}
	console.log('Message sent: ' + info.response);
});