import {
  Component,
  OnInit,
  Input,
  DoCheck,
  ViewChild,
  AfterViewInit,
  ElementRef,
  Output,
  EventEmitter,
} from '@angular/core';

@Component({
  selector: 'app-preview-participants',
  templateUrl: './preview-participants.component.html',
  styleUrls: ['./preview-participants.component.scss'],
})
export class PreviewParticipantsComponent
  implements OnInit, DoCheck, AfterViewInit {
  room_in: any;
  participant_in: any;
  indenty: any;
  sid: any;
  muted: boolean;

  @Input('room') set room(arg) {
    this.room_in = arg;
  }

  @Input('participant') set participant(arg) {
    this.participant_in = arg;
  }

  @Input('size') set size(arg) {
    if (arg && arg === 'big') {
      this.heightElement = 'auto';
    }
  }

  @Output() select_active = new EventEmitter<any>();

  @ViewChild('myPreview', { read: ElementRef, static: false })
  myContainerRef: ElementRef;
  heightElement = '200px';

  constructor() {}

  ngDoCheck(): void {}

  ngOnInit() {
    console.log('Preview Strart here');
  }

  ngAfterViewInit() {
    if (this.room_in && this.participant_in) {
      this.muted =
        this.participant_in === this.room_in.localParticipant ? true : false;
      let mediaElement = this.myContainerRef.nativeElement.querySelector(
        'audio',
      );
      mediaElement.muted = this.muted;
    }
    // Handle the TrackPublications already published by the Participant.
    this.participant_in.tracks.forEach((publication) => {
      if (publication.trackName !== 'chat') {
        this.trackPublished(publication, this.participant_in);
      }
    });

    // Handle theTrackPublications that will be published by the Participant later.
    this.participant_in.on('trackPublished', (publication) => {
      if (publication.trackName !== 'chat') {
        this.trackPublished(publication, this.participant_in);
      }
    });
  }

  /**
   * Handle to the TrackPublication's media.
   * @param publication - the TrackPublication
   * @param participant - the publishing Participant
   */
  trackPublished(publication, participant) {
    // If the TrackPublication is already subscribed to, then attach the Track to the DOM.
    if (publication.track) {
      this.attachTrack(publication.track, participant);
    }

    // Once the TrackPublication is subscribed to, attach the Track to the DOM.
    publication.on('subscribed', (track) => {
      this.attachTrack(track, participant);
    });

    // Once the TrackPublication is unsubscribed from, detach the Track from the DOM.
    publication.on('unsubscribed', (track) => {
      this.detachTrack(track, participant);
    });
  }

  /**
   * Attach a Track to the DOM.
   * @param track - the Track to attach
   * @param participant - the Participant which published the Track
   */
  attachTrack(track, participant) {
    let mediaKind = track.kind;
    let mediaElement = this.myContainerRef.nativeElement.querySelector(
      mediaKind,
    );
    mediaElement.style.opacity = '';
    // Attach the Participant's Track to the thumbnail.
    track.attach(mediaElement);

    // ACTIVE BY DEFAULT ON THE CENTRAL VIDEO AREA
    // If the attached Track is a VideoTrack that is published by the active
    // Participant, then attach it to the main video as well.
    // if (track.kind === 'video' && participant === activeParticipant) {
    //   track.attach($activeVideo.get(0));
    //   $activeVideo.css('opacity', '');
    // }
  }

  /**
   * Detach a Track from the DOM.
   * @param track - the Track to be detached
   * @param participant - the Participant that is publishing the Track
   */
  detachTrack(track, participant) {
    let mediaKind = track.kind;
    let mediaElement = this.myContainerRef.nativeElement.querySelector(
      mediaKind,
    );
    mediaElement.style.opacity = 0;
    // Detach the Participant's Track from the thumbnail.
    track.detach(mediaElement);

    // If the detached Track is a VideoTrack that is published by the active
    // Participant, then detach it from the main video as well.
    // if (track.kind === 'video' && participant === activeParticipant) {
    //   track.detach($activeVideo.get(0));
    //   $activeVideo.css('opacity', '0');
    // }
  }

  selectActiveParticipant() {
    this.select_active.emit(this.participant_in);
  }
}
