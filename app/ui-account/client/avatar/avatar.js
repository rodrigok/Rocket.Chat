import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import { getUserAvatarURL } from '../../../utils/lib/getUserAvatarURL';
import { getAvatarURL } from '../../../utils/lib/getAvatarURL';

Template.avatar.helpers({
	src() {
		const { url } = Template.instance().data;
		if (url) {
			return url;
		}

		let { username } = this;
		if (username == null && this.userId != null) {
			const user = Meteor.users.findOne(this.userId);
			username = user && user.username;
		}
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
});
