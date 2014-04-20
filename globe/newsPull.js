
var nytKey = 'ca20d566e5f27fd0edaedea5545aae3b:7:69265292'
var location = 'http://api.nytimes.com/svc/news/v3/content/nyc/arts/?api-key=' + nytKey;

// hit new york times api and write to nyt.json
var fs = require('fs');
var request = require('request');
request(location, function(error, response, body){
	if(!error && response.statusCode == 200){
		console.log(body);
	}
	var data = JSON.parse(body);
	fs.writeFile('nyt.json', JSON.stringify(data), function(err){
		if(err)
			console.log(err);
		else
			console.log("\nFile was saved");
	});
});

// hit google geocoding api and write coordinates to dots.json



// [["1990",[6,159,0.005,30,99,0.005,45,-109,0.005,42,-83,0.005,25,-80,0.005]]]