import { Injectable } from '@angular/core';
import { LocalDataTrack, connect } from 'twilio-video';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatDataService {
  private loadingMessage = new BehaviorSubject<Object>({});
  /** Observable */
  messageNotifier$ = this.loadingMessage.asObservable();
  constructor() {}

  /**
   * Connect to the given Room with a LocalDataTrack.
   * @param {string} token - AccessToken for joining the Room
   * @returns {CancelablePromise<Room>}
   */
  async connectToRoomWithDataTrack(token, roomName) {
    const localDataTrack = new LocalDataTrack({
      name: 'chat',
    });

    const room = await connect(token, {
      name: roomName,
      tracks: [localDataTrack],
    });

    return { room: room, dataTrack: localDataTrack };
  }

  /**
   * Send a chat message using the given LocalDataTrack.
   * @param {LocalDataTrack} dataTrack - The {@link LocalDataTrack} to send a message on
   * @param {string} message - The message to be sent
   */
  sendChatMessage(dataTrack, message) {
    dataTrack.send(message);
  }

  /**
   * Receive chat messages from RemoteParticipants in the given Room.
   * @param {Room} room - The Room you are currently in
   * @param {Function} onMessageReceived - Updates UI when a message is received
   */
  receiveChatMessages(room) {
    room.participants.forEach((participant) => {
      participant.dataTracks.forEach((publication) => {
        if (publication.isSubscribed && publication.trackName === 'chat') {
          publication.track.on('message', (msg) => {
            this.onMessageReceived(msg, participant);
          });
        }
      });
    });

    room.on('trackSubscribed', (track, publication, participant) => {
      if (track.kind === 'data' && track.name === 'chat') {
        track.on('message', (msg) => {
          this.onMessageReceived(msg, participant);
        });
      }
    });
  }

  public onMessageReceived(message: any, participant: any) {
    this.loadingMessage.next({ message: message, participant: participant });
  }
}
