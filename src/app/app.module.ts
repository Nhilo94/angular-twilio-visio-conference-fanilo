import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { VisioContainerComponent } from './pages/visio-container/visio-container.component';
import { PreviewParticipantsComponent } from './components/preview-participants/preview-participants.component';
import { VisioShareScreenComponent } from './pages/visio-share-screen/visio-share-screen.component';
import { MessageUnitComponent } from './components/message-unit/message-unit.component';

@NgModule({
  declarations: [
    AppComponent,
    VisioContainerComponent,
    PreviewParticipantsComponent,
    VisioShareScreenComponent,
    MessageUnitComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [PreviewParticipantsComponent, MessageUnitComponent],
})
export class AppModule {}
