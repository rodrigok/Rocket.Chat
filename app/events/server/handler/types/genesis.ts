import { RoomEvents, Rooms } from '../../../../models/server';
import { IAddEventResult } from '../../../../models/server/models/Events';
import { IEDataGenesis } from '../../../definitions/data/IEDataGenesis';
import { IEvent } from '../../../definitions/IEvent';
// import { normalizers } from '../../../../federation/server/normalizers';

module.exports = async <T extends IEDataGenesis>(event: IEvent<T>): Promise<IAddEventResult> => {
	const eventResult = await RoomEvents.addRoomEvent(event);

	// If the event was successfully added, handle the event locally
	if (eventResult.success) {
		const { d: { room } } = event;

		// Check if room exists
		const persistedRoom = Rooms.findOne({ _id: room._id });

		if (persistedRoom) {
			// Update the federation
			Rooms.update({ _id: persistedRoom._id }, { $set: { federation: room.federation } });
		} else {
			// // Denormalize room
			// const denormalizedRoom = normalizers.denormalizeRoom(room);
			//
			// // Create the room
			// Rooms.insert(denormalizedRoom);
		}
	}

	return eventResult;
};
