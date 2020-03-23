import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import { addTeamUserToRoom } from '../../../lib/server/functions'
import { removeUserFromRoom } from '../../../lib/server/functions/removeUserFromRoom';
import { Subscriptions } from '../../../models'
import Teams from '../../../models/server/models/Teams'

Meteor.methods({
		/**
		* Create team
		* @constructor
		* @param {string} owner - User that owns team
		* @param {string} t_name - Name of the team
		* @param {string[]} users - Users to be added
		*/
		createTeam({ owner, t_name, users }) {
			const team = {
				name: t_name,
				creator: owner,
				owner: [owner],
				members: users,
				usersCount: users.length,
				ts: new Date(),
			}
			Teams.addTeam(team)
			return 'Success'
		},
		searchTeams(t_name) {
			const query = {
				name: t_name
			}
			result = Teams.find(query);
			return {
				total: result.count(),
				results: result.fetch()
			};
		},
		addUsersToTeam(users, team_id, team_name) {
			Teams.addUsersToTeam(users, team_id);
			roomIds = Subscriptions.findRoomIdsByTeam(team_id);
			users.forEach((user) => {
				roomIds.forEach((rid) => {
					const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, user._id);
					if (!subscription) {
						let team = { 
							_id: team_id, 
							name: team_name
						}
						addTeamUserToRoom(rid, user, team);
					//} else {
						// Do we want to notify when a user is already in a room?
						// Notifications.notifyUser(userId, 'message', {
						// 	_id: Random.id(),
						// 	rid: rid,
						// 	ts: new Date(),
						// 	msg: TAPi18n.__('Username_is_already_in_here', {
						// 		postProcess: 'sprintf',
						// 		sprintf: [user.username],
						// 	}, user.language),
						// });
					}
				});
			});
			return 'success';
		},
		removeUserFromTeam(user, team_id) {
			Teams.removeUserFromTeam(user, team_id);
			roomIds = Subscriptions.findRoomIdsByTeam(team_id);
			roomIds.forEach((rid) => {
				removeUserFromRoom(rid, user);
			})
			return 'success';
		}
	}
)