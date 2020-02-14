import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { RocketChatFile } from '../../../file';
import { FileUpload } from '../../../file-upload';
import { Rooms } from '../../../models';
import { Notifications } from '../../../notifications';

export const setRoomAvatar = function(room, dataURI, contentType, service) {
	let encoding;
	let image;
	let roomName = `@${room.name}`; //am i setting the correct room name??
	//let roomName = room.name; //am i setting the correct room name??

	if (service === 'initials') {
		return Rooms.setAvatarOrigin(room._id, service);
	} if (service === 'url') {
		let result = null;

		try {
			result = HTTP.get(dataURI, { npmRequestOptions: { encoding: 'binary', rejectUnauthorized: false } });
		} catch (error) {
			if (!error.response || error.response.statusCode !== 404) {
				console.log(`Error while handling the setting of the avatar from a url (${ dataURI }) for ${ roomName }:`, error);
				throw new Meteor.Error('error-avatar-url-handling', `Error while handling avatar setting from a URL (${ dataURI }) for ${ roomName }`, { function: 'RocketChat.setRoomAvatar', url: dataURI, username: roomName });
			}
		}

		if (result.statusCode !== 200) {
			console.log(`Not a valid response, ${ result.statusCode }, from the avatar url: ${ dataURI }`);
			throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${ dataURI }`, { function: 'RocketChat.setRoomAvatar', url: dataURI });
		}

		if (!/image\/.+/.test(result.headers['content-type'])) {
			console.log(`Not a valid content-type from the provided url, ${ result.headers['content-type'] }, from the avatar url: ${ dataURI }`);
			throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${ dataURI }`, { function: 'RocketChat.setRoomAvatar', url: dataURI });
		}

		encoding = 'binary';
		image = result.content;
		contentType = result.headers['content-type'];
	} else if (service === 'rest') {
		encoding = 'binary';
		image = dataURI;
	} else {
		const fileData = RocketChatFile.dataURIParse(dataURI);
		encoding = 'base64';
		image = fileData.image;
		contentType = fileData.contentType;
	}

	const buffer = new Buffer(image, encoding);
	const fileStore = FileUpload.getStore('Avatars');
	fileStore.deleteByName(roomName);

	const file = {
		userId: room._id,
		//for now, set roomId as well...change later if needed
		roomId: room._id,
		type: contentType,
		size: buffer.length,
	};

	fileStore.insert(file, buffer, () => {
		Meteor.setTimeout(function() {
			Rooms.setAvatarOrigin(room._id, service);
			Notifications.notifyLogged('updateAvatar', { username: roomName });
		}, 500);
	});
};
