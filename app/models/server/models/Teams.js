import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { Base } from './_Base';

export class Teams extends Base {
    constructor(...args) {
        super(...args);

        this.tryEnsureIndex({ name: 1, creator: 1 }, { unique: true });
        this.tryEnsureIndex({ default: 1 });
    }

    findAll(){
        return this._db.find();
    }

    findMyTeams(user) {
        return this._db.find({
            $or: [{
                owner: {
                    $elemMatch: { _id: user._id }
                }
                }, {
                    members: {
                        $elemMatch: { _id: user._id }
                    }
                }]
            });
    }

    /**
     * Add a user to team.
     * @param {*} user Array of user objects
     * @param {*} team_id ID for team
     */
    addUsersToTeam(user, team_id) {
        const query = {
            _id: team_id,
        };

        let update = {
            $push: {
                members: { $each: user }
            }
        };
        let result = this.update(query, update);
        return result;
    }

    /**
     * Remove a user from team.
     * @param {*} user User object
     * @param {*} team_id ID for team
     */
    removeUserFromTeam(user, team_id) {
        const query = {
            _id: team_id,
        };

        let update = {
            $pull: {
                members: {
                    _id: user._id
                }
            }
        };
        return this.update(query, update);
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
