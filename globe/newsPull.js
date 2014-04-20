var hours = 5;

var nytKey = 'ca20d566e5f27fd0edaedea5545aae3b:7:69265292';
var location = 'http://api.nytimes.com/svc/news/v3/content/all/all/' + hours + '.json?api-key=' + nytKey;
var coordinates = [];
var fs = require('fs');
var request = require('request');
var async = require('async');

// hit new york times api and write to nyt.json
request(location, function(error, response, body){
	if(!error && response.statusCode === 200){
		//console.log(body);
	}
	var data = JSON.parse(body);

	var res = data.results;
	for(var i=0;i<res.length;i++)
		console.log(res[i].section + '    ' + res[i].subsection);

	var stories = res.filter(function (item) { return item.geo_facet != undefined; })

	// hit google geocoding api and write coordinates to dots.json
	async.each(res, function(item, callback){
		var geoKey = 'AIzaSyD5qBMZ-aJ88qFqyNnrfJ9Q2sARWtbf4gE'; 
		address = item.geo_facet[0];
		var loc = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + address + '&sensor=false&key=' + geoKey;
		request(loc, function(error, response, body){
			if(!error && response.statusCode == 200){
				//console.log(body);
				var newBody = JSON.parse(body);
			}
			for(var i=0; i<newBody.results.length;i++){
				if(newBody.status === 'ZERO_RESULTS')
					console.log('do nothing');
				else {
					var lat = newBody.results[0].geometry.location.lat;
					var lng = newBody.results[0].geometry.location.lng * -1;
					coordinates.push(lat + ',' + lng + ',');
				}
			}
			callback();
		});
				 
	   // write to both the nyt and dots json files
	}, function(err){
		fs.writeFile('nyt.json', JSON.stringify(data), function(err){
			if(err)
				console.log(err);
			else
				console.log("\nFile was saved");
		});
		var dotString = '[["1990",[';
		for(var i=0;i<coordinates.length;i++)
			dotString += coordinates[i] + '0.005,';
		
		newString = dotString.substring(0, dotString.length-1);
		newString += ']]]';
		fs.writeFile('dots.json', newString, function(err){
			if(err)
				console.log(err);
			else
				console.log("\nFile was saved");
		});
	});
});


//[["1990",[6,159,0.005,30,99,0.005,45,-109,0.005,42,-83,0.005,25,-80,0.005]]]

