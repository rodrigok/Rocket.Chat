import { API } from '../api';
import { Teams, findTeamsToAutocomplete } from '../lib/teams';

API.v1.addRoute('teams.autocomplete', { authRequired: true }, {
	get() {
		const { selector } = this.queryParams;
		if (!selector) {
			return API.v1.failure('The \'selector\' param is required');
		}

		return API.v1.success(Promise.await(findTeamsToAutocomplete({
			uid: this.userId,
			selector: JSON.parse(selector),
		})));
	},
});