import IEagleContext from "../../../../../../lib/core/IEagleContext";
import { EagleDialogButtonType } from "../../../../../../lib/ui/dialog/button/EagleDialogButtonType";
import IEagleDialog from "../../../../../../lib/ui/dialog/IEagleDialog";
import EagleWebFileManager from "../../../EagleWebFileManager";
import IWebFsDirectoryQueryFile from "../../IWebFsDirectoryQueryFile";
import EagleWebFilePicker from "../EagleWebFilePicker";
import EagleWebFileBasePicker from "./EagleWebFileBasePicker";

export default class EagleWebFileOpenPicker extends EagleWebFileBasePicker {

    constructor(manager: EagleWebFileManager, context: IEagleContext) {
        super(manager, context);
    }

    /* Implementations */

    protected GetConfirmBtnText(): string {
        return "Open";
    }

    protected OnFileChosen(file: IWebFsDirectoryQueryFile): void {
        //File selected with double click. Set the file name box and then run confirm
        this.SetFileName(file.name);
        this.OnConfirm();
    }

    protected OnFileNameChanged(name: string): void {
        //File name box changed. Make sure the file is valid
        this.SetConfirmButtonEnabled(this.GetFileExists());
    }

    protected OnConfirm(): Promise<void> {
        return this.OpenSelectedFile(false);
    }

}