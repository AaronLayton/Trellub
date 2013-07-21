var trellub = (function($, Trello) {
	
	var version = "0.0.2",
		githubKey,
		onTrello = (window.location.href.indexOf("trello") > -1),
		onGithub = !onTrello,

	addGithubButton = function(){
		var githubButton = $($('#github-button-template').html());

		githubButton.insertBefore($('div.other-actions > div > *:nth-child(1)'));
		githubButton.on("click", showAddGithubIssue);
			
		$('.button-link:not(.js-github-issue)').click(function(e){
			$('#github-popover').hide();
		});
	},

	showAddGithubIssue = function(){
		var popoverOffset = $(this).offset();
		popoverOffset.top += $(this).height() + 18;
		// Having to set by CSS as offet() was doubling up the values
		$('#github-popover').css({
			top: popoverOffset.top,
			left: popoverOffset.left
		}).show();

		// Prepopulate Title and Description
		$('#issue-title').val($('.window-title-text').text());
		$('#issue-description').val($('.card-detail-desc').text().trim());
		
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
		}else if (githubKey == null) { // If we have no access_token and no code, get a new code
			location.href = 'https://github.com/login/oauth/authorize?client_id=0d34021d0ebc2363b2a0&scope=repo&redirect_uri='+location.href
      		return;
		}

		if (code == null && githubKey != null){
			updateLocalRepos();
      		return; // No need to reauthenticate
		}

      	$.ajax({
      		url: "http://www.validatethis.co.uk/trellub/",
      		type: "post",
			data: {
				code:code
			},
			dataType: "json",
      		success: function(data) {
      			githubKey = data['access_token'];

      			if (githubKey != null){
					localStorage.setItem('trellub_githubKey', githubKey);
					updateLocalRepos();
					console.info("Trellub: Successfully authenticated Github");
		        } else {
					console.warn("Trellub: Github did not authenticate");
		        }
      		},
      		error: function(data) {
      			console.warn("Trellub: Trouble with the proxy page, quick call the doctor");
      		}
      	});
	},

	updateLocalRepos = function(){
		githubKey =  localStorage.getItem("trellub_githubKey");

		if (githubKey == null)
			return authenticateGithub();

		$.ajax({
			url:'https://api.github.com/user/repos',
			type:'GET',
			headers:{'Authorization':'token ' + githubKey},
			data: {
				sort:"updated"
			},
			success:function(data, textStatus, jqXHR) {
				$.each(data, function(i,e){
					addToKnownRepos(e.full_name);
				});

				var knownRepos = JSON.parse(localStorage.getItem('trellub_knownRepos'))
					lastRepo = localStorage.getItem('trellub_lastUsedRepo');

				// Update the Github issue select
				var repoSelect = $('.js-trellub-repo-list').empty();
				$.each(knownRepos, function (i, item) {
					var thisOption = { 
				        text : item
				    };
				    if (item == lastRepo) thisOption.selected = "selected";
				    repoSelect.append($('<option>', thisOption));
				});

				repoSelect.chosen({
					width:"100%"
				}).on("change", function(e){
					localStorage.setItem('trellub_lastUsedRepo', $('.js-trellub-repo-list option:selected').text());
				});
			},
			error:function(jqXHR, textStatus, errorThrown) {
				console.warn("Trellub: Trouble with fetching Repo list");
			}
		});
	},

	addToKnownRepos = function(repo) {		
		var knownRepos = JSON.parse(localStorage.getItem('trellub_knownRepos'));

		if (knownRepos == null)
			knownRepos = [];

		if (knownRepos.indexOf(repo) === -1)
			knownRepos.push(repo);
		
		localStorage.setItem('trellub_knownRepos', JSON.stringify(knownRepos));

	},

	getParameterByName = function(name) {
	    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
	    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
	        results = regex.exec(location.search);
	    return results == null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
	},

	setupGithubPopup = function(){

		$('.js-close-github-popover').click(function(e){
			$('#github-popover').hide();
		});
		$('body').click(function(e) {
			if ($(e.target).parents().index($('#github-popover')) == -1){
				$('#github-popover').hide();
			}
		});



		$('.js-create-github-issue').click(createGithubIssue);

		// Todo: Validation
		$('#issue-title').blur(function(e){
			validate('#issue-title');
		});

		$('#github-repo').blur(function(e) {
			validate('#github-repo')
		});

		$('#github-popover').keyup(function(e){
			if (e.keyCode === 27) { // if it's the escape key
				$('#github-popover').hide();
				e.stopPropagation();
				document.activeElement.blur();
			}
		});
	},

	createGithubIssue = function(event) {

		if (githubKey == null)
			return githubAuth();

		// Get board vars
		var pathparts = location.pathname.split('/');
		var boardId = pathparts[pathparts.length - 2];
		var cardShortId = pathparts[pathparts.length - 1];

		// Get some authenticationz so we can create boards
		Trello.authorize({
			type: "popup", 
			scope: {
				read:true,
				write:true,
				account:false
			}, 
			name: "Trellub", 
			success:function() {
				
				// TODO: Get a Card with all Github outstandings
				/*
				Trello.get('/boards/' + boardId + '/cards/' + cardShortId, {checklists:'all'}, function(card) {
					console.log(card);
				});
				*/

				// Send the issue to Github
				var repo = $('#github-repo').val();
				var title = $('#issue-title').val();
				var description = $('#issue-description').val() + '\n\n' + cardShortId;

				$.ajax({
					url:'https://api.github.com/repos/' + repo + '/issues',
					type:'POST',
					headers:{'Authorization':'token ' + githubKey},
					contentType:'application/json',
					data:JSON.stringify({
						title:title,
						body:description
					}),
					success:function(data, textStatus, jqXHR) {
						//alert("Issue now in Github");
						console.log(data);
					},
					error:function(jqXHR, textStatus, errorThrown) {
						alert('github api error');
					}
				});

			}, 
			error: function() {
				alert('Trellub: Sorry we need to be authenticated with Trello to continue');
			}
		});
	},

	validators = {
		'#github-repo': function(){
			var good = (/^[^\s\/]+\/[^\s\/]+$/.test($('#github-repo').val()));
			$('#github-repo').toggleClass('input-error', !good);
			return good;
		},
		'#issue-title':function(){
			var good =  $('#issue-title').val().length > 0;
			$('#issue-title').toggleClass('input-error', !good);
			return good;
		}
	},

	validate = function(id) {
		var validator = validators[id];

		if (typeof validator !== 'function')
			return null;

		return validator();
	},

	setupTrello = function(){

		authenticateGithub();

		// Monitor the task window popup for changes so we can add out button
		ob = new MutationObserver(function(objs, observer){
		  var wasHidden = $.inArray('visibility: hidden', $.map(objs, function(o){return o['oldValue'];}).join().split(/;,? ?/)) != -1;
		  if($('.window').is(':visible') && wasHidden) {
		    trellub.addGithubButton();
		  }
		});

		//trigger ob's callback every time the style attribute on window changes
		ob.observe($('.window')[0], {attributes:true, attributeFilter:['style'], attributeOldValue:true});

		// If there is already a card open (creates 2 sometimes?)
		if ($('.window').is(':visible')){
			addGithubButton();
		}

		setupGithubPopup();
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
			if (onTrello){
				setupTrello();
			} else {
				setupGithub();
			}
		});

		
	};

	// Start everything!
	initTrellub();
	
	return {
		addGithubButton: addGithubButton,
		version: version
	};
})(jQuery, Trello);