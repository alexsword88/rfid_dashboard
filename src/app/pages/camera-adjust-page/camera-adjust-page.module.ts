import { FlexLayoutModule } from '@angular/flex-layout';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CameraAdjustPageComponent } from './camera-adjust-page.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: CameraAdjustPageComponent,
  },
];

@NgModule({
  declarations: [CameraAdjustPageComponent],
  imports: [RouterModule.forChild(routes), CommonModule, FlexLayoutModule],
})
export class CameraAdjustPageModule {}
