import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
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
			my_response = {
				total: result.count(),
				results: result.fetch()
			};
			return {
				total: result.count(),
				results: result.fetch()
			};
		}
	}
)