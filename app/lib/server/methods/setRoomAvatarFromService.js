import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import { settings } from '../../app/settings';
import { setRoomAvatar } from '../../app/lib';
import { Rooms } from '../../app/models/server';
import { hasPermission } from '../../app/authorization/server';

Meteor.methods({
	setRoomAvatarFromService(dataURI, contentType, service, userId) {
		check(dataURI, String);
		check(contentType, Match.Optional(String));
		check(service, Match.Optional(String));
		check(userId, Match.Optional(String));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setRoomAvatarFromService',
			});
		}

		if (!settings.get('Accounts_AllowUserAvatarChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setRoomAvatarFromService',
			});
		}

		let room;

		if (userId && userId !== Meteor.userId()) {
			if (!hasPermission(Meteor.userId(), 'edit-other-user-avatar')) {
				throw new Meteor.Error('error-unauthorized', 'Unauthorized', {
					method: 'setRoomAvatarFromService',
				});
			}

			room = Rooms.findOneByIdOrName(userId);
		} 

		if (room == null) {
			throw new Meteor.Error('error-invalid-desired-user', 'Invalid desired user', {
				method: 'setRoomAvatarFromService',
			});
		}

		return setRoomAvatar(room, dataURI, contentType, service);
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'setRoomAvatarFromService',
	userId() {
		return true;
	},
}, 1, 5000);
