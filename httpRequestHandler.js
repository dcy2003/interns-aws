// Require Third Party Libraries
var request = require('request');
var AWS = require('aws-sdk');
var DynamoDB = new AWS.DynamoDB.DocumentClient();
var _ = require('lodash');
var uuid = require('node-uuid');

exports.issueRequestHandler = function(event, context, callback) {

    // stoppoint arrivals for StopPointId = 940GZZLUASL
    var endpoint = 'https://api.tfl.gov.uk/StopPoint/940GZZLUASL/Arrivals?app_id=51696fcf&app_key=d1105f80ed4ceaf95b9f230d88e2770f';

    request(endpoint, function(error, response, body) {

		if(!error && response.statusCode == 200) {

			var responseTime = new Date();
			var json = JSON.parse(body);
			var numEntries = json.length;
			console.log("Received " + numEntries + " items.");

			// iterate items
			for(var i in json) {

				json[i].uuid = uuid.v4(); 						// decorate item with UUID
				json[i].stopPointId = '940GZZLUASL'; 			// decorate item with StopPointId
				json[i].responseTime = responseTime;			// decorate item with time of response
				json[i].awsRequestId = context.awsRequestId;	// decorate item with Lambda request ID
				
				// Dynnamo does not like empty strings, omit them
				var item = _.omitBy(json[i], function(str) { return str === ''; });

				//console.log(item);

				// Build DynamoDB entry
				var params = {
				    TableName: "StopPointArrivals",
				    Item: item
				};

				// Insert into DynamoDB
				DynamoDB.put(params, function (err, data) {
				    if (err) console.error("Unable to add item.");
				    else console.log("Added item");
				});
			}

			// return response
			callback(null, numEntries);
		}
		else {
			console.error("Received an error or a non 200 response.");
			callback("Received an error or a non 200 response.");
		}
	});
};