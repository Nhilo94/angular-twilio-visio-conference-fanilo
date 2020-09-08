import { Injectable } from "@angular/core";
import { BaseHttpService } from "./base-http.service";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: "root",
})
export class VideoDataService extends BaseHttpService {
  constructor(http: HttpClient) {
    super(http);
  }

  initCall(arg) {
    return this.fetch("get", "init-call", { identity: arg });
  }
}
