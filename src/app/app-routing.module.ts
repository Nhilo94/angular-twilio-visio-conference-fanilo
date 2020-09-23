import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VisioContainerComponent } from './pages/visio-container/visio-container.component';
import { VisioShareScreenComponent } from './pages/visio-share-screen/visio-share-screen.component';

const routes: Routes = [
  {
    path: 'all-default',
    component: VisioContainerComponent,
  },
  {
    path: 'all-share-screen',
    component: VisioShareScreenComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
