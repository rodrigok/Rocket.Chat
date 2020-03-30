import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Blaze } from 'meteor/blaze';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { Deps } from 'meteor/deps';
import toastr from 'toastr';

import { settings } from '../../../../settings';
import { t } from '../../../../utils';
import { AutoComplete } from '../../../../meteor-autocomplete/client';

const acEvents = {
	'click .rc-popup-list__item'(e, t) {
		t.ac.onItemClick(this, e);
	},
	'keydown [name="users"]'(e, t) {
		if ([8, 46].includes(e.keyCode) && e.target.value === '') {
			const users = t.selectedUsers;
			const usersArr = users.get();
			usersArr.pop();
			return users.set(usersArr);
		}

		t.ac.onKeyDown(e);
	},
	'keyup [name="users"]'(e, t) {
		t.ac.onKeyUp(e);
	},
	'focus [name="users"]'(e, t) {
		t.ac.onFocus(e);
	},
	'blur [name="users"]'(e, t) {
		t.ac.onBlur(e);
	},
};

const filterNames = (old) => {
	if (settings.get('UI_Allow_room_names_with_special_chars')) {
		return old;
	}

	const reg = new RegExp(`^${ settings.get('UTF8_Names_Validation') }$`);
	return [...old.replace(' ', '').toLocaleLowerCase()].filter((f) => reg.test(f)).join('');
};

Template.addUserToTeam.helpers({
	disabled() {
		return Template.instance().selectedUsers.get().length === 0;
	},
	tAddUsers() {
		return t('Add_users');
	},
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		return typeof param === 'function' ? param.apply(instance.ac) : param;
	},
	items() {
		return Template.instance().ac.filteredList();
	},
	config() {
		const filter = Template.instance().userFilter.get();
		return {
			filter,
			noMatchTemplate: 'userSearchEmpty',
			modifier(text) {
				const f = filter;
				return `@${ f.length === 0 ? text : text.replace(new RegExp(filter), function(part) {
					return `<strong>${ part }</strong>`;
				}) }`;
			},
		};
	},
	selectedUsers() {
		return Template.instance().selectedUsers.get();
	},
});

Template.addUserToTeam.events({

	...acEvents,
	'click .rc-tags__tag'({ target }, t) {
		const { username } = Blaze.getData(target);
		t.selectedUsers.set(t.selectedUsers.get());
	},
	'click .rc-tags__tag-icon'(e, t) {
		const { username } = Blaze.getData(t.find('.rc-tags__tag-text'));
		t.selectedUsers.set(t.selectedUsers.get());
	},
	'input [name="users"]'(e, t) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const { length } = input.value;
		const modified = filterNames(input.value);
		input.value = modified;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length);

		t.userFilter.set(modified);
	},
	'click .js-add'(e, instance) {
		let users = instance.selectedUsers.get();
		users.forEach((user) => { delete user.status });

		Meteor.call('addUsersToTeam', users, this.teamId, this.teamName, function(err) {
			if (err) {
				return toastr.error(err);
			}
			toastr.success(t('Users_added'));
			instance.selectedUsers.set([]);
		});
	},
});

Template.addUserToTeam.onRendered(function() {
	const users = this.selectedUsers;

	this.firstNode.querySelector('[name="users"]').focus();
	this.ac.element = this.firstNode.querySelector('[name="users"]');
	this.ac.$element = $(this.ac.element);
	this.ac.$element.on('autocompleteselect', function(e, { item }) {
		const usersArr = users.get();
		usersArr.push(item);
		users.set(usersArr);
	});
});

Template.addUserToTeam.onCreated(function() {
	this.selectedUsers = new ReactiveVar([]);
	const filter = { exceptions: [].concat(this.selectedUsers.get().map((u) => u.username)) };
	Deps.autorun(() => {
		filter.exceptions = [].concat(this.selectedUsers.get().map((u) => u.username));
	});
	this.userFilter = new ReactiveVar('');

	this.ac = new AutoComplete({
		selector: {
			anchor: '.rc-input__label',
			item: '.rc-popup-list__item',
			container: '.rc-popup-list__list',
		},
		position: 'fixed',
		limit: 10,
		inputDelay: 300,
		rules: [
			{
				// @TODO maybe change this 'collection' and/or template
				collection: 'UserAndRoom',
				endpoint: 'users.autocomplete',
				field: 'username',
				matchAll: true,
				filter,
				doNotChangeWidth: false,
				selector(match) {
					return { term: match };
				},
				sort: 'username',
			},
		],
	});
	this.ac.tmplInst = this;
});
