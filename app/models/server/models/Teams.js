import { Meteor } from 'meteor/meteor';

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

    addTeam(query) {
        return this.insert(query);
    }
}

export default new Teams('teams', true);