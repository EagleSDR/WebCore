import IEagleFilePickerSettings from "../../../../../../lib/core/files/IEagleFilePickerSettings";
import IEaglePickedFile from "../../../../../../lib/core/files/IEaglePickedFile";
import IEagleContext from "../../../../../../lib/core/IEagleContext";
import { EagleDialogButtonType } from "../../../../../../lib/ui/dialog/button/EagleDialogButtonType";
import IEagleDialog from "../../../../../../lib/ui/dialog/IEagleDialog";
import IEagleDialogBuilder from "../../../../../../lib/ui/dialog/IEagleDialogBuilder";
import EagleWebFileManager from "../../../EagleWebFileManager";
import IWebFsDirectoryQueryDir from "../../IWebFsDirectoryQueryDir";
import IWebFsDirectoryQueryFile from "../../IWebFsDirectoryQueryFile";
import EagleWebFilePicker from "../EagleWebFilePicker";

export default class EagleWebFileSavePicker extends EagleWebFilePicker {

    constructor(manager: EagleWebFileManager, context: IEagleContext) {
        super(manager, context);
        this.SetDialogTitle("Save File...");
        this.SetConfirmButtonEnabled(false);
    }

    /* API */

    private completeCallback: (value: IEaglePickedFile) => void;

    Prompt(settings: IEagleFilePickerSettings): Promise<IEaglePickedFile> {
        return new Promise<IEaglePickedFile>((resolve: (value: IEaglePickedFile) => void) => {
            //Set resolve
            this.completeCallback = resolve;

            //Set text
            this.SetDialogTitle(settings.name);

            //Show
            this.ShowDialog();
        });
    }

    /* INTERNAL */

    private ShowConfirmationDialog(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            var builder = this.GetContext().CreateDialogBuilder();
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

    private ShowErrorDialog(text: string): Promise<void> {
        return new Promise<void>((resolve) => {
            var builder = this.GetContext().CreateDialogBuilder();
            builder.AddTitle("Unable To Open File");
            builder.AddParagraph("The file \"" + this.GetFileName() + "\" couldn't be open due to an error:\n\n" + text);
            var dialog: IEagleDialog;
            builder.AddButton("Okay", EagleDialogButtonType.POSITIVE, () => {
                resolve();
                dialog.Remove();
            });
            dialog = builder.Show();
        });
    }

    /* Implementations */

    protected GetConfirmBtnText(): string {
        return "Save";
    }

    protected OnFileHighlighted(file: IWebFsDirectoryQueryFile): void {
        //File selected with single click. Set the file name box
        this.SetFileName(file.name);
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

        //Open file
        var token: string;
        try {
            token = await this.GetManager().OpenFile(this.GetFilePath(), true);
        } catch (e: any) {
            await this.ShowErrorDialog(e);
            return;
        }

        //Send out complete notification
        this.completeCallback({
            GetName(): string {
                return this.GetFileName();
            },
            GetFullName(): string {
                return this.GetFilePath();
            },
            GetToken(): string {
                return token;
            }
        });

        //Close the dialog
        this.CloseDialog();
    }

    protected OnCancel(): void {
        //Send out cancel notification
        this.completeCallback(null);

        //Close the dialog
        this.CloseDialog();
    }

}