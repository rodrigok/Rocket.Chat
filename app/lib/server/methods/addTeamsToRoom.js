import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { Rooms, Subscriptions, Users, Teams } from '../../../models';
//import { Teams } from '../../../models/server/raw'
import { hasPermission } from '../../../authorization';
import { addTeamUserToRoom } from '../functions';
import { Notifications } from '../../../notifications';

Meteor.methods({
	addTeamsToRoom(data = {}) {
		// Validate user and room
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addTeamsToRoom',
			});
		}

		if (!Match.test(data.rid, String)) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'addTeamsToRoom',
			});
		}

		// Get user and room details
		const room = Rooms.findOneById(data.rid);
		const userId = Meteor.userId();
		const subscription = Subscriptions.findOneByRoomIdAndUserId(data.rid, userId, { fields: { _id: 1 } });
		const userInRoom = subscription != null;

		// Can't add to direct room ever
		if (room.t === 'd') {
			throw new Meteor.Error('error-cant-invite-for-direct-room', 'Can\'t invite user to direct rooms', {
				method: 'addTeamsToRoom',
			});
		}

		// Can add to any room you're in, with permission, otherwise need specific room type permission
		let canAddUser = false;
		if (userInRoom && hasPermission(userId, 'add-user-to-joined-room', room._id)) {
			canAddUser = true;
		} else if (room.t === 'c' && hasPermission(userId, 'add-user-to-any-c-room')) {
			canAddUser = true;
		} else if (room.t === 'p' && hasPermission(userId, 'add-user-to-any-p-room')) {
			canAddUser = true;
		}

		// Adding wasn't allowed
		if (!canAddUser) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'addTeamsToRoom',
			});
		}

		// Missing the users to be added
		if (!Array.isArray(data.teams)) {
			throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
				method: 'addTeamsToRoom',
			});
		}

		// For each team, validate each user, then add to room
		const user = Meteor.user();
		const teams = data.teams;
		teams.forEach((teamname) => {
			team = Teams.findByNameOrNameRegex(teamname, {})[0];
			
			if (!team) {
				// TODO: fix error message.
				throw new Meteor.Error('error-invalid-username', 'Invalid username', {
					method: 'addTeamsToRoom',
				});
			}
			const members = team.members;
			members.forEach((user) => {
				const newUser = Users.findOneByUsernameIgnoringCase(user.username);
				const subscription = Subscriptions.findOneByRoomIdAndUserId(data.rid, newUser._id);
				if (!subscription) {
					addTeamUserToRoom(data.rid, newUser, user, teamname);
				} else {
					Notifications.notifyUser(userId, 'message', {
						_id: Random.id(),
						rid: data.rid,
						ts: new Date(),
						msg: TAPi18n.__('Username_is_already_in_here', {
							postProcess: 'sprintf',
							sprintf: [newUser.username],
						}, user.language),
					});
				}
			})
		});

		return true;
	},
});
