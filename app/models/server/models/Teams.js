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
        const count = user.length;
        const query = {
            _id: team_id,
        };

        const updateCount = {
            $inc: {
                usersCount: count,
            }
        }

        let update = {
            $push: {
                members: { $each: user }
            }
        };
        let result = this.update(query, update);
        this.update(query, updateCount);

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

        const updateCount = {
            $inc: {
                usersCount: -1,
            }
        }

        let update = {
            $pull: {
                members: {
                    _id: user._id
                }
            }
        };
        const result = this.update(query, update);
        this.update(query, updateCount);
        return result;
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
