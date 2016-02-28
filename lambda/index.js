/**
 Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

 http://aws.amazon.com/apache2.0/

 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * This sample shows how to create a simple Trivia skill with a multiple choice format. The skill
 * supports 1 player at a time, and does not support games across sessions.
 */

'use strict';

var twilioClient = require('twilio')('AC93e25518137a55a34c4a60e5bc45956c', '8d7a68142f322eb0bae9df4034c71e4e');
var Firebase = require("firebase");


// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
	try {
		console.log("event.session.application.applicationId=" + event.session.application.applicationId);

		/**
		 * Uncomment this if statement and populate with your skill's application ID to
		 * prevent someone else from configuring a skill that sends requests to this function.
		 */
		 
//     if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.05aecccb3-1461-48fb-a008-822ddrt6b516") {
//         context.fail("Invalid Application ID");
//      }

		if (event.session.new) {
			onSessionStarted({requestId: event.request.requestId}, event.session);
		}

		if (event.request.type === "LaunchRequest") {
			onLaunch(event.request,
				event.session,
				function callback(sessionAttributes, speechletResponse) {
					context.succeed(buildResponse(sessionAttributes, speechletResponse));
				});
		} else if (event.request.type === "IntentRequest") {
			onIntent(event.request,
				event.session,
				function callback(sessionAttributes, speechletResponse) {
					context.succeed(buildResponse(sessionAttributes, speechletResponse));
				});
		} else if (event.request.type === "SessionEndedRequest") {
			onSessionEnded(event.request, event.session);
			context.succeed();
		}
	} catch (e) {
		context.fail("Exception: " + e);
	}
};
var firebaseTOP;
/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
	console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
		+ ", sessionId=" + session.sessionId);

	// firebaseTOP = new Firebase("https://lifeline-app.firebaseio.com/Profile/");
	firebaseTOP = new Firebase("https://lifeline-app.firebaseio.com/678b1f8b-2a27-4b5c-9dfe-b59cbcee74ad/");

	// add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
	console.log("onLaunch requestId=" + launchRequest.requestId
		+ ", sessionId=" + session.sessionId);

	getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
	console.log("onIntent requestId=" + intentRequest.requestId
		+ ", sessionId=" + session.sessionId);

	var intent = intentRequest.intent,
		intentName = intentRequest.intent.name;
	console.log("\tintentName: " + intentName);

		if((intentName === "HelpIntent"))
			console.log("help intent");

	// dispatch custom intents to handlers here
	if ("VerifyInfoIntent" === intentName) {
		handleVerifyRequest(intent, session, callback);
	} else if ("HelpIntent" === intentName) {
		handleHelpRequest(intent, session, callback);
	} else if ("AMAZON.StartOverIntent" === intentName) {
		getWelcomeResponse(callback);
	} else if ("AMAZON.RepeatIntent" === intentName) {
		handleRepeatRequest(intent, session, callback);
	} else if ("AMAZON.HelpIntent" === intentName) {
		handleGetHelpRequest(intent, session, callback);
	} else if ("AMAZON.StopIntent" === intentName) {
		handleFinishSessionRequest(intent, session, callback);
	} else if ("AMAZON.CancelIntent" === intentName) {
		handleFinishSessionRequest(intent, session, callback);
	} else{
		throw "Invalid intent";
	}
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
	console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
		+ ", sessionId=" + session.sessionId);

	// Add any cleanup logic here
}

// ------- Skill specific business logic -------

var ANSWER_COUNT = 4,
	GAME_LENGTH = 5;

function getWelcomeResponse(callback) {
	console.log("get getWelcomeResponse");
	var cardTitle = "";
	var repromptText = "";
	var shouldEndSession = false;
	//what is this last line??
	var sessionAttributes = {};
	// var speechOutput = "Siddhant";
	// for(var i = 0; i < 15; i++)
	// {
	// 	speechOutput += "<break time=\"2s\"/>";
	// 	// if(i === 13)
	// 		// speechOutput += "GOTCHAAA!!!!!!";
	// 	// else
	// 		speechOutput += "siddhant";
	// }
	callback(sessionAttributes,
		buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleVerifyRequest(intent, session, callback) {
	console.log("verify ---------");
	var speechOutput = "In case of an emergency, Lifeline will call ";
	var sessionAttributes = {};
	var cardTitle = "";
	var repromptText = "";

	var myFirebaseRef = firebaseTOP.child("contacts");

	myFirebaseRef.once("value", function(snapshot) {
		console.log(snapshot.val());
		var numVals = Object.keys(snapshot.val()).length;
		var numCompleted = 0;
		console.log(Object.keys(snapshot.val()).length);
		snapshot.forEach(function(childSnapshot) {
			var childData = childSnapshot.val();

			if(numCompleted+1 === numVals)
			{
				speechOutput += "and " + childData.name + ", with phone number <say-as interpret-as=\"telephone\">" 
					+ childData.number + "</say-as>.";
			}
			else
			{
				speechOutput += childData.name + ", with phone number <say-as interpret-as=\"telephone\">" 
					+ childData.number + "</say-as>, ";
			}
			numCompleted++;
		});

		console.log("end verify ---------");
		callback(sessionAttributes,
			buildSpeechletResponse(cardTitle, speechOutput, repromptText, true));
	});

}
var numDone = 0, total = 5;
function handleHelpRequest(intent, session, callback) {

	var person = intent.slots.Person;
	var sessionAttributes = {};
	var cardTitle = "";
	var repromptText = "";


	var speechOutput = "We have notified ";

	var myFirebaseRef = firebaseTOP.child("contacts");

	var emgContacts = [];

	myFirebaseRef.once("value", function(snapshot) {
		// console.log("snapshot val: " + snapshot.val());
		snapshot.forEach(function(childSnapshot) {
			var childData = childSnapshot.val();
			emgContacts.push(childSnapshot.val());
			// console.log("childData: " + childData);
		});
		total = emgContacts.length;
		var isThereAPerson = false;
		console.log("person: " + JSON.stringify(person));
		console.log("isThereAPerson: " + isThereAPerson);
		console.log("value: " + person.value + "---" +("value" in person));

		if(("value" in person))
		{
			console.log(person.value.toLowerCase());
			for(var i = 0; i < emgContacts.length; i++)
			{
				console.log(emgContacts[i].name.toLowerCase());
				if(emgContacts[i].name.toLowerCase() === person.value.toLowerCase())
				{

					isThereAPerson = true;
					speechOutput += " " + person.value + " for you."
					var phoneNum = '+' + emgContacts[i].number.toString();
					var body = "Hello " + emgContacts[i].name + "! This is Lifeline, and we have just been notified that"
					+ " Sid needs your help. Please Help him.";

					twilioClient.sendMessage({

						to:phoneNum, // Any number Twilio can deliver to
						from:"+15104557927",
						body: body // body of the SMS message
					}, 
						function(err, responseData) { //this function is executed when a response is received from Twilio
							console.log("done " + i);


						callback(sessionAttributes,
							buildSpeechletResponse(cardTitle, speechOutput, repromptText, true));
					});

					i = emgContacts.length;



				}
			}
		}
		if(!isThereAPerson)
		{
			for(var i = 0; i < emgContacts.length; i++)
			{
				if(i+1 === emgContacts.length)
					speechOutput += "and " + emgContacts[i].name + ".";
				else
					speechOutput += emgContacts[i].name + ", ";

			}
			console.log("emgContacts: \t" + JSON.stringify(emgContacts));
			console.log(emgContacts.length);

			for(var i = 0; i < emgContacts.length; i++)
			{
				console.log("person name: " + emgContacts[i].name + "\t\tperson number" + emgContacts[i].number);
				var phoneNum = '+' + emgContacts[i].number.toString();
				var body = "Hello " + emgContacts[i].name + "! This is Lifeline, and we have just been notified that"
				+ " Sid needs your help. Please Help him.";
				console.log(phoneNum);

				twilioClient.sendMessage({

					to:phoneNum, // Any number Twilio can deliver to
					from:"+15104557927",
					body: body // body of the SMS message
				}, 
					function(err, responseData) { //this function is executed when a response is received from Twilio
						console.log("done " + i);
					if (!err) { // "err" is an error received during the request, if any

					// "responseData" is a JavaScript object containing data received from Twilio.
					// A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
					// http://www.twilio.com/docs/api/rest/sending-sms#example-1

					// console.log(responseData.from); // outputs "+14506667788"
					// console.log(responseData.body); // outputs "word to your mother."

					}
					numDone++;
					console.log("numDone: " + numDone);
					if(numDone+1 === total)
					{
						console.log("CALLBACK!!");
						numDone = 0;
							callback(sessionAttributes,
						buildSpeechletResponse(cardTitle, speechOutput, repromptText, true));
					}
				});
				// console.log(phoneNum);
			}
		}
		// console.log("end verify ---------");
	});

	// var resp = new twilioClient.TwimlResponse();

	// resp.say('Hello!');
	// resp.say('Sid has fallen and can\'t get up. Please help him. Thank you.', {
		// voice:'woman',
		// language:'en-gb'
	// });
	// console.log(resp.toString());

	// twilioClient.makeCall({ 
	// 	to: "+15103044167",
	// 	from:"+15104557927",
	// 	body: resp.toString()
	// }, 
	// function(err, message) { 
	// 	console.log(err);
	// 	console.log(message); 
	
		// callback(sessionAttributes,
			// buildSpeechletResponse(cardTitle, speechOutput, repromptText, true));

	// });

	// if(person)
	// {
	// 	speechOutput += "The given person is " + person.value;
	// 	for(var i = 0; i < 10; i++)
	// 		speechOutput += person.value;
	// 	console.log("person: " + person.value);
	// }

}

function handleRepeatRequest(intent, session, callback) {
	// Repeat the previous speechOutput and repromptText from the session attributes if available
	// else start a new game session
	if (!session.attributes || !session.attributes.speechOutput) {
		getWelcomeResponse(callback);
	} else {
		callback(session.attributes,
			buildSpeechletResponseWithoutCard(session.attributes.speechOutput, session.attributes.repromptText, false));
	}
}

function handleGetHelpRequest(intent, session, callback) {
	// Provide a help prompt for the user, explaining how the game is played. Then, continue the game
	// if there is one in progress, or provide the option to start another one.

	// Do not edit the help dialogue. This has been created by the Alexa team to demonstrate best practices.

	var speechOutput = "Do you need to alert someone or do you want to verify your alert information?",
		shouldEndSession = false,
		repromptText = "";
	callback(session.attributes,
		buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession));
}

function handleFinishSessionRequest(intent, session, callback) {
	// End the session with a "Good bye!" if the user wants to quit the game
	callback(session.attributes,
		buildSpeechletResponseWithoutCard("Good bye!", "", true));
}

// ------- Helper functions to build responses -------


function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
	output = "<speak>" + output + "</speak>";
	return {
		outputSpeech: {
			type: "SSML",
			ssml: output
		},
		card: {
			type: "Simple",
			title: title,
			content: output
		},
		reprompt: {
			outputSpeech: {
				type: "PlainText",
				text: repromptText
			}
		},
		shouldEndSession: shouldEndSession
	};
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
	output = "<speak>" + output + "</speak>";
	return {
		outputSpeech: {
			type: "SSML",
			ssml: output
		},
		reprompt: {
			outputSpeech: {
				type: "PlainText",
				text: repromptText
			}
		},
		shouldEndSession: shouldEndSession
	};
}

function buildResponse(sessionAttributes, speechletResponse) {
	return {
		version: "1.0",
		sessionAttributes: sessionAttributes,
		response: speechletResponse
	};
}

