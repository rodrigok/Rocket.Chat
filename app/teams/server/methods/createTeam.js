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
					let team = { 
						_id: team_id, 
						name: team_name
					}
					addTeamUserToRoom(rid, user, user, team);
				});
			});
			return 'success';
		},
		removeUserFromTeam(user, team_id) {
			Teams.removeUserFromTeam(user, team_id);
			roomIds = Subscriptions.findRoomIdsByTeam(team_id);
			roomIds.forEach((rid) => {
				const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, user._id);
				if (subscription.team.filter(e => e._id === team_id).length > 0) {
					let newTeamField = subscription.team;
					removeUserFromRoom(rid, user);
					newTeamField.splice(newTeamField.map(e => e._id).indexOf(team_id), 1);
					Subscriptions.updateTeamField(subscription._id, newTeamField);
				}
			});
			return 'success';
		},
		removeTeamFromChannel(rid, team) {}
	}
)