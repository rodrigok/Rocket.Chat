import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import { FileUpload } from '../../app/file-upload';
import { Rooms } from '../../app/models/server';
import { settings } from '../../app/settings';
import { Notifications } from '../../app/notifications';
import { hasPermission } from '../../app/authorization/server';

Meteor.methods({
	resetRoomAvatar(userId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'resetRoomAvatar',
			});
		}

		//no real reason to check this since there is no equivalent "allow room avatar change" setting currently
		/**if (!settings.get('Accounts_AllowUserAvatarChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setRoomAvatarFromService',
			});
		}*/

		let room;

		if (userId) {
			if (!hasPermission(Meteor.userId(), 'edit-room', userId)) {
				throw new Meteor.Error('error-unauthorized', 'Unauthorized', {
					method: 'resetRoomAvatar',
				});
			}

			room = Rooms.findOneByIdOrName(userId);
		} 

		if (room == null) {
			throw new Meteor.Error('error-invalid-desired-room', 'Invalid desired room', {
				method: 'resetRoomAvatar',
			});
		}

		let roomName = `@${ room.name }`;

		FileUpload.getStore('Avatars').deleteByName(roomName);
		Rooms.unsetAvatarOrigin(room._id);
		Notifications.notifyLogged('updateAvatar', {
			username: roomName,
		});
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'resetRoomAvatar',
	userId() {
		return true;
	},
}, 1, 60000);
