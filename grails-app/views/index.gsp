<!DOCTYPE html>
<html ng-app="slackApp" ng-controller="SlackCtrl">
<head>
	<meta name="layout" content="main" />
	<title ng-bind-html="pageTitle">Data Works</title>
	<asset:link rel="shortcut icon" href="favicon.ico" type="image/x-icon"/>
	<asset:stylesheet src="reset.css" />
	<asset:stylesheet src="bootstrap-3.3.2-dist/css/bootstrap.css" />
	<asset:stylesheet src="angular-bootstrap-fix.css" />
	<asset:stylesheet src="grails-angularjs.css" />
	<asset:stylesheet src="general.css" />
	<asset:stylesheet src="header.css" />
	<asset:stylesheet src="content-sidebar.css" />
	<asset:stylesheet src="content-messages.css" />
	<asset:stylesheet src="footer.css" />
	<asset:stylesheet src="modal.css" />
</head>
<body>
	<div id="header">
		<div id="sidebar-header">
			<header><asset:image src="logo.png" width="150"/></header>
		</div>
		<div id="message-header" ng-cloak>
			<div class="message-header-channel">{{currentChannelName}}</div>
			<div class="message-header-members" ng-show="currentChannelMembers">
				<a ng-click="showCurrentMembers()">{{currentChannelMembers.length}} Members</a>
			</div>
		</div>
	</div>
	<div id="content">
		<div class="sidebar">
			<header>CHANNELS</header>
			<ul class="channels">
				<li ng-repeat="channel in channels | orderBy:'name'" ng-class="getChannelClass(channel.type, channel.name)" 
					ng-click="changeChannel(channel.type, channel.id, channel.name)">
					<div ng-cloak>{{getChannelSymbol(channel.type)}}&nbsp;{{channel.name}}<span class="unread-count" ng-show="channel.unread_count > 0">{{channel.unread_count}}</span></div>
				</li>
			</ul>
			<header>DIRECT MESSAGES</header>
			<ul class="ims">
				<li ng-repeat="im in ims | removeDeleted:getUserDeleted | orderBy:getImUserName" ng-class="getChannelClass('im', getImUserName(im))"
					ng-click="changeChannel('im', im.id, getImUserName(im))">
					<div ng-cloak ng-class="getImPresenceClass(im)">{{getImUserName(im)}}<span class="unread-count" ng-show="im.unread_count > 0">{{im.unread_count}}</span></div>
				</li>
			</ul>
		</div>
		
		<div class="messages" scroll-glue>
			<div ng-if="currentChannelHasMore" ng-cloak><button class="more-msgs-btn" ng-click="showMoreMessages()">Retrieve More Messages</button></div>
		
			<div ng-repeat="message in messages track by message.ts" class="message" ng-class="{'user-change': message.userChange, 'unconfirmed': message.unconfirmed}">
				<div ng-if="message.dayChange" class="day-divider">
					<hr /><div class="day" ng-cloak>{{message.date | date: 'MMMM d, yyyy (EEEE)'}}</div>
				</div>
				<div ng-class="{'user-profile-image': message.userChange, 'user-profile-no-image': !message.userChange}">
					<img ng-if="message.userChange" ng-src="{{users[message.user].profile.image_48}}"></img>
				</div>
				
				<div ng-show="{{message.userChange}}" class="user-name-time"><span class="user-name" ng-cloak>{{users[message.user].name}}</span><time ng-cloak>{{message.date | date:'hh:mm a'}}</time></div>
				
				<div class="message-text" ng-bind-html="message.text"></div>
			</div>
		</div>
	</div>
	
	<div id="footer">
		<div id="sidebar-footer">
			<div class="current-user-image">
				<img ng-src="{{users[self.id].profile.image_48}}" ng-cloak></img>
			</div>
			<div class="current-user-name" ng-cloak><a ng-click="showTokenModal()">{{self.name}}</a></div>
		</div>
		<div id="message-footer">
			<textarea ng-model="message" ng-keyup="$event.keyCode == 13 && !$event.ctrlKey && !$event.shiftKey && !$event.altKey && addMessage($event)"></textarea>
		</div>
	</div>
	<asset:javascript src="jquery" />
	<asset:javascript src="lodash.js" />
	<asset:javascript src="spring-websocket" />
	<asset:javascript src="grails-angularjs.js" />
	<asset:javascript src="ui-bootstrap-tpls-0.12.0.min.js" />
	<asset:javascript src="scrollglue.js" />
	<asset:javascript src="app.js" />
	<asset:javascript src="controllers.js" />
	<asset:javascript src="services.js" />
	<asset:javascript src="filters.js" />
</body>
</html>