import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-tag-config-dialog',
  templateUrl: './tag-config-dialog.component.html',
  styleUrls: ['./tag-config-dialog.component.scss'],
})
export class TagConfigDialogComponent implements OnInit {
  epc: string;
  aid: number;
  constructor(
    @Inject(MAT_DIALOG_DATA) private data: { epcTag: string; aid: number },
    private dialogRef: MatDialogRef<TagConfigDialogComponent>
  ) {}

  ngOnInit(): void {
    this.epc = this.data.epcTag;
    this.aid = this.data.aid;
  }

  saveConfig(): void {
    this.dialogRef.close({
      epcTag: this.epc,
      aid: this.aid,
    });
  }
}
