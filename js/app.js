$(document).foundation();
            $('#discussion').fadeOut();
            $('#loginForm').fadeIn();
// CHAT BOX
$(document).ready(function(){
    $('#chat').click(function(){
		var hidden = $('.hidden');
		if (hidden.hasClass('visible')){
			hidden.animate({"left":"-300px"}, "slow").removeClass('visible');
		} else {
			hidden.animate({"left":"0px"}, "slow").addClass('visible');
		}
    });
});

$(document).ready(function() {
    $('#close').click(function(){
    var hidden = $('.hidden');
    if (hidden.hasClass('visible')){
        hidden.animate({"left":"-300px"}, "slow").removeClass('visible');
    } else {
        hidden.animate({"left":"0px"}, "slow").addClass('visible');
    }
    });	
});

// END CHATBOX
