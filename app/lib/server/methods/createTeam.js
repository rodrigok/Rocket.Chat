import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../authorization';
import { createRoom } from '../functions';

Meteor.methods({
	createTeam(name, members, readOnly = false, customFields = {}, extraData = {}, avatar = null) {
		check(name, String);
		check(members, Match.Optional([String]));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createTeam' });
		}

		if (!hasPermission(Meteor.userId(), 'create-c')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createTeam' });
		}
		return createTeam('c', name, Meteor.user() && Meteor.user().username, members, readOnly, { customFields, ...extraData }, {}, avatar);
	},
});
