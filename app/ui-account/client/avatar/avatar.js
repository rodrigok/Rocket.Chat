import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import { getUserAvatarURL } from '../../../utils/lib/getUserAvatarURL';
import { getAvatarURL } from '../../../utils/lib/getAvatarURL';

const getUsername = ({ userId, username }) => {
	if (username) {
		return username;
	}

	if (userId) {
		const user = Meteor.users.findOne(userId, { fields: { username: 1 } });
		return user && user.username;
	}
};

Template.avatar.helpers({
	src() {
		const { url } = Template.instance().data;
		if (url) {
			return url;
		}

		let username = getUsername(this);
		if (!username) {
			return;
		}

		Session.get(`avatar_random_${ username }`);

		if (this.roomIcon) {
			//username = `@${ username }`;
			const min = 1;
	    	const max = 1000;
    		const rand = min + Math.random() * (max - min);
    		
			return getAvatarURL({ username: `@${ username }`, cache: rand });
		}

		return getUserAvatarURL(username);
	},

	alt() {
		return getUsername(this);
	},
});
