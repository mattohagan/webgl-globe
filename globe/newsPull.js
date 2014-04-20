
var hours = 2;

var nytKey = 'ca20d566e5f27fd0edaedea5545aae3b:7:69265292';
var location = 'http://api.nytimes.com/svc/news/v3/content/all/arts/' + hours + '.json?api-key=' + nytKey;
var coordinates = [];
var addressi = [];
var fs = require('fs');
var request = require('request');
var async = require('async');
//var jQuery = require('jQuery');
var locc = 'solid.json';
// hit new york times api and write to nyt.json
request(locc, function(error, response, body){
	if(!error && response.statusCode === 200){
		//console.log(body);
	}
	var data = JSON.parse(body);
	var newnewString = ' ';
	var res = data.results;
	for(var i=0;i<res.length;i++)
		newnewString += res[i].title + ' -- ' + res[i].geo_facet + ' -- ' + res[i].url;

	fs.writeFile('ryan.txt', newnewString, function(err){
			if(err)
				console.log(err);
			else
				console.log("\nFile was saved");
		});

	/*length = res.length;
	for(var i=0;i<length;i++)
	{
		if(jQuery.isEmptyObject(res[i].geo_facet)){
			delete res[i];
			i--;
			length--;
		}
	}*/

	//var stories = res.filter(function (item) { return jQuery.isEmptyObject(item.geo_facet); })
	var stories = res.filter(function (item) { return item.geo_facet != undefined; })
	fs.writeFile('stories.json', JSON.stringify(stories), function(err){
			if(err)
				console.log(err);
			else
				console.log("\nFile was saved");
		});

	// hit google geocoding api and write coordinates to dots.json
	async.each(stories, function(item, callback){
		var geoKey = 'AIzaSyD5qBMZ-aJ88qFqyNnrfJ9Q2sARWtbf4gE'; 
		address = item.geo_facet[0];
		//addressi.push(address);
		//console.log(address);
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
					var amt = 5;
					//if(newBody.results.length > 2)
						//amt = 3;

					var lat = newBody.results[amt].geometry.location.lat;
					var lng = newBody.results[amt].geometry.location.lng;
					coordinates.push([lat, lng]);
					console.log(addressi[i] + ' -- ' + coordinates[i][0]);
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
		//var dotString = '[["1990",[';
		//for(var i=0;i<coordinates.length;i++)
			//dotString += coordinates[i] + '0.005,';
		
		//newString = dotString.substring(0, dotString.length-1);
		//newString += ']]]';
		fs.writeFile('dots.json', JSON.stringify(coordinates), function(err){
			if(err)
				console.log(err);
			else
				console.log("\nFile was saved");
		});
	});
});


//[["1990",[6,159,0.005,30,99,0.005,45,-109,0.005,42,-83,0.005,25,-80,0.005]]]

