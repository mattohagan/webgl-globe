//<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>

//var xhr = new XMLHttpRequest();
var location = '/svc/news/v3/content/nyc/arts/?api-key=ca20d566e5f27fd0edaedea5545aae3b:7:69265292'
var loc = 'api.nytimes.com';

var http = require("http");
var reqData;

var options = {
	host: loc,
	port: 80,
	path: location,
	method: 'GET'
};


var req = http.request(options, function(res)
{
	console.log('STATUS: ' + res.statusCode);
	console.log('HEADERS: ' + JSON.stringify(res.headers));
	res.setEncoding('utf8');

	res.on('data', function(chunk)
	{
		req.write(chunk);
		console.log('CHUNK: ' + chunk);
		reqData = chunk;
	});

	res.on('end', function(res)
	{
		console.log('Response End');
	});
});

req.on('error', function(e)
{
	console.log('ERROR: ' + e.message);
});

console.log('End Of Request');
req.end();

/*
$.ajax({
	type: 'POST',
	url: 'nyt.json',
	data: reqData,
	success: console.log('data: ' + data),
	contentType: "application/json",
	dataType: 'json'
});


/*xhr.open('GET', location, true);
xhr.onreadystatechange = function(e){
	console.log(xhr.readyState + ' ' + xhr.status);
	var data = JSON.parse(xhr.responseText);

	console.log(data);

	var anotherXHR = new XMLHttpRequest();
	xhr.open('POST', 'nyt.json', true);
}
*/
