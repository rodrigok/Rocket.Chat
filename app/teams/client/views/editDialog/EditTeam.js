import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { popover, modal } from '../../../../ui-utils';
import { isRtl } from '../../../../utils';
import { getActions } from './userActions';
import { Subscriptions } from '../../../../models'

import './EditTeam.html';

function teamSearch(user, teamId, cb) {
    return Meteor.call('searchTeams', teamId, (err, result) => {
        cb(result);
        return result;
    });
}

function hasPermission(){
    return hasPermission('create-invite-links', this._id);
}

Template.EditTeam.helpers({
	ignored() {
		const { user } = this;
		const sub = Subscriptions.findOne({ rid: Session.get('openedRoom') });
		return sub && sub.ignored && sub.ignored.indexOf(user._id) > -1 ? `(${ t('Ignored') })` : '';
	},
    getTeamOwner() {
        return this.teamOwner.get();
    },
    getTeamMembers() {
        return this.teamMembers.get();
    },
    users() {
        return this.teamMembers.map((user) => {
            return {
                user,
                username,
            }
        });
    },
    total() {
        return 2;
    },
    totalShowing() {
        return 2;
    },
    totalOnline() {
        return 1;
    },
	displayName() {
		if (settings.get('UI_Use_Real_Name') && this.user.name) {
			return this.user.name;
		}

		return this.user.username;
    },
    utcOffset() {
        return "";
    },
	canInviteUser() {
        //return hasPermission('create-invite-links', this._id);
        return true;
	},
	canEditTeam() {
		if (this.canEdit) {
			return true;
		} else {
			return false;
		}
	}
});

Template.EditTeam.events({
    'click .js-more'(e, instance) {
        e.currentTarget.parentElement.classList.add('active');
		const room = Session.get(`roomData${ instance.data.rid }`);
		const _actions = getActions({
			user: this.user,
			team: instance.data.teamId,
			hideAdminControls: false,
			directActions: false,
		});
		const groups = [];
		const columns = [];
		const admin = _actions.filter((action) => action.group === 'admin');
		const others = _actions.filter((action) => !action.group);
		const channel = _actions.filter((actions) => actions.group === 'channel');
		if (others.length) {
			groups.push({ items: others });
		}
		if (channel.length && this.user._id !== Meteor.userId() && instance.data.canEdit) {
			groups.push({ items: channel });
		}

		if (admin.length) {
			groups.push({ items: admin });
		}
		columns[0] = { groups };

		$(e.currentTarget).blur();
		e.preventDefault();
		const config = {
			columns,
			mousePosition: () => ({
				x: e.currentTarget.getBoundingClientRect().right + 10,
				y: e.currentTarget.getBoundingClientRect().bottom + 100,
			}),
			customCSSProperties: () => ({
				top: `${ e.currentTarget.getBoundingClientRect().bottom + 10 }px`,
				left: isRtl() ? `${ e.currentTarget.getBoundingClientRect().left - 10 }px` : undefined,
			}),
			data: {
				rid: this._id,
				username: instance.data.username,
				instance,
			},
			offsetHorizontal: 15,
			activeElement: e.currentTarget,
			currentTarget: e.currentTarget,
			onDestroyed: () => {
				e.currentTarget.parentElement.classList.remove('active');
			},
		};
		e.stopPropagation();
		popover.open(config);
	},
	'click .js-add'(e, instance) {
		modal.open({
			title: 'Add Users',
			content: 'addUserToTeam',
			data: {
				onCreate() {
					modal.close();
				},
				label: 'Invite_Users',
				icon: 'user-plus',
				teamId: instance.data.teamId,
				teamName: instance.data.teamName,
			},
			modifier: 'modal',
			showConfirmButton: false,
			showCancelButton: false,
			confirmOnEnter: false,
		});
	}
});

Template.EditTeam.onRendered(function () {
    this.autorun(() => {
        let name;
        teamSearch(Meteor.user()._id, this.data.teamId, (results) => {
            team = results.results[0];
            this.data.teamOwner.set(team.owner);
            this.data.teamMembers.set(team.members);
            this.data.teamUsercount = team.usersCount;
            this.data.teamId = team._id;
        });
    });
});

Template.EditTeam.onCreated(function(){
    //this.data.teamId = new ReactiveVar('');
    this.data.teamOwner = new ReactiveVar('');
    this.data.teamUsercount = new ReactiveVar(0);
    this.data.teamMembers = new ReactiveVar([]);

    this.autorun(() => {
		if (this.data.rid == null) { return; }
		this.loading.set(true);
		return Meteor.call('getUsersOfRoom', this.data.rid, this.showAllUsers.get(), { limit: 100, skip: 0 }, (error, users) => {
			if (error) {
				console.error(error);
				this.loading.set(false);
			}

			this.users.set(users.records);
			this.total.set(users.total);
			this.loading.set(false);
		});
	});
});