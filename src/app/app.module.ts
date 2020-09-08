import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { VisioContainerComponent } from './pages/visio-container/visio-container.component';
import { PreviewParticipantsComponent } from './components/preview-participants/preview-participants.component';

@NgModule({
  declarations: [
    AppComponent,
    VisioContainerComponent,
    PreviewParticipantsComponent,
  ],
  imports: [BrowserModule, HttpClientModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [PreviewParticipantsComponent],
})
export class AppModule {}
