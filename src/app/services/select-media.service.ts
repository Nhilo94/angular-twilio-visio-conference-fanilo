import { Injectable } from "@angular/core";
import { createLocalTracks } from "twilio-video";
@Injectable({
  providedIn: "root",
})
export class SelectMediaService {
  localTracks = {
    audio: null,
    video: null,
  };
  constructor() {}

  /**
   * Start capturing media from the given input device.
   * @param kind - 'audio' or 'video'
   * @param deviceId - the input device ID
   * @param render - the render callback
   * @returns {Promise<void>} Promise that is resolved if successful
   */
  async applyInputDevice(kind, deviceId, render) {
    // Create a new LocalTrack from the given Device ID.
    const [track] = await createLocalTracks({ [kind]: { deviceId } });

    // Stop the previous LocalTrack, if present.
    if (this.localTracks[kind]) {
      this.localTracks[kind].stop();
    }

    // Render the current LocalTrack.
    this.localTracks[kind] = track;
    render(new MediaStream([track.mediaStreamTrack]));
  }

  /**
   * Get the list of input devices of a given kind.
   * @param kind - 'audio' | 'video'
   * @returns {Promise<MediaDeviceInfo[]>} the list of media devices
   */
  async getInputDevices(kind) {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === `${kind}input`);
  }

  /**
   * Select the input for the given media kind.
   * @param kind - 'audio' or 'video'
   * @param $modal - the modal for selecting the media input
   * @param render - the media render function
   * @returns {Promise<string>} the device ID of the selected media input
   */
  async selectMedia(kind, render) {
    // const setDevice = () => this.applyInputDevice(kind, $inputDevices.val(), render);

    // Get the list of available media input devices.
    let devices = await this.getInputDevices(kind);

    // Apply the default media input device.
    await this.applyInputDevice(kind, devices[0].deviceId, render);

    // If all device IDs and/or labels are empty, that means they were
    // enumerated before the user granted media permissions. So, enumerate
    // the devices again.
    if (devices.every(({ deviceId, label }) => !deviceId || !label)) {
      devices = await this.getInputDevices(kind);
    }

    return new Promise((resolve) => {
      // Stop the LocalTrack, if present.
      if (this.localTracks[kind]) {
        this.localTracks[kind].stop();
        this.localTracks[kind] = null;
      }

      // Resolve the Promise with the saved device ID.
      const deviceId = devices[0].deviceId;
      localStorage.setItem(`${kind}DeviceId`, deviceId);
      resolve(deviceId);
    });
  }
}
