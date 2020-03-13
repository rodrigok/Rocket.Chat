import toastr from 'toastr';

export const getActions = ({ user, directActions, hideAdminControls }) => {
    const canRemove = () => {};

    const getUser = function getUser(fn, ...args) {
		if (!user) {
			return;
		}
		return fn.apply(this, [user, ...args]);
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
			action: prevent(getUser, ({ username }) => {
                const rid = Session.get('openedRoom');
                Meteor.call('unmuteUserInRoom', { rid, username }, success(() => toastr.success('This worked!')));
            }),
			condition: true,
		}
    ]
    return actions;
};