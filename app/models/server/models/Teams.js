import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { Base } from './_Base';

export class Teams extends Base {
    constructor(...args) {
        super(...args);

        this.tryEnsureIndex({ name: 1 }, { unique: true, sparse: true });
        this.tryEnsureIndex({ default: 1 });
    }

    findAll(){
        return this._db.find();
    }

    findMyTeams(user) {
        return this._db.find({owner: { $elemMatch: { _id: user._id }}});
    }

    findByNameOrNameRegex(searchTerm, options) {
        if (options == null) { options = {}; }
		const termRegex = new RegExp(s.escapeRegExp(searchTerm), 'i');
		const query = {
			name: termRegex,
        };

        return this.find(query, options).fetch();
    }

    addTeam(query) {
        return this.insert(query);
    }
}

export default new Teams('teams', true);
