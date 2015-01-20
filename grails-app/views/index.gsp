<!DOCTYPE html>
<html ng-app="slackApp">
<head>
	<meta name="layout" content="main" />
	<asset:stylesheet src="grails-angularjs.css" />
	<asset:stylesheet src="style.css" />
</head>
<body>
	<div ng-controller="SlackCtrl" class="container">
		<form ng-submit="addMessage()" name="messageForm">
			<input type="text" placeholder="Compose a new message..." ng-model="message" />
			<div class="info">
				<button>Send</button>
			</div>
		</form>
		<hr />

		<ul>
			<li ng-repeat="channel in channels">
				<p>{{channel.name}}</p>
			</li>
		</ul>

		<p ng-repeat="message in messages" class="message">
			<time>{{message.ts | date:'HH:mm'}}</time>
			<span ng-class="{self: message.self}">{{message.user}} - {{message.text}}</span>
		</p>
	</div>
	
	<asset:javascript src="jquery" />
	<asset:javascript src="lodash.js" />
	<asset:javascript src="spring-websocket" />
	<asset:javascript src="grails-angularjs.js" />
	<asset:javascript src="app.js" />
	<asset:javascript src="controllers.js" />
	<asset:javascript src="services.js" />
</body>
</html>