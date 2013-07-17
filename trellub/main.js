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

	loadTrellubHtml = function(){
		$('body').append('<div id="trellub-container"></div>');
		$("#trellub-container").load(chrome.extension.getURL('trellub.html'), function(){
			// Load complete
			console.info("Trello page loaded in the bg");

			if (onGithub){
				addTrelloButton();
			}
		});
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
	};



	loadTrellubHtml();
	

	if (window.location.href.indexOf("trello") > -1)
		setupTrello();
	else
		setupGithub();

	return {
		addGithubButton: addGithubButton
	};
})(jQuery, Trello);


