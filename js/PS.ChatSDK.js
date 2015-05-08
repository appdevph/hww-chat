	var chatSDK = {

	// data holds variables for use in the class:

	status_res: {
		// "104": "Calling Call Center",
		// "105": "Waiting for Agent",
		// "106": "In Call",
		// "107": "Not Connected",
		// "133": "Connected to the call center",
		// "157": "Call placed on hold",
		// "165": "Waiting in queue"

		//Customized status
		"104": "Calling Call Center",
		"105": "Waiting for Agent",
		"106": "In Call",
		"107": "Disconnected",
		"133": "Connected to the call center",
		"157": "Call placed on hold",
		"165": "Waiting in queue"
	},

	waiting_in_queue: {
		1: "Less than",
		2: "About",
		3: "Longer then"
	},

	no_agent_for_this_call: {
		6: "Unknown reason",
		7: "Insufficient memory",
		8: "No satisfying agents",
		9: "Invalid queue",
		10: "No primary connection server address",
		11: "No call ID",
		12: "Invalid external queue",
		13: "Unknown skill name is specified in call requirements",
		14: "Stream with reference your already exist",
		15: "Cannot find the call by your reference",
		16: "Call with your reference cannot be accepted by the agent",
		17: "There is no connection available now",
		18: "Agent refused"
	},

	data_obj1: {
		"API_Version" : "1.0",
		//"Call_Center_Address" : "125.5.111.115", //public access
		"Call_Center_Address" : "192.168.14.159", //private access
		"Call_Center_QueueName" : "Chat", // "DefaultQueue",
		"Calling_User_HardMessage" : "I need some help",
		"TQOS" : "0",
		"Routing_Priority" : "0",
		"AccountID" : "0",
		"Calling_User_Skills" : "ChatSkill",
		"ApplicationID" : "DefaultApplication",
		"Call_Center_Port" : "2324",
		"Calling_User_Priority" : "-1",
		"Calling_User_URL" : "",
		"Calling_User_FirstName" : "CustomerFirstName",
		"Calling_User_LastName" : "CustomerLastName",
		"TenantID" : "Tenant11"
	},

	data_obj2: { "Connection_ID": 123, "Message_Text": "enghouse test page" },
	data_obj3: { "Connection_ID": 123 },
	data_obj4: { "Connection_ID": 123, "Last_Event_ID": 4 },

	data_global: {
		his : "",
		connId : -1,
		lastEventId : 0,
		//CCUServerAddress : "http://192.116.195.147"
		CCUServerAddress : "http://192.168.14.159" 
		//CCUServerAddress : "http://125.5.111.115"
	},

	// Init binds event listeners and sets up timers:

	isNotConnected: function () {
		return (chatSDK.data_global.connId == -1);   //still no connection
	},

	getEvents: function (GUICallbackFunctionChatMessage, GUICallbackFunctionChatStatus, GUICallbackFunctionChatDisconnect, GUICallbackFunctionChatError) {

        //debugger;

		if (chatSDK.isNotConnected())    //still no connection
			return GUICallbackFunctionChatError(null, null);

		var myUrl = chatSDK.data_global.CCUServerAddress 
		            + "/scripts/ChatExtension.DLL?command=getevents&Connection_ID=" 
		            + chatSDK.data_global.connId 
		            + "&Last_Event_ID=" 
		            + chatSDK.data_global.lastEventId;
		
		$.ajax({
			url: myUrl,
			type: 'GET',
			cache: false,
			contentType: 'application/json; charset=utf-8',
			dataType: 'json'
		})

		.done(function (res) {
			//checkResult

			//debugger;

			if (!res.Events)
				return GUICallbackFunctionChatError(null, null); //continue in loop

			$.each(res.Events, function (i, item) {

				//debugger;

				chatSDK.data_global.lastEventId = item.Event_ID; // etc		
				switch (item.Command) {
					case "read": {
						console.log(JSON.stringify(item));
						var chatResult = {
							id: item.Event_ID,
							author: item.Participant_Name,
							author_type: 'CCU',
							gravatar: 'CCU',
							text: item.Message_Text.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
							url_pushed: item.URL_Pushed,
							Additional_Information: item.Additional_Information
						};

						//jsonArr.push(chatResult);

						GUICallbackFunctionChatMessage(chatResult);

						break;
					}
					case "status": {

						//if (item.Additional_Information)
						//    his = his + "Status_Code " + item.Status_Code + " Estimated Time" + item.Estimated_Time + ",Additional_Information" + item.Additional_Information + ".\n";
						//else
						//    his = his + "Status_Code " + item.Status_Code + ".\n";

						var nameOfStatus = "chatSDK.status_res[" + item.Status_Code + "]";
						var Status_Desc = eval(nameOfStatus);

						var chatResult = {
							id                     : item.Event_ID,
							Status_Code            : item.Status_Code,
							Estimated_Time         : item.Estimated_Time,
							Status_Desc            : Status_Desc.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
							Additional_Information : item.Additional_Information
						};

						GUICallbackFunctionChatStatus(chatResult);

						break;
                    }
                    case "ParticipantDisconnected": {
						chatSDK.data_global.connId = -1;
						chatSDK.data_global.shalom = 0;
						GUICallbackFunctionChatDisconnect(item.Participant_Name);
						break;
					}
					case "Error": {
						//GUICallbackFunctionChatError(item.Error_Code, null);

						var nameOfError = "chatSDK.no_agent_for_this_call[" + item.Error_Code + "]";
						var Error_Desc = eval(nameOfError);

						var chatResult = {
							Error_Code : item.Error_Code,
							Error_Desc : Error_Desc
						}

						GUICallbackFunctionChatError("", chatResult);

						break;
					}

				}
				//$('#TextBox').val(his);
				//res.chats = jsonArr;
			});

		})

		.fail(function (jqXHR, textStatus) {
			//chatSDK.displayError(textStatus);
			GUICallbackFunctionChatError("", jqXHR);
		});

		//alert('getEvents: connId' + chatSDK.data_global.connId + "&Last_Event_ID=" + chatSDK.data_global.shalom);

	},

	joinchat: function (strUserName, strUserSubject, GUICallbackFunction) {

		//      data_obj1.API_Version = $('#api_version').val();
		//	    data_obj1.Call_Center_Address = $('#adress').val();
		//	    data_obj1.Call_Center_QueueName = $('#queue').val();
		//	    data_obj1.Call_Center_Port = $('#port').val();
		//	    data_obj1.Calling_User_Priority = $('#user_priorty').val();
		//	    data_obj1.Calling_User_URL = $('#url').val();
		chatSDK.data_obj1.Calling_User_FirstName = strUserName;
		chatSDK.data_obj1.Calling_User_HardMessage = strUserSubject;
		chatSDK.data_obj1.Calling_User_LastName = "";
		//	    data_obj1.TenantID = $('#tenantid').val();
		//	    data_obj1.ApplicationID = $('#applicationid').val();
		//	    data_obj1.Calling_User_Skills = $('#skill').val();
		//	    data_obj1.AccountID = $('#accountid').val();
		//	    data_obj1.Routing_Priority = $('#routingprio').val();
		//	    data_obj1.TQOS = $('#tqos').val();

		//theInterval = window.setInterval(doAjax, 10000);

		$.ajax({
			url: chatSDK.data_global.CCUServerAddress + "/scripts/ChatExtension.DLL?joinchat",
			cache: false,
			type: 'POST',
			data: JSON.stringify(chatSDK.data_obj1),
			contentType: 'application/json; charset=utf-8',
			dataType: 'json'
		})
		.done(function (res) {
			chatSDK.data_global.connId = res.Connection_ID;
			chatSDK.data_global.shalom = 0;
			chatSDK.data_global.lastEventId = 0;
			GUICallbackFunction(true, res);
		})
		.fail(function (jqXHR, textStatus) {
			//chatSDK.displayError(textStatus);
			GUICallbackFunction(false, jqXHR);
		});
		//alert('Posted: ' + JSON.stringify(chatSDK.data_obj1));

	},

	sendmsg: function (strText, GUICallbackFunction) {

		if (chatSDK.isNotConnected())    //still no connection
			return false;

		//debugger;
		chatSDK.data_obj2.Connection_ID = chatSDK.data_global.connId;
		chatSDK.data_obj2.Message_Text = strText;

		$.ajax({
			url: chatSDK.data_global.CCUServerAddress + "/scripts/ChatExtension.DLL?sendmsg",
			cache: false,
			type: 'POST',
			data: JSON.stringify(chatSDK.data_obj2),
			contentType: 'application/json; charset=utf-8',
			dataType: 'json'
		})
		.done(function (res) {
			//bug it is enter into fail
			GUICallbackFunction(true, res);
		})
		.fail(function (jqXHR, textStatus) {
			if (jqXHR.statusText == "OK") //workaround for empty result of JSON
				//chatSDK.displayError(textStatus);
				GUICallbackFunction(true, jqXHR);
			else
				GUICallbackFunction(false, jqXHR);
		});

		//alert('Posted sendmsg: ' + JSON.stringify(chatSDK.data_obj2));

	},

	leavechat: function (GUICallbackFunction) {
 		console.log('leavechat');
		//debugger;

		if (chatSDK.isNotConnected())    //still no connection
			return false;

		chatSDK.data_obj3.Connection_ID = chatSDK.data_global.connId;
		console.log(JSON.stringify(chatSDK.data_obj3));
		$.ajax({
			url: chatSDK.data_global.CCUServerAddress + "/scripts/ChatExtension.DLL?leavechat",
			cache: false,
			type: 'POST',
			data: JSON.stringify(chatSDK.data_obj3),
			contentType: 'application/json; charset=utf-8',
			dataType: 'json'
		})
		.done(function (res) {
			console.log('done');
			chatSDK.initGlobals();
			//bug it is enter into fail
			GUICallbackFunction(true, res);
		})
		.fail(function (jqXHR, textStatus) {
			console.log('fail');
			if (jqXHR.statusText == "OK") { //workaround for empty result of JSON
				//chatSDK.displayError(textStatus);
				chatSDK.initGlobals();
				GUICallbackFunction(true, jqXHR);
			} else {
				GUICallbackFunction(false, jqXHR);
			}
		});

		//alert('Posted sendmsg: ' + JSON.stringify(chatSDK.data_obj3));

	},

	//not in use, always error displayed at parent
	displayError: function (msg) {
		var elem = $('<div>', {
			id: 'chatErrorMessage',
			html: msg
		});
	},

	//not in use, always error displayed at parent
	initGlobals: function () {
		chatSDK.data_global.connId = -1;        
		chatSDK.data_global.lastEventId = 0;
		chatSDK.data_global.shalom = 0;
	}

};