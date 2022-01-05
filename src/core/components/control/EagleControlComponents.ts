import IEagleObjectManager from "../../../../lib/web/IEagleObjectManager";
import EagleWebFileManager from "../EagleWebFileManager";
import EagleRadio from "../radio/EagleRadio";

export default class EagleControlComponents {

    constructor(data: any, net: IEagleObjectManager) {
        this.data = data;
        this.net = net;
    }

    private data: any;
    private net: IEagleObjectManager;

    GetRadio(): EagleRadio {
        return this.net.ResolveNetObject(this.data["radio"]) as EagleRadio;
    }

    GetFileManager(): EagleWebFileManager {
        return this.net.ResolveNetObject(this.data["file_manager"]) as EagleWebFileManager;
    }

}