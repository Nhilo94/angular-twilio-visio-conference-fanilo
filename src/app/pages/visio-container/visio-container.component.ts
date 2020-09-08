import {
  Component,
  OnInit,
  ElementRef,
  ComponentFactoryResolver,
  EmbeddedViewRef,
  Injector,
  ApplicationRef,
} from '@angular/core';
import { VideoDataService } from '../../services/video-data.service';
import { SelectMediaService } from '../../services/select-media.service';
import { connect, createLocalVideoTrack } from 'twilio-video';
import { PreviewParticipantsComponent } from 'src/app/components/preview-participants/preview-participants.component';

@Component({
  selector: 'app-visio-container',
  templateUrl: './visio-container.component.html',
  styleUrls: ['./visio-container.component.scss'],
})
export class VisioContainerComponent implements OnInit {
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
  private _ref = [];

  constructor(
    private httpVideo: VideoDataService,
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector,
    private selectMedia: SelectMediaService,
    private appRef: ApplicationRef,
    private elRef: ElementRef,
  ) {}

  async ngOnInit(): Promise<void> {
    if (this.isMobile) {
      this.connectOptions.bandwidthProfile.video[
        'maxSubscriptionBitrate'
      ] = 2500000;
    }

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

    this.httpVideo.initCall('fanilo-' + Date.now()).subscribe((res: any) => {
      // Add the specified audio device ID to ConnectOptions.
      this.connectOptions.audio = { deviceId: { exact: this.deviceIds.audio } };

      // Add the specified Room name to ConnectOptions.
      this.connectOptions.name = 'vitasoft';

      // Add the specified video device ID to ConnectOptions.
      this.connectOptions.video.deviceId = { exact: this.deviceIds.video };

      // Join the Room.
      this.joinRoom(res.token, this.connectOptions);
    });
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
    let localVideoTrack: any = Array.from(
      room.localParticipant.videoTracks.values(),
    )[0]['track'];

    // Make the Room available in the JavaScript console for debugging.
    window['room'] = room;

    // Handle the LocalParticipant's media.
    this.participantConnected(room.localParticipant, room);

    // Subscribe to the media published by RemoteParticipants already in the Room.
    room.participants.forEach((participant) => {
      this.participantConnected(participant, room);
    });

    // Subscribe to the media published by RemoteParticipants joining the Room later.
    room.on('participantConnected', (participant) => {
      this.participantConnected(participant, room);
    });
  }

  /**
   * Handle the Participant's media.
   * @param participant - the Participant
   * @param room - the Room that the Participant joined
   */
  participantConnected(participant, room) {
    // Set up the Participant's media container.
    // setupParticipantContainer(participant, room);
    // Create a component reference from the component
    const componentRef: any = this.componentFactoryResolver
      .resolveComponentFactory(PreviewParticipantsComponent)
      .create(this.injector);
    /* Add somithing in app input */
    // componentRef.instance.indexElts = index_[0];
    componentRef.instance.room = room;
    componentRef.instance.participant = participant;

    /** ADD LISTENER TO COMPONENT OUTPUT */
    // componentRef.instance.outputQSection.subscribe((data) => {});
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
      '#participantPreview',
    );
    eltsAttach.appendChild(domElem);

    /** Save components elts Ref */
    this._ref.push(componentRef);
  }
}
