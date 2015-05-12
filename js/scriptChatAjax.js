// commented line 160 to prevent logging out. uncomment for functional testing

$(document).ready(function(){
	
	// Run the init method on document ready:
	chat.init();
	
});

var chat = {

    // data holds variables for use in the class:
    data: {
        lastID: 0,
        noActivity: 0
    },

    // Init binds event listeners and sets up timers:
    init: function () {

        // Using the defaultText jQuery plugin, included at the bottom:
        // $('#name').defaultText('Your name');
        // $('#subject').defaultText('Message');
        

        // Converting the #discussion div into a jScrollPane,
        // and saving the plugin's API in chat.data:

        chat.data.jspAPI = $('#discussion').jScrollPane({
            verticalDragMinHeight: 12,
            verticalDragMaxHeight: 12
        }).data('jsp');

        // We use the working variable to prevent
        // multiple form submissions:
        var working = false;

        // Logging a person in the chat:
        window.onbeforeunload = function (e) {
            var e = e || window.event;

            chatSDK.leavechat();

            // For IE and Firefox
            if (e) {
                e.returnValue = '';
            }

            // For Chrome and Safari
            return '';
        };

        $('#subject').on("keypress", function (e) {            

            console.log("#subject.keypress...")

            if (e.keyCode == 13) {
                // Cancel the default action on keypress event
                e.preventDefault(); 
                $('#loader').show();             

                // Using our tzPOST wrapper function
                // (defined in the bottom):

                chatSDK.joinchat($('#name').val(), $('#email').val(), $('#subject').val(), function (success, result) {

                    working = false;

                    if (success == false) {             
                        chat.displayError(result.statusText);
                    } else {
                        chat.login($('#name').val(), result.Connection_ID);
                    }
                });
            }
        });

        $(document).on("click", "#connect", function () {
            $('#loader').show();

            if (working) return false;
            working = true;

            // Using our tzPOST wrapper function
            // (defined in the bottom): 

            chatSDK.joinchat($('#name').val(), $('#email').val(), $('#subject').val(), function (success, result) {

                working = false;

                if (success == false) {             
                    chat.displayError(result.statusText);
                } else {
                    chat.login($('#name').val(), result.Connection_ID);
                }
            });

            return false;
        });

        // Submitting a new chat entry:

        $('#chatText').on("keypress", function (e) {            

            if (e.keyCode == 13) {
                // Cancel the default action on keypress event
                e.preventDefault(); 

                var text = $('#chatText').val();
                if (text.length == 0) { return false; }
                if (working) return false;
                working = true;

                // Assigning a temporary ID to the chat:
                var tempID = 't' + Math.round(Math.random() * 1000000),
    			params = {
    			    id: tempID,
    			    author: chat.data.name,
    			    author_type: 'me',
    			    gravatar: chat.data.gravatar,
    			    text: text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    			};

                // Using our addChatLine method to add the chat
                // to the screen immediately, without waiting for
                // the AJAX request to complete:
                chat.addChatLine($.extend({}, params));

                // Using our tzPOST wrapper method to send the chat
                // via a POST AJAX request:

                chatSDK.sendmsg(text, function (success, result) {

                    //           $.tzPOST('submitChat', $(this).serialize(), function (r) {
                    working = false;
                    if (success == false) {
                        $('li.chat-' + tempID).remove();
                        chat.displayError(result.statusText);
                    }
                    else {
                        //remove not sent message
                        $('#chatText').val('');

                        //params['id'] = r.insertID;
                        //chat.addChatLine($.extend({}, params));
                    }
                });

            }
        });

        // Logging the user out:
        $(document).on("click", "#disconnectChat", function () {
            console.log('disconnectChat.click');

            chatSDK.leavechat(function (success, result) {
                console.log('success:' + success);
                console.log('result:' + result);
                working = false;
                if (success == false) {
                    chat.displayError(result.statusText);
                }
                else {
                    chat.disconnect();
                }
            });
            return false;

        });

        $(document).on("click", "#resetChat", function () { 
            chat.reset();
        });

        // Checking whether the user is already logged (browser refresh)

        //        $.tzGET('checkLogged', function (r) {
        //            if (r.logged) {
        //                chat.login(r.loggedAs.name, r.loggedAs.gravatar);
        //            }
        //        });

        // Self executing timeout functions

        (function getEventsTimeoutFunction() {
            chat.getEvents(getEventsTimeoutFunction);
        })();

        // TODO needs to display agent name
        //		(function getUsersTimeoutFunction(){
        //			chat.getUsers(getUsersTimeoutFunction);
        //		})();

    },

    // The login method hides displays the
    // user's login data and shows the submit form

    login: function (name, gravatar) {

        chat.data.name = name;
        chat.data.gravatar = gravatar;
        //$('#chatTopBar').html(chat.render('loginTopBar', chat.data));

        $('#loginForm').fadeOut(function () {
            $('#loader').hide();
			$('#chatStatus').fadeIn();
			$('#discussion').fadeIn();
						
            $('#submitForm').fadeIn();
            $('#chatText').focus();
        });

    },

    // The render method generates the HTML markup 
    // that is needed by the other methods:

    render: function (template, params) {
        console.log('template:' + template);
        console.log(JSON.stringify(params));
        var arr = [];
        switch (template) {
            case 'loginTopBar':
                arr = [
                //'<span><img src="', params.gravatar, '" width="23" height="23" />',
                '<span><img src="img/avatar-big.jpg" width="23" height="23" />',
				'<span class="name">', params.name,
				'</span><a href="" id="disconnectButton"  class="disconnectButton rounded">Disconnect</a></span>'];
                break;

            case 'chatLine':
                arr = [
					/*'<div class="chat ', params.author_type, ' chat-', params.id, ' rounded"><span class="gravatar"><img src="', (params.author_type == 'CCU' ? 'img/agent.jpg' : 'img/caller.png'),
					'" width="23" height="23" onload="this.style.visibility=\'visible\'" />', '</span><span class="author">', params.author,
					':</span><span class="text">', params.text, '</span><span class="time">', params.time, '</span></div>'];
                    */
                    '<li class="linechat ', (params.author_type == 'CCU' ? 'other' : 'self'), ' chat-', params.id, 
                    '"><div class="avatar other"><img src="img/', (params.author_type == 'CCU' ? 'avatar-support.jpg' : 'avatar.jpg'), '" alt="avatar" onload="this.style.visibility=\'visible\'"/></div><div class="messages"><p><strong>', 
                    params.author, '</strong></p><p>', (params.url_pushed == null ? params.text : 'URL Received: <a href="' + params.url_pushed + '" target="_blank">' + params.url_pushed + '</a>'), '</p></div></li>'];
                    /*<p><span class="time">', params.time, '</span></p>*/

                    break;
            case 'chatStatus':
                arr = [
                    '<div id="linestatus" class="statusLine">', params.Status_Desc,'</div>'];
                    break;                
            case 'user':
                arr = [
					'<div class="user" title="', params.name, '"><img src="',
					params.gravatar, '" width="30" height="30" onload="this.style.visibility=\'visible\'" /></div>'
				];
                break;
        }

        // A single array join is faster than
        // multiple concatenations

        return arr.join('');

    },

    // The addChatLine method ads a chat entry to the page

    addChatLine: function (params) {

        // All times are displayed in the user's timezone

        var d = new Date();
        if (params.time) {

            // PHP returns the time in UTC (GMT). We use it to feed the date
            // object and later output it in the user's timezone. JavaScript
            // internally converts it for us.

            d.setUTCHours(params.time.hours, params.time.minutes);
        }

        params.time = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' +
					  (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();

        var markup = chat.render('chatLine', params),
			exists = $('#discussion .chat-' + params.id);

        // if (exists.length) {
        //     exists.remove();
        // }

        // if (!chat.data.lastID) {
        //     // If this is the first chat, remove the
        //     // paragraph saying there aren't any:

        //     $('#discussion p').remove();
        // }

        // If this isn't a temporary chat:
        //Always append
        // if (params.id.toString().charAt(0) != 't') {
        //    var previous = $('#discussion .chat-' + (+params.id - 1));
        //    if (previous.length) {
        //        previous.after(markup);
        //    }
        //    else chat.data.jspAPI.getContentPane().append(markup);
        // }
        // else
        chat.data.jspAPI.getContentPane().append(markup);

        // As we added new content, we need to
        // reinitialise the jScrollPane plugin:

        chat.data.jspAPI.reinitialise();
        chat.data.jspAPI.scrollToBottom(true);

    },

    // The addChatStatus method ads a chat entry to the page
    addChatStatus: function (params) {

        // All times are displayed in the user's timezone

        var d = new Date();
        if (params.time) {

            // PHP returns the time in UTC (GMT). We use it to feed the date
            // object and later output it in the user's timezone. JavaScript
            // internally converts it for us.

            d.setUTCHours(params.time.hours, params.time.minutes);
        }

        params.time = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' +
                      (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();

        var markup = chat.render('chatStatus', params),
            exists = $('#discussion .chat-' + params.id);

        // if (exists.length) {
        //     exists.remove();
        // }

        // if (!chat.data.lastID) {
        //     // If this is the first chat, remove the
        //     // paragraph saying there aren't any:

        //     $('#discussion p').remove();
        // }

        // If this isn't a temporary chat:
        //Always append
        // if (params.id.toString().charAt(0) != 't') {
        //    var previous = $('#discussion .chat-' + (+params.id - 1));
        //    if (previous.length) {
        //        previous.after(markup);
        //    }
        //    else chat.data.jspAPI.getContentPane().append(markup);
        // }
        // else
        chat.data.jspAPI.getContentPane().append(markup);

        // As we added new content, we need to
        // reinitialise the jScrollPane plugin:

        chat.data.jspAPI.reinitialise();
        chat.data.jspAPI.scrollToBottom(true);

    },

    // This method requests the latest chats
    // (since lastID), and adds them to the page.

    getEvents: function (callback) {

        var bContinue = true;
        var noActivity = 0;

        chatSDK.getEvents(
            function ChatMessage ( result ) {

                //$.tzGET('getChats',{lastID: chat.data.lastID},function(r){
                //debugger;

                //working = false;

                noActivity = 0;
                chat.addChatLine(result);
                //chat.data.lastID = result.chats[i - 1].id;

            },

            function ChatStatus(result) {

                //$.tzGET('getChats',{lastID: chat.data.lastID},function(r){


                //working = false;
                       // var chatResult = 't' + Math.round(Math.random() * 1000000),
            				       //          params = {
            				       //              id: item.Event_ID,
            				       //              Status_Code: item.Status_Code,
            				       //              Estimated_Time: item.Estimated_Time,
            				       //              Status_Desc: Status_Desc.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
            				       //              Additional_Information: item.Additional_Information
            				       //          };

                noActivity = 0;
                //chat.data.jspAPI.getContentPane().html('<p class="noChats">' + result.Status_Code + result.Status_Desc + '</p>');
                //users.push('<p class="count">' + result.Status_Code + result.Status_Desc + '</p>');

                if(result.Status_Desc!="") {
                    //$('#chatStatus').fadeIn();
                    chat.addChatStatus(result);
                }
            },

            function ChatDisconnect(strParticipant) {

                //$.tzGET('getChats',{lastID: chat.data.lastID},function(r){

                //working = false;
                bContinue = false;
                //chat.disconnect();
    			
                $('#chatStatus').html(strParticipant + " disconnected.");
    			log.info(strParticipant + " disconnected.");

            },

            function ChatError(errCode, result) {

                //$.tzGET('getChats',{lastID: chat.data.lastID},function(r){

                //working = false;

                if (errCode != null)
                    chat.displayError(errCode);
                else if (result != null)
                    chat.displayError(result.Error_Desc);
                else //no events
                    chat.data.noActivity++;

            }
        );

        // Setting a timeout for the next request,
        // depending on the chat activity:

        var nextRequest = 1000;

        // 2 seconds
        if (chat.data.noActivity > 3) {
            nextRequest = 2000;
        }

        if (chat.data.noActivity > 10) {
            nextRequest = 5000;
        }

        // 10 seconds
        if (chat.data.noActivity > 20) {
            nextRequest = 10000;
        }

        setTimeout(callback, nextRequest);

    },

    // This method displays an error message on the top of the page:


    displayError: function (msg) {
	
		log.error(msg);
        // var elem = $('<div>', {
        //     id: 'chatErrorMessage',
        //     html: msg
        // });

        // elem.click(function () {
        //     $(this).fadeOut(function () {
        //         $(this).remove();
        //     });
        // });

        // setTimeout(function () {
        //     elem.click();
        // }, 5000);

        // elem.hide().appendTo('body').slideDown();
        $('#chatError').html('<p>Error: ' + msg + '</p>');
        $('#chatError').fadeIn();

        setTimeout(function () {
            $('#chatError').fadeOut();
        }, 5000);
    },

    disconnect: function () {

        $('#submitForm').fadeOut(function () {
            chat.addChatStatus('You have ended your chat session');
            $('#endChat').fadeIn();
        });
        
        //$('#discussion').fadeOut(function () {
		//	$('#submitForm').fadeOut();
        //    $('#endChat').fadeIn();
        //});

        //chat.data.jspAPI.getContentPane().html('<p class="noChats"></p>');
		//log.info("Disconnected");

    },

    reset: function () {

        $('#endChat').fadeOut(function () {
            $('#chatStatus').html('<strong>We’re online every single day!</strong></br>Queries? Chat with our help desk support now.');
            $('#loginForm').fadeIn();
        });

    }

};

// A custom jQuery method for placeholder text:

$.fn.defaultText = function(value){
	
	var element = this.eq(0);
	element.data('defaultText',value);
	
	element.focus(function(){
		if(element.val() == value){
			element.val('').removeClass('defaultText');
		}
	}).blur(function(){
		if(element.val() == '' || element.val() == value){
			element.addClass('defaultText').val(value);
		}
	});
	
	return element.blur();
}