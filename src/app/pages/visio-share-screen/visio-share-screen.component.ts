import {
  Component,
  OnInit,
  ComponentFactoryResolver,
  Injector,
  ApplicationRef,
  ElementRef,
  EmbeddedViewRef,
} from '@angular/core';
import { VideoDataService } from 'src/app/services/video-data.service';
import { SelectMediaService } from 'src/app/services/select-media.service';
import { connect, createLocalVideoTrack, LocalDataTrack } from 'twilio-video';
import { ChatDataService } from 'src/app/services/chat-data.service';
import { MessageUnitComponent } from 'src/app/components/message-unit/message-unit.component';

@Component({
  selector: 'app-visio-share-screen',
  templateUrl: './visio-share-screen.component.html',
  styleUrls: ['./visio-share-screen.component.scss'],
})
export class VisioShareScreenComponent implements OnInit {
  credentials = { room: '', indentity: '' };
  hasCredentials = false;
  // ConnectOptions settings for a video web application.
  connectOptions: { [key: string]: any } = {
    // Available only in Small Group or Group Rooms only. Please set "Room Type"
    // to "Group" or "Small Group" in your Twilio Console:
    // https://www.twilio.com/console/video/configure
    bandwidthProfile: {
      video: {
        dominantSpeakerPriority: 'high',
        mode: 'collaboration',
        renderDimensions: {
          high: { height: 720, width: 1280 },
          standard: { height: 90, width: 160 },
        },
      },
    },

    // Available only in Small Group or Group Rooms only. Please set "Room Type"
    // to "Group" or "Small Group" in your Twilio Console:
    // https://www.twilio.com/console/video/configure
    dominantSpeaker: true,

    // Comment this line to disable verbose logging.
    logLevel: 'debug',

    // Comment this line if you are playing music.
    maxAudioBitrate: 16000,

    // VP8 simulcast enables the media server in a Small Group or Group Room
    // to adapt your encoded video quality for each RemoteParticipant based on
    // their individual bandwidth constraints. This has no utility if you are
    // using Peer-to-Peer Rooms, so you can comment this line.
    preferredVideoCodecs: [{ codec: 'VP8', simulcast: true }],

    // Capture 720p video @ 24 fps.
    video: { height: 720, frameRate: 24, width: 1280 },
  };

  title = 'video-front';
  isMobile = false;
  deviceIds: { audio: any; video: any };

  currentRoom: any;
  activeParticipant: any;
  hasActive = false;
  heightPreview = 'big';
  all_participant = [];
  token = '';
  localDataTrack: any;
  private _ref = [];
  messageTosent = '';
  shareOn = false;
  videoStatus = 'disable';
  audioStatus = 'mute';
  audioMuted = false;
  videoMuted = false;
  trackScreen: any;
  localVideoTrack: any;
  sharingText = 'Share';

  constructor(
    private httpVideo: VideoDataService,
    private componentFactoryResolver: ComponentFactoryResolver,
    private selectMedia: SelectMediaService,
    private elRef: ElementRef,
    private injector: Injector,
    private chtServce: ChatDataService,
    private appRef: ApplicationRef,
  ) {}

  async ngOnInit(): Promise<void> {
    if (this.isMobile) {
      this.connectOptions.bandwidthProfile.video[
        'maxSubscriptionBitrate'
      ] = 2500000;
    }
  }

  /**
   * Join a Room.
   * @param token - the AccessToken used to join a Room
   * @param connectOptions - the ConnectOptions used to join a Room
   */
  async joinRoom(token, connectOptions) {
    // Join to the Room with the given AccessToken and ConnectOptions.
    const room: any = await connect(token, connectOptions);

    // Save the LocalVideoTrack.
    this.localVideoTrack = Array.from(
      room.localParticipant.videoTracks.values(),
    )[0]['track'];

    console.log('localVideo track');
    console.log(this.localVideoTrack);
    // Make the Room available in the JavaScript console for debugging.
    window['room'] = room;

    /* let localDataTrack = await this.chtServce.connectToRoomWithDataTrack(
      this.token,
      this.credentials.room,
      ); */

    // Once the Data Track has been published, set the P1localDataTrack for use
    room.localParticipant.on('trackPublished', (publication) => {
      if (publication.track.kind === 'data') {
        this.localDataTrack = publication.track;
      }
    });

    const localDataTrack = new LocalDataTrack({
      name: 'chat',
    });
    room.localParticipant.publishTrack(localDataTrack);

    // Handle the LocalParticipant's media.
    this.participantConnected(room.localParticipant);

    this.currentRoom = room;
    this.activeParticipant = room.localParticipant;
    this.hasActive = true;

    console.log('Room Data');
    console.log(room);

    // Subscribe to the media published by RemoteParticipants already in the Room.
    room.participants.forEach((participant) => {
      this.participantConnected(participant);
      this.subscribeMessageParticipant(participant);
    });

    room.on('trackSubscribed', (track, publication, participant) => {
      if (track.kind === 'data' && track.name === 'chat') {
        track.on('message', (msg) => {
          this.onMessageReceived(msg, participant);
        });
      }
    });

    // Subscribe to the media published by RemoteParticipants joining the Room later.
    room.on('participantConnected', (participant) => {
      this.participantConnected(participant);
      this.subscribeMessageParticipant(participant);
    });
  }

  /**
   * Handle the Participant's media.
   * @param participant - the Participant
   * @param room - the Room that the Participant joined
   */
  participantConnected(participant) {
    this.all_participant.push(participant);
  }

  async saveCredentials() {
    if (this.credentials.indentity !== '' && this.credentials.room !== '') {
      await this.selectMediaDevices();
      this.httpVideo
        .initCall(this.credentials.indentity)
        .subscribe((res: any) => {
          // Add the specified audio device ID to ConnectOptions.
          this.connectOptions.audio = {
            deviceId: { exact: this.deviceIds.audio },
          };

          // Add the specified Room name to ConnectOptions.
          this.connectOptions.name = this.credentials.room;

          // Add the specified video device ID to ConnectOptions.
          this.connectOptions.video.deviceId = { exact: this.deviceIds.video };
          this.token = res.token;
          // Join the Room.
          this.hasCredentials = true;
          this.joinRoom(res.token, this.connectOptions);
        });
    }
  }

  async selectMediaDevices() {
    // On mobile browsers, there is the possibility of not getting any media even
    // after the user has given permission, most likely due to some other app reserving
    // the media device. So, we make sure users always test their media devices before
    // joining the Room. For more best practices, please refer to the following guide:
    // https://www.twilio.com/docs/video/build-js-video-application-recommendations-and-best-practices
    this.deviceIds = {
      audio: this.isMobile ? null : localStorage.getItem('audioDeviceId'),
      video: this.isMobile ? null : localStorage.getItem('videoDeviceId'),
    };

    if (this.deviceIds.audio === null) {
      this.deviceIds.audio = await this.selectMedia.selectMedia(
        'audio',
        (str) => {
          console.log(str);
        },
      );
    }

    if (this.deviceIds.video === null) {
      try {
        this.deviceIds.video = await this.selectMedia.selectMedia(
          'video',
          async (stream) => {
            // console.log('Stream response');
            // console.log(stream);
            // const videoElement = this.elRef.nativeElement.querySelector(
            //   'video',
            // );
            // videoElement.srcObject = stream;
          },
        );
      } catch (error) {
        console.log('erreur');
        return;
      }
    }
  }

  subscribeMessageParticipant(participant) {
    participant.dataTracks.forEach((publication) => {
      if (publication.isSubscribed && publication.trackName === 'chat') {
        publication.track.on('message', (msg) => {
          this.onMessageReceived(msg, participant);
        });
      }
    });
  }

  public onMessageReceived(message: any, participant: any) {
    // Set up the Participant's media container.
    // setupParticipantContainer(participant, room);
    // Create a component reference from the component

    const componentRef: any = this.componentFactoryResolver
      .resolveComponentFactory(MessageUnitComponent)
      .create(this.injector);
    /* Add somithing in app input */
    // componentRef.instance.indexElts = index_[0];
    componentRef.instance.message = message;
    componentRef.instance.participant = participant;

    /** ADD LISTENER TO COMPONENT OUTPUT */
    /* componentRef.instance.select_active.subscribe((data) => {
      this.hasActive = false;
      this.activeParticipant = data;
      setTimeout(() => {
        this.hasActive = true;
      }, 200);
    }); */
    // componentRef.instance.edit_status.subscribe(data => {
    //   this.in_edit.emit(data.in_edit);
    // });

    // Attach component to the appRef so that it's inside the ng component tree
    this.appRef.attachView(componentRef.hostView);

    // Get DOM element from component
    const domElem = (componentRef.hostView as EmbeddedViewRef<any>)
      .rootNodes[0] as HTMLElement;

    // Append DOM element to the body
    const eltsAttach: HTMLElement = this.elRef.nativeElement.querySelector(
      '#chatContainer',
    );
    eltsAttach.appendChild(domElem);

    /** Save components elts Ref */
    this._ref.push(componentRef);
  }

  sendMessage() {
    if (this.messageTosent !== '') {
      this.localDataTrack.send(this.messageTosent);
      this.onMessageReceived(this.messageTosent, this.activeParticipant);
      this.messageTosent = '';
    }
  }

  async startSharing() {
    if (!this.shareOn) {
      this.trackScreen = await this.selectMedia.createScreenTrack(720, 1280);
      this.trackScreen.once('stopped', () => {
        this.currentRoom.localParticipant.unpublishTrack(this.trackScreen);
      });
      this.currentRoom.localParticipant.publishTrack(this.trackScreen);
      this.sharingText = 'Stop share screen';
    } else {
      this.trackScreen.stop();
      this.trackScreen = null;
      this.sharingText = 'Share screen';
      this.localVideoTrack.restart();
    }
    this.shareOn = !this.shareOn;
  }

  actOnVideo() {
    if (this.videoMuted) {
      this.videoStatus = 'disable';
      this.muteOrUnmuteYourMedia(this.currentRoom, 'video', 'unmute');
    } else {
      this.videoStatus = 'enable';
      this.muteOrUnmuteYourMedia(this.currentRoom, 'video', 'mute');
    }
    this.videoMuted = !this.videoMuted;
  }

  actOnAudio() {
    if (this.audioMuted) {
      this.audioStatus = 'mute';
      this.muteOrUnmuteYourMedia(this.currentRoom, 'audio', 'unmute');
    } else {
      this.audioStatus = 'unmute';
      this.muteOrUnmuteYourMedia(this.currentRoom, 'audio', 'mute');
    }
    this.audioMuted = !this.audioMuted;
  }

  muteOrUnmuteYourMedia(room, kind, action) {
    const publications =
      kind === 'audio'
        ? room.localParticipant.audioTracks
        : room.localParticipant.videoTracks;

    publications.forEach((publication) => {
      if (action === 'mute') {
        publication.track.disable();
      } else {
        publication.track.enable();
      }
    });
  }
}
