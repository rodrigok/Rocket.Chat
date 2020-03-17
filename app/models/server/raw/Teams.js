import s from 'underscore.string';

import { BaseRaw } from './BaseRaw';

import { Teams } from '..';

export class TeamsRaw extends BaseRaw {
    findByNameOrNameRegex(searchTerm, options) {
        if (options == null) { options = {}; }
		const termRegex = new RegExp(s.escapeRegExp(searchTerm), 'i');
		const query = {
			name: termRegex,
        };
        
        return this.find(query, options);
    }
}