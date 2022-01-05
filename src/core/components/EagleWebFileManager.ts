import EagleObject from "../../../lib/web/EagleObject";
import IEagleObjectContext from "../../../lib/web/IEagleObjectContext";
import IEaglePortApi from "../../../lib/web/ports/IEaglePortApi";
import EagleApp from "../../EagleApp";

export default class EagleWebFileManager extends EagleObject {

    constructor(net: IEagleObjectContext) {
        super("EagleWebFileManager", net);
    }

    private PortOpenFile: IEaglePortApi;

    async OpenFile(filename: string, writable: boolean): Promise<string> {
        //Create request
        var request = {
            "filename": filename,
            "write": writable
        };

        //Send
        var response = await this.PortOpenFile.SendRequest(request);

        return response["token"] as string;
    }

}