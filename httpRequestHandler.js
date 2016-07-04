var request = require('request');
var AWS = require('aws-sdk');
var DynamoDB = new AWS.DynamoDB.DocumentClient();
var _ = require('lodash');

var isEmpty = function(str) {
	return str === '';
}

exports.issueRequestHandler = function(event, context, callback) {

	console.log('remaining time =', context.getRemainingTimeInMillis());
    console.log('functionName =', context.functionName);
    console.log('AWSrequestID =', context.awsRequestId);
    console.log('logGroupName =', context.logGroupName);
    console.log('logStreamName =', context.logStreamName);
    console.log('clientContext =', context.clientContext);

    // stoppoint arrivals for StopPointId = 940GZZLUASL
    var endpoint = 'https://api.tfl.gov.uk/StopPoint/940GZZLUASL/Arrivals?app_id=51696fcf&app_key=d1105f80ed4ceaf95b9f230d88e2770f';

    request(endpoint, function(error, response, body) {
		if(!error && response.statusCode == 200) {
			var json = JSON.parse(body);
			var numEntries = json.length;
			console.log("Received " + numEntries + " items.");
			// iterate items
			for(var i in json) {
				json[i].stopPointId = '940GZZLUASL'; // decorate item w/ StopPointId
				var item = _.omitBy(json[i], isEmpty); // omit empty strings since Dynamo does not like them
				console.log(item);
				var params = {
				    TableName: "StopPointArrivals",
				    Item: item
				};
				DynamoDB.put(params, function (err, data) {
				    if (err) {
				        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
				    } else {
				        console.log("Added item:", JSON.stringify(data, null, 2));
				    }
				});
			}
			callback(null, numEntries); // return response
		}
		else {
			console.error("Received an error or a non 200 response.");
			callback("Received an error or a non 200 response.");
		}
	});

	// TODO externalize requests and require them
	// TODO How to capture metadata such as request date, time, type
	// TODO Documentation
};