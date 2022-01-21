import IEagleFileManager from "../../../lib/core/files/IEagleFileManager";
import IEagleFilePickerSettings from "../../../lib/core/files/IEagleFilePickerSettings";
import IEaglePickedFile from "../../../lib/core/files/IEaglePickedFile";
import EagleObject from "../../../lib/web/EagleObject";
import IEagleObjectContext from "../../../lib/web/IEagleObjectContext";
import IEaglePortApi from "../../../lib/web/ports/IEaglePortApi";
import EagleApp from "../../EagleApp";
import IWebFsCapacity from "./webfs/IWebFsCapacity";
import IWebFsDirectoryQuery from "./webfs/IWebFsDirectoryQuery";
import EagleWebFilePicker from "./webfs/picker/EagleWebFilePicker";
import EagleWebFileSavePicker from "./webfs/picker/implementations/EagleWebFileSavePicker";

export default class EagleWebFileManager extends EagleObject implements IEagleFileManager {

    constructor(net: IEagleObjectContext) {
        super("EagleWebFileManager", net);
    }

    async OpenFile(filename: string, writable: boolean): Promise<string> {
        //Create request
        var request = {
            "filename": filename,
            "write": writable
        };

        //Send
        var response = await this.net.GetPortApi("OpenFile").SendRequest(request);

        return response["token"] as string;
    }

    async QueryDirectory(path: string): Promise<IWebFsDirectoryQuery> {
        var response = await this.net.GetPortApi("QueryDirectory").SendRequest({ "path": path });
        return response as IWebFsDirectoryQuery;
    }

    async CreateDirectory(path: string): Promise<IWebFsDirectoryQuery> {
        var response = await this.net.GetPortApi("CreateDirectory").SendRequest({ "path": path });
        return response as IWebFsDirectoryQuery;
    }

    async Delete(path: string): Promise<void> {
        await this.net.GetPortApi("Delete").SendRequest({ "path": path });
    }

    async QueryQuota(): Promise<IWebFsCapacity> {
        var response = await this.net.GetPortApi("QueryQuota").SendRequest({});
        return response as IWebFsCapacity;
    }

    PromptCreateFile(settings: IEagleFilePickerSettings): Promise<IEaglePickedFile> {
        var picker = new EagleWebFileSavePicker(this, this.net.GetContext());
        return picker.Prompt(settings);
    }

    PromptOpenFile(settings: IEagleFilePickerSettings): Promise<IEaglePickedFile> {
        throw new Error("Method not implemented.");
    }

}