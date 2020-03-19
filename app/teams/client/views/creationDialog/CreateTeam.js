import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { AutoComplete } from '../../../../meteor-autocomplete/client';
import { Blaze } from 'meteor/blaze';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import toastr from 'toastr';

import { roomTypes } from '../../../../utils/client';
import { callbacks } from '../../../../callbacks/client';
import { ChatRoom, ChatSubscription } from '../../../../models/client';
import { call } from '../../../../ui-utils/client';

import './CreateTeam.html';

Template.CreateTeam.helpers({
	onSelectUser() {
		return Template.instance().onSelectUser;
	},
	disabled() {
		if (Template.instance().selectParent.get()) {
			return 'disabled';
		}
	},
	createIsDisabled() {
		const { teamName, teamMembers } = Template.instance();
		return teamName.get() && teamMembers.get() ? '' : 'disabled';
	},
	selectedUsers() {
		const myUsername = Meteor.user().username;
		const { message } = this;
		const users = Template.instance().selectedUsers.get().map((e) => e);
		if (message) {
			users.unshift(message.u);
		}
		return users;
	},

	onClickTagUser() {
		return Template.instance().onClickTagUser;
	},
	deleteLastItemUser() {
		return Template.instance().deleteLastItemUser;
	},
	userModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `@${ f.length === 0 ? text : text.replace(new RegExp(filter.get()), (part) => `<strong>${ part }</strong>`) }`;
		};
	},
	nameSuggestion() {
		return Template.instance().teamName.get();
	},
});

Template.CreateTeam.events({
	'input #team_name'(e, t) {
		t.teamName.set(e.target.value);
	},
	'input #users'(e, t) {
		const { value } = e.target;
		t.teamMembers.set(value);
	},
	async 'submit #create-team, click .js-save-team'(event, instance) {
		const owner = {
			_id: Meteor.user()._id,
			name: Meteor.user().name,
			username: Meteor.user().username,
		}
		event.preventDefault();

		const t_name = instance.teamName.get();
		let users = instance.selectedUsers.get();
		users.forEach((u) => delete u.status);

		const result = await call('createTeam', { owner, t_name, users });

		roomTypes.openRouteLink(result.t, result);
	},
});

const suggestName = (msg = '') => msg.substr(0, 140);

Template.CreateTeam.onRendered(function() {
	this.find(this.data.rid ? '#team_name' : '#users').focus();
});

Template.CreateTeam.onCreated(function() {
	const { rid, message: msg } = this.data;
	this.teamName = new ReactiveVar(suggestName(msg && msg.msg));

	this.teamMembers = new ReactiveVar('');

	this.selectedUsers = new ReactiveVar([]);
	this.onSelectUser = ({ item: user }) => {
		if (user.username === (msg && msg.u.username)) {
			return;
		}
		const users = this.selectedUsers.get();
		if (!users.find((u) => user.username === u.username)) {
			this.selectedUsers.set([...users, user]);
		}
	};
	this.onClickTagUser = ({ username }) => {
		this.selectedUsers.set(this.selectedUsers.get().filter((user) => user.username !== username));
	};
	this.deleteLastItemUser = () => {
		const arr = this.selectedUsers.get();
		arr.pop();
		this.selectedUsers.set(arr);
	};

	const { teamName, teamMembers } = callbacks.run('openTeamCreationScreen') || {};

	if (teamMembers) {
		this.teamMembers.set(teamMembers);
	}
});

Template.SearchCreateTeam.helpers({
	list() {
		return this.list;
	},
	items() {
		return Template.instance().ac.filteredList();
	},
	config() {
		const { filter } = Template.instance();
		const { noMatchTemplate, templateItem, modifier } = Template.instance().data;
		return {
			filter: filter.get(),
			template_item: templateItem,
			noMatchTemplate,
			modifier(text) {
				return modifier(filter, text);
			},
		};
	},
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		return typeof param === 'function' ? param.apply(instance.ac) : param;
	},
});

Template.SearchCreateTeam.events({
	'input input'(e, t) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const { length } = input.value;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length);
		t.filter.set(input.value);
	},
	'click .rc-popup-list__item'(e, t) {
		t.ac.onItemClick(this, e);
	},
	'keydown input'(e, t) {
		t.ac.onKeyDown(e);
		if ([8, 46].includes(e.keyCode) && e.target.value === '') {
			const { deleteLastItem } = t;
			return deleteLastItem && deleteLastItem();
		}
	},
	'keyup input'(e, t) {
		t.ac.onKeyUp(e);
	},
	'focus input'(e, t) {
		t.ac.onFocus(e);
	},
	'blur input'(e, t) {
		t.ac.onBlur(e);
	},
	'click .rc-tags__tag'({ target }, t) {
		const { onClickTag } = t;
		return onClickTag & onClickTag(Blaze.getData(target));
	},
});
Template.SearchCreateTeam.onRendered(function() {
	const { name } = this.data;

	this.ac.element = this.firstNode.querySelector(`[name=${ name }]`);
	this.ac.$element = $(this.ac.element);
});

Template.SearchCreateTeam.onCreated(function() {
	this.filter = new ReactiveVar('');
	this.selected = new ReactiveVar([]);
	this.onClickTag = this.data.onClickTag;
	this.deleteLastItem = this.data.deleteLastItem;

	const { collection, endpoint, field, sort, onSelect, selector = (match) => ({ term: match }) } = this.data;
	this.ac = new AutoComplete(
		{
			selector: {
				anchor: '.rc-input__label',
				item: '.rc-popup-list__item',
				container: '.rc-popup-list__list',
			},
			onSelect,
			position: 'fixed',
			limit: 10,
			inputDelay: 300,
			rules: [
				{
					collection,
					endpoint,
					field,
					matchAll: true,
					// filter,
					doNotChangeWidth: false,
					selector,
					sort,
				},
			],

		});
	this.ac.tmplInst = this;
});
