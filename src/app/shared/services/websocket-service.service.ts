import { WebsocketEvent } from './../../interface/websocket-event';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observer, Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { TagData } from 'src/app/interface/tag-data';

@Injectable({
  providedIn: 'root',
})
export class WebsocketServiceService {
  private websocket: WebSocketSubject<any>;
  onReadTag = new BehaviorSubject<TagData>(undefined);
  onTriggerOn = new Subject<boolean>();

  constructor() {}

  connect(): void {
    this.websocket = webSocket({
      url: 'ws://localhost:7749',
      openObserver: {
        next: () => {
          console.log('Connection Open');
        },
      },
    });
    this.websocket.subscribe(
      (msg) => this.onMessage(msg as WebsocketEvent), // Called whenever there is a message from the server.
      (err) => console.log(err), // Called if at any point WebSocket API signals some kind of error.
      () => console.log('complete') // Called when connection is closed (for whatever reason).
    );
  }

  private onMessage(message: WebsocketEvent): void {
    // console.log(message);
    if (message.event === 'onReadTag') {
      this.onReadTag.next(message.data as TagData);
    } else if (message.event === 'triggerOn') {
      this.onTriggerOn.next(true);
    }
  }
}
