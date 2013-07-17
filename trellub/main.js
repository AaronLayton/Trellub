var trellub = (function($, Trello) {
	
	var version = "0.0.1",
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
		addGithubButton: addGithubButton
	};
})(jQuery, Trello);