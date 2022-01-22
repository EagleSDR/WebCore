import IEagleFilePickerSettings from "../../../../../../lib/core/files/IEagleFilePickerSettings";
import IEagleContext from "../../../../../../lib/core/IEagleContext";
import { EagleDialogButtonType } from "../../../../../../lib/ui/dialog/button/EagleDialogButtonType";
import IEagleDialog from "../../../../../../lib/ui/dialog/IEagleDialog";
import EagleWebFileManager from "../../../EagleWebFileManager";
import IWebFsDirectoryQueryFile from "../../IWebFsDirectoryQueryFile";
import EagleWebFilePicker from "../EagleWebFilePicker";
import EagleWebFileBasePicker from "./EagleWebFileBasePicker";

export default class EagleWebFileSavePicker extends EagleWebFileBasePicker {

    constructor(manager: EagleWebFileManager, context: IEagleContext, settings: IEagleFilePickerSettings) {
        super(manager, context, settings);
    }

    /* INTERNAL */

    private ShowConfirmationDialog(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            var builder = this.GetContext().GetDialogManager().CreateDialogBuilder();
            builder.AddTitle("File Already Exists");
            builder.AddParagraph("The file \"" + this.GetFileName() + "\" already exists. Would you like to overwrite it?");
            var dialog: IEagleDialog;
            builder.AddButton("Overwrite", EagleDialogButtonType.NEGATIVE, () => {
                resolve(true);
                dialog.Remove();
            });
            builder.AddButton("Cancel", EagleDialogButtonType.NEUTRAL, () => {
                resolve(false);
                dialog.Remove();
            });
            dialog = builder.Show();
        });
    }

    /* Implementations */

    protected GetConfirmBtnText(): string {
        return "Save";
    }

    protected OnFileChosen(file: IWebFsDirectoryQueryFile): void {
        //File selected with double click. Set the file name box and then run confirm
        this.SetFileName(file.name);
        this.OnConfirm();
    }

    protected OnFileNameChanged(name: string): void {
        //File name box changed. Check if it's valid or not and set the button's status
        this.SetConfirmButtonEnabled(!EagleWebFilePicker.IsFileNameEmpty(name));
    }

    protected async OnConfirm(): Promise<void> {
        //Show overwrite dialog and prompt if needed
        if (this.GetFileExists() && !(await this.ShowConfirmationDialog()))
            return;

        return await this.OpenSelectedFile(true);
    }

}