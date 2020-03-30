import toastr from 'toastr';

export const getActions = ({ user, directActions, hideAdminControls }) => {
    const canRemove = () => {};

    const getUser = function getUser(fn, ...args) {
		user.team = this.data.teamId;
		const inst = this.view;
		if (!user) {
			return;
		}
		return fn.apply(this, [user, inst, ...args]);
	};

	const prevent = (fn, ...args) => function(e, { instance }) {
		e.stopPropagation();
		e.preventDefault();
		return fn.apply(instance, args);
    };
    
    const success = (fn) => function(error, result) {
		if (error) {
			return handleError(error);
		}
		if (result) {
			fn.call(this, result);
		}
	};

    const actions = [
        {
            group: 'channel',
			icon: 'sign-out',
			modifier: 'alert',
			name: 'Remove from team',
			action: prevent(getUser, ({ username, team, inst }) => {
				Meteor.call('removeUserFromTeam', user, team, success(() => toastr.success('This worked!')));
				//instance.onRendered();
            }),
			condition: true,
		}
    ]
    return actions;
};