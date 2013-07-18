var trellub = (function($, Trello) {
	
	var version = "0.0.2",
		githubKey,
		onTrello = (window.location.href.indexOf("trello") > -1),
		onGithub = !onTrello,

	addGithubButton = function(){
		var githubButton = $($('#github-button-template').html());

		githubButton.insertBefore($('div.other-actions > div > *:nth-child(1)'));
	},

	addTrelloButton = function(){
		var trelloButton = $($('#trello-button-template').html());

		trelloButton.insertBefore($('.comment-topic-actions > *:nth-child(1)'));
	},

	authenticateGithub = function(){
		var code;

		githubKey =  localStorage.getItem("trellub_githubKey");

		if (getParameterByName("code") != null){ // If we have been passed a code then we need to reauth 
			code = getParameterByName("code");
		}else if (githubKey == null) { // If we have no token and no code, get a new code
			location.href = 'https://github.com/login/oauth/authorize?client_id=0d34021d0ebc2363b2a0&scope=repo&redirect_uri='+location.href
      		return;
		}

		if (code == null && githubKey != null)
      		return; // No need to reauthenticate

      	$.ajax({
      		url: "http://www.validatethis.co.uk/trellub",
      		type: "post",
      		async: false,
      		contentType: "application/json",
      		data: JSON.stringify({
      			code: code
      		}),
      		success: function(data) {
      			console.log(data);

      			githubKey = data['access_token'];

      			if (githubKey != null)
					localStorage.setItem('trellub_githubKey', githubKey);
		        else {
					console.warn("Trellub: Github did not authenticate");
		        }
      		},
      		error: function(data) {
      			console.warn("Trellub: Trouble with the proxy page, quick call the doctor");
      		}
      	});
	},

	getParameterByName = function(name) {
	    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
	    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
	        results = regex.exec(location.search);
	    return results == null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
	},

	setupTrello = function(){
		// Monitor the task window popup for changes so we can add out button
		ob = new MutationObserver(function(objs, observer){
		  var wasHidden = $.inArray('visibility: hidden', $.map(objs, function(o){return o['oldValue'];}).join().split(/;,? ?/)) != -1;
		  if($('.window').is(':visible') && wasHidden) {
		    trellub.addGithubButton();
		  }
		});

		//trigger ob's callback every time the style attribute on window changes
		ob.observe($('.window')[0], {attributes:true, attributeFilter:['style'], attributeOldValue:true})
	},

	setupGithub = function(){
		console.log("Hi there Github");		
		addTrelloButton();
	},

	initTrellub = function(){

		authenticateGithub();
		
		// Create our main container and attach it to the body
		var trellubContainer = $('<div id="trellub-container"></div>');
		$('body').append(trellubContainer);

		// Load our templates html into our container
		trellubContainer.load(chrome.extension.getURL('trellub.html'), function(){

			// Decide which part of the script to kick off
			if (onTrello)
				setupTrello();
			else
				setupGithub();
		});

		
	};

	// Start everything!
	initTrellub();
	
	return {
		addGithubButton: addGithubButton,
		version: version
	};
})(jQuery, Trello);