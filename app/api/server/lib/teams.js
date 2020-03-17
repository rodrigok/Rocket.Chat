import { Teams } from '../../../models/server/raw';

export async function findTeamsToAutocomplete({ uid, selector }) {
    const options = {
		fields: {
			name: 1,
		},
		sort: {
			name: 1,
		},
		limit: 10,
    };
    
    const teams = await Teams.findByNameOrNameRegex(selector.term, options).toArray();
    return {
        items: teams,
    }
}