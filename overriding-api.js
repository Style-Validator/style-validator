var http = require('http');
var fs = require('fs');
var url = require('url');
var port = 8001;
var server = http.createServer();

server.on('request', request);
server.listen(port, function() {
	console.log("server initialized");
});

function request(request, response){

	var path = url.parse(request.url).pathname;

	if(request.method === 'POST') {

		if(path === '/saveJSON') {

			var store = '';

			request.on('data', function(data) {
				store += data;
			});

			request.on('end', function() {
				response.setHeader("Content-Type", "application/json");
				response.setHeader("Access-Control-Allow-Origin", "*");
				fs.writeFile("./extension/data/rules.json", store);
				response.end(store);
			});
		}

	} else {
		response.end();
	}

}
