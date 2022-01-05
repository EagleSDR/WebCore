import EagleUtil from "../../../lib/EagleUtil";
import IEaglePluginAsset from "../../../lib/plugin/IEaglePluginAsset";
import EagleApp from "../../EagleApp";

export default class EaglePluginAsset implements IEaglePluginAsset {

    constructor(app: EagleApp, name: string, hash: string) {
        this.app = app;
        this.name = name;
        this.hash = hash;
    }

    private app: EagleApp;
    private name: string;
    private hash: string;

    GetName(): string {
        return this.name;
    }

    GetUrl(): string {
        return this.app.CreateUrl(false, "/api/asset", {
            "hash": this.hash
        });
    }

    DownloadAsJson(): Promise<any> {
        return EagleUtil.HttpGetRequestJson(this.GetUrl());
    }

    DownloadAsString(): Promise<string> {
        return EagleUtil.HttpGetRequestString(this.GetUrl());
    }

    DownloadAsBinary(): Promise<ArrayBuffer> {
        return EagleUtil.HttpGetRequestBinary(this.GetUrl());
    }

}