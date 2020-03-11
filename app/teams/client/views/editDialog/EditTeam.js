import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import './EditTeam.html';

function teamSearch(user, teamName, cb) {
    return Meteor.call('searchTeams', teamName, (err, result) => {
        cb(result);
        return result;
    });
}

Template.EditTeam.helpers({
    getTeamOwner() {
        return this.teamOwner.get();
    },
    getTeamMembers() {
        return this.teamMembers.get();
    }
});

Template.EditTeam.onRendered(function () {
    this.autorun(() => {
        let name;
        teamSearch(Meteor.user()._id, this.data.teamName, (results) => {
            team = results.results[0];
            this.data.teamOwner.set(team.owner);
            this.data.teamMembers.set(team.members);
            this.data.teamUsercount = team.usersCount;
            this.data.teamId = team._id;
        });
    });
});

Template.EditTeam.onCreated(function(){
    this.data.teamId = new ReactiveVar('');
    this.data.teamOwner = new ReactiveVar('');
    this.data.teamUsercount = new ReactiveVar(0);
    this.data.teamMembers = new ReactiveVar([]);
});