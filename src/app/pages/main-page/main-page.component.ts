import { HistoryTime } from './../../class/history-time';
import { TagConfigDialogComponent } from './component/tag-config-dialog/tag-config-dialog.component';
import { TagDescription } from './../../interface/tag-description';
import { TagData } from './../../interface/tag-data';
import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WebsocketServiceService } from 'src/app/shared/services/websocket-service.service';
import { MatDialog } from '@angular/material/dialog';
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';
import * as posenet from '@tensorflow-models/posenet';
import { PoseNet } from '@tensorflow-models/posenet';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent implements OnInit, OnDestroy {
  @ViewChild('local', { static: true })
  localVideo: ElementRef<HTMLVideoElement>;
  @ViewChild('videoCanvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('photo', { static: true })
  photo: ElementRef<HTMLImageElement>;
  defaultWidth = 640;
  defaultHeight = 480;
  private canvas2d: CanvasRenderingContext2D;
  private localStream = null;
  private requestingCam = false;
  alertFlag = true;
  private alertMS = 45000;
  dateFormat = 'yyyy-MM-dd HH:mm:ss';
  handTag = 'ad2b05004a50878141000004';
  legTag = 'ad2b05004a51d17c3e000012';
  handAntennaId = 0;
  legAntennaId = 0;
  handDescription: TagDescription = {
    epc: this.handTag,
    time: new HistoryTime(),
    rssi: undefined,
  };
  legDescription: TagDescription = {
    epc: this.legTag,
    time: new HistoryTime(),
    rssi: undefined,
  };
  private destroy$ = new Subject();
  private mobileNet: posenet.ModelConfig = {
    architecture: 'MobileNetV1',
    outputStride: 16,
    inputResolution: 513,
    multiplier: 0.75,
  };
  private resNet: posenet.ModelConfig = {
    architecture: 'ResNet50',
    outputStride: 32,
    inputResolution: 257,
    quantBytes: 2,
  };
  poseNet: PoseNet;
  showPoseDetect = true;
  private lastResult = new BehaviorSubject<posenet.Pose>(null);

  constructor(
    private websocket: WebsocketServiceService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    public dialog: MatDialog
  ) {
    this.matIconRegistry.addSvgIcon(
      'foot',
      this.domSanitizer.bypassSecurityTrustResourceUrl(
        'assets/icon/shoe-prints.svg'
      )
    );
    this.matIconRegistry.addSvgIcon(
      'hand',
      this.domSanitizer.bypassSecurityTrustResourceUrl(
        'assets/icon/hand-paper.svg'
      )
    );
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    posenet.load(this.resNet).then((config) => {
      this.poseNet = config;
      console.log('Model Loaded');
      this.systemInit();
    });
  }

  systemInit(): void {
    this.canvas2d = this.canvas.nativeElement.getContext('2d');
    this.requestPermission();
    this.websocket.connect();
    this.websocket.onReadTag
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: TagData) => {
        if (data && !this.alertFlag) {
          if (data.epc === this.handTag) {
            if (
              this.handAntennaId === 0 ||
              (this.handAntennaId !== 0 && this.handAntennaId === data.aid)
            ) {
              this.handDescription.epc = data.epc;
              this.handDescription.rssi = data.rssi;
              this.handDescription.time.addDate(new Date(data.time));
            }
          } else if (data.epc === this.legTag) {
            this.legDescription.epc = data.epc;
            this.legDescription.rssi = data.rssi;
            this.legDescription.time.addDate(new Date(data.time));
          }
          if (this.localStream === null) {
            this.triggerOnCheck();
          } else {
            this.triggerOffCheck();
          }
        }
      });
    this.lastResult.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data) {
        this.drawResult(data).then(() => {
          if (this.localStream !== null) {
            setTimeout(() => this.detectResult(), 0);
          }
        });
      }
    });
  }

  openConfig(isHand: boolean): void {
    const dialogRef = this.dialog.open(TagConfigDialogComponent, {
      data: {
        epcTag: isHand ? this.handTag : this.legTag,
        aid: isHand ? this.handAntennaId : this.legAntennaId,
      },
    });

    dialogRef
      .afterClosed()
      .subscribe((result: { epcTag: string; aid: number }) => {
        if (result) {
          if (isHand) {
            this.handTag = result.epcTag;
            this.handAntennaId = result.aid;
            this.handDescription.epc = this.handTag;
            this.handDescription.rssi = undefined;
            this.handDescription.time = new HistoryTime();
          } else {
            this.legTag = result.epcTag;
            this.legAntennaId = result.aid;
            this.handDescription.epc = this.legTag;
            this.handDescription.rssi = undefined;
            this.handDescription.time = new HistoryTime();
          }
          if (this.localStream !== null) {
            this.stopVideo();
          }
        }
      });
  }

  stopAlarm(): void {
    this.alertFlag = false;
    this.handDescription.epc = this.handTag;
    this.handDescription.rssi = undefined;
    this.handDescription.time = new HistoryTime();
    this.handDescription.epc = this.legTag;
    this.handDescription.rssi = undefined;
    this.handDescription.time = new HistoryTime();
    if (this.localStream !== null) {
      this.stopVideo();
    }
  }

  requestPermission(): void {
    navigator.permissions
      .query({ name: 'camera' })
      .then((permissionObj) => {
        if (permissionObj.state !== 'granted') {
          this.startVideo().then(() => this.stopVideo());
        }
      })
      .catch((error) => {
        console.log('Got error :', error);
      });
  }

  startVideo(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (this.requestingCam) {
        resolve(true);
        return;
      } else {
        this.requestingCam = true;
      }
      if (this.localStream !== null) {
        return;
      }
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          this.localStream = stream;
          this.localVideo.nativeElement.srcObject = this.localStream;
          this.requestingCam = false;
          this.localVideo.nativeElement.onloadeddata = () => {
            setTimeout(() => this.detectResult(), 0);
          };
          resolve(true);
        })
        .catch((error) => {
          console.error(error);
          reject(false);
        });
    });
  }

  async drawResult(result: posenet.Pose): Promise<void> {
    if (result) {
      result.keypoints.forEach((points) => {
        this.canvas2d.beginPath();
        this.canvas2d.fillStyle = 'aqua';
        this.canvas2d.arc(
          points.position.x,
          points.position.y,
          3,
          0,
          Math.PI * 2,
          true
        );
        this.canvas2d.closePath();
        this.canvas2d.fill();
      });
      const adjacentKeyPoints = await posenet.getAdjacentKeyPoints(
        result.keypoints,
        0.5
      );
      for (const adPoint of adjacentKeyPoints) {
        this.canvas2d.beginPath();
        this.canvas2d.moveTo(adPoint[0].position.x, adPoint[0].position.y);
        this.canvas2d.lineTo(adPoint[1].position.x, adPoint[1].position.y);
        this.canvas2d.lineWidth = 2;
        this.canvas2d.strokeStyle = 'aqua';
        this.canvas2d.stroke();
      }
    }
    this.photo.nativeElement.setAttribute(
      'src',
      this.canvas.nativeElement.toDataURL('image/png')
    );
  }

  detectResult(): void {
    this.canvas2d.drawImage(
      this.localVideo.nativeElement,
      0,
      0,
      this.localVideo.nativeElement.videoWidth,
      this.localVideo.nativeElement.videoHeight
    );
    this.poseNet
      .estimateSinglePose(
        this.canvas2d.getImageData(
          0,
          0,
          this.localVideo.nativeElement.videoWidth,
          this.localVideo.nativeElement.videoHeight
        )
      )
      .then((data) => {
        this.canvas2d.clearRect(
          0,
          0,
          this.localVideo.nativeElement.videoWidth,
          this.localVideo.nativeElement.videoHeight
        );
        this.lastResult.next(data);
      });
  }

  stopVideo(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.localStream = null;
    }
  }

  triggerOnCheck(): void {
    // if (this.handDescription.time.avgTime < this.alertMS) {
    //   console.log('alertFlag true');
    //   this.alertFlag = true;
    //   this.startVideo();
    //   return;
    // }
    if (
      this.legDescription.time.lastTime &&
      this.handDescription.time.lastTime
    ) {
      if (
        this.legDescription.time.lastTime - this.handDescription.time.lastTime <
        1000
      ) {
        console.log('triggerOn');
        this.startVideo();
      }
    } else if (
      new Date().getTime() - this.handDescription.time.lastTime <
      5000
    ) {
      console.log('triggerOn');
      this.startVideo();
    }
  }

  triggerOffCheck(): void {
    if (this.alertFlag) {
      return;
    }
    if (this.handDescription.time.avgTime < this.alertMS) {
      console.log('alertFlag true');
      this.alertFlag = true;
      this.startVideo();
      return;
    }
    if (
      this.legDescription.time.lastTime &&
      this.handDescription.time.lastTime
    ) {
      if (
        new Date().getTime() - this.handDescription.time.firstTime > 5000 &&
        new Date().getTime() - this.handDescription.time.lastTime > 5000
      ) {
        console.log('triggerOff');
        this.stopVideo();
      }
    }
  }
}
