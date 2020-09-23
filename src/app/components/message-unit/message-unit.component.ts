import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-message-unit',
  templateUrl: './message-unit.component.html',
  styleUrls: ['./message-unit.component.scss']
})
export class MessageUnitComponent implements OnInit {
  message_in: any;
  participant_in: any

  @Input('message') set message(arg) {
    this.message_in = arg;
  }

  @Input('participant') set participant(arg) {
    this.participant_in = arg;
  }
  constructor() { }

  ngOnInit() {
  }

}
