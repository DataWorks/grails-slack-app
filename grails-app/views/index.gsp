<!DOCTYPE html>
<html ng-app="slackApp">
<head>
	<meta name="layout" content="main" />
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
<body ng-controller="SlackCtrl">
	<div id="header">
		<div id="sidebar-header">
			<p>Data Works</p>
		</div>
		<div id="message-header">{{currentChannelName}}</div>
	</div>
	<div id="content">
		<div class="sidebar">
			<header>CHANNELS</header>
			<ul class="channels">
				<li ng-repeat="channel in channels" ng-class="getChannelClass('channel', channel.name)" 
					ng-click="changeChannel('channel', channel.id, channel.name)">
					<div>#&nbsp;{{channel.name}}<span class="unread-count" ng-show="channel.unread_count > 0">{{channel.unread_count}}</span></div>
				</li>
			</ul>
			<header>DIRECT MESSAGES</header>
			<ul class="ims">
				<li ng-repeat="im in ims" ng-class="getChannelClass('im', users[im.user].name)"
					ng-click="changeChannel('im', im.id, users[im.user].name)">
					<div>{{users[im.user].name}}<span class="unread-count" ng-show="im.unread_count > 0">{{im.unread_count}}</span></div>
				</li>
			</ul>
			<header>PRIVATE GROUPS</header>
			<ul class="groups">
				<li ng-repeat="group in groups" ng-class="getChannelClass('group', group.name)"
					ng-click="changeChannel('group', group.id, group.name)">
					<div>{{group.name}}<span class="unread-count" ng-show="group.unread_count > 0">{{group.unread_count}}</span></div>
				</li>
			</ul>
		</div>
		
		<div class="messages">
			<div ng-repeat="message in messages track by message.ts" class="message">
				<div class="user-profile-image">
					<img ng-if="message.userChange" ng-src="{{users[message.user].profile.image_48}}"></img>
				</div>
				<div ng-show="{{message.userChange}}" class="user-name-time"><span class="user-name">{{users[message.user].name}}</span><time>{{message.date | date:'HH:mm'}}</time></div>
				
				<div class="message-text">{{message.text}}</div>
			</div>
		</div>
	</div>
	
	<div id="footer">
		<div id="sidebar-footer">
			<div class="current-user-image">
				<img ng-src="{{users[self.id].profile.image_48}}"></img>
			</div>
			<div class="current-user-name">{{self.name}}</div>
		</div>
		<div id="message-footer">
			<textarea ng-model="message" ng-keyup="$event.keyCode == 13 && addMessage()"></textarea>
		</div>
	</div>
	<asset:javascript src="jquery" />
	<asset:javascript src="lodash.js" />
	<asset:javascript src="spring-websocket" />
	<asset:javascript src="grails-angularjs.js" />
	<asset:javascript src="ui-bootstrap-tpls-0.12.0.min.js" />
	<asset:javascript src="app.js" />
	<asset:javascript src="controllers.js" />
	<asset:javascript src="services.js" />
</body>
</html>