var http = require('http');
var fs = require('fs');
var assert = require('assert');
var url = require('url');
var port = 8001;
var server = http.createServer();
var MongoClient = require('mongodb').MongoClient;
var dbname = 'validation_log';
var dburl = 'mongodb://localhost:27017/' + dbname;

server.on('request', request);
server.listen(port, function() {
	console.log("Server initialized, waiting for request...");
});

function request(request, response){

	var path = url.parse(request.url).pathname;

	if(request.method === 'POST') {

		var store = '';

		request.on('data', function(data) {
			store += data;
		});


		request.on('end', function() {
			response.setHeader("Content-Type", "application/json");
			response.setHeader("Access-Control-Allow-Origin", "*");

			if(path === '/saveJSON') {
				fs.writeFile("./extension/data/rules.json", store);
				console.log('JSON file written successfully!');
			}

			if(path === '/send2db') {

				MongoClient.connect(dburl, function (err, db) {
					assert.equal(null, err, 'Unable to connect to the mongoDB server. Error');
					console.log("Connected correctly to MongoDB");

					var testData = db.collection('testData');
					var parsedStore = JSON.parse(store);
					testData.insert(parsedStore, {}, function(err, testData) {
						console.log('Inserted data completely to Database');
						db.close();
					});
				});

			}
			response.end(store);
		});

	} else {

		response.end();
	}


}

