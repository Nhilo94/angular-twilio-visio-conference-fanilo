import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class BaseHttpService {
  private endPointUrl: string;
  constructor(public http: HttpClient) {
    this.endPointUrl = environment.apiUrl;
  }

  public fetch(
    method: string = "GET",
    resource: string = "",
    data_params: { [key: string]: any } = {},
    header: { [key: string]: string } = {}
  ) {
    let _data: any;
    let url = this.endPointUrl + "/" + resource;
    _data = data_params;

    console.log(url);

    if (method === "get" || method === "GET") {
      data_params["t"] = Date.now();
      url += "?" + this.getFilters(data_params);
      _data = {};
    }

    return this.http.request(method, url, {
      headers: new HttpHeaders(header),
      body: _data,
    });
  }

  public getFilters(data_params: { [key: string]: string } = {}) {
    let filter = "";
    let index = 0;
    const pkey = Object.keys(data_params);
    for (const key of pkey) {
      const ecomm = index ? "&" : "";
      filter += ecomm + key + "=" + data_params[key];
      index++;
    }
    return filter;
  }
}
