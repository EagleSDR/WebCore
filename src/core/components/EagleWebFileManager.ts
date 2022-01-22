import IEagleFileManager from "../../../lib/core/files/IEagleFileManager";
import IEagleFilePickerSettings from "../../../lib/core/files/IEagleFilePickerSettings";
import IEaglePickedFile from "../../../lib/core/files/IEaglePickedFile";
import { EagleDialogButtonType } from "../../../lib/ui/dialog/button/EagleDialogButtonType";
import IEagleDialog from "../../../lib/ui/dialog/IEagleDialog";
import EagleObject from "../../../lib/web/EagleObject";
import IEagleObjectContext from "../../../lib/web/IEagleObjectContext";
import IEaglePortApi from "../../../lib/web/ports/IEaglePortApi";
import EagleApp from "../../EagleApp";
import IWebFsCapacity from "./webfs/IWebFsCapacity";
import IWebFsDirectoryQuery from "./webfs/IWebFsDirectoryQuery";
import EagleWebFilePicker from "./webfs/picker/EagleWebFilePicker";
import EagleWebFileOpenPicker from "./webfs/picker/implementations/EagleWebFileOpenPicker";
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

    async DoesFileExist(dirName: string, fileName: string): Promise<boolean> {
        //Request directory
        var dir = await this.QueryDirectory(dirName);

        //Scan for this file
        for (var i = 0; i < dir.files.length; i++) {
            if (dir.files[i].name.toLowerCase() == fileName.toLowerCase())
                return true;
        }

        return false;
    }

    PromptCreateFile(settings: IEagleFilePickerSettings): Promise<IEaglePickedFile> {
        var picker = new EagleWebFileSavePicker(this, this.net.GetContext(), settings);
        return picker.Prompt();
    }

    PromptOpenFile(settings: IEagleFilePickerSettings): Promise<IEaglePickedFile> {
        var picker = new EagleWebFileOpenPicker(this, this.net.GetContext(), settings);
        return picker.Prompt();
    }

    async RequestAccessFile(pathname: string, writable: boolean): Promise<IEaglePickedFile> {
        //Validate
        if (pathname.indexOf('/') == -1)
            throw Error("Invalid pathname.");

        //Get the directory and file name
        var dirName = pathname.substr(0, pathname.lastIndexOf('/') + 1);
        var fileName = pathname.substr(pathname.lastIndexOf('/') + 1);

        //Determine the message
        var msg: string;
        var btnType: EagleDialogButtonType;
        if (!writable) {
            //Read-only
            msg = "A plugin is requesting read-only access to the following file:\n\n" + pathname;
            btnType = EagleDialogButtonType.POSITIVE;
        } else if (await this.DoesFileExist(dirName, fileName)) {
            //Write access, file does exist
            msg = "A plugin is requesting access to OVERWRITE the following existing file:\n\n" + pathname;
            btnType = EagleDialogButtonType.NEGATIVE;
        } else {
            //Write access, file does NOT exist
            msg = "A plugin is requesting access to create the following file:\n\n" + pathname;
            btnType = EagleDialogButtonType.POSITIVE;
        }

        //Prompt
        if (!(await this.net.GetContext().GetDialogManager().ShowYesNoDialog("Plugin Requesting File Access", msg, "Allow", btnType, "Deny"))) {
            throw Error("The user denied the request to open the file.");
        }

        //Open the file
        var token = await this.OpenFile(pathname, writable);

        //Wrap
        return {
            GetName() { return fileName; },
            GetToken() { return token; },
            GetFullName() { return pathname; }
        };
    }

}