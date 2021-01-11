import { ElementRef, ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-camera-adjust-page',
  templateUrl: './camera-adjust-page.component.html',
  styleUrls: ['./camera-adjust-page.component.scss'],
})
export class CameraAdjustPageComponent implements OnInit {
  @ViewChild('local', { static: true })
  localVideo: ElementRef<HTMLVideoElement>;

  constructor() {}

  ngOnInit(): void {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        this.localVideo.nativeElement.srcObject = stream;
      })
      .catch((error) => {
        console.error(error);
      });
  }
}
