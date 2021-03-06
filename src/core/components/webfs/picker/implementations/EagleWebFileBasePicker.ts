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

export default abstract class EagleWebFileBasePicker extends EagleWebFilePicker {

    constructor(manager: EagleWebFileManager, context: IEagleContext, settings: IEagleFilePickerSettings) {
        super(manager, context);

        //Disable button by default
        this.SetConfirmButtonEnabled(false);

        //Set text
        this.SetDialogTitle(settings.name);

        //Add types
        for (var i = 0; i < settings.extensions.length; i++) {
            //Fix common problems with the extension
            var ext = settings.extensions[i].extension;
            if (ext.includes('.'))
                ext = ext.substr(ext.indexOf('.') + 1);

            //Set
            this.AddFileType(settings.extensions[i].description, ext);
        }

        //Add "any" type
        this.AddFileType("Any Files", "*");
    }

    /* API */

    private completeCallback: (value: IEaglePickedFile) => void;

    Prompt(): Promise<IEaglePickedFile> {
        return new Promise<IEaglePickedFile>((resolve: (value: IEaglePickedFile) => void) => {
            //Set resolve
            this.completeCallback = resolve;

            //Show
            this.ShowDialog();
        });
    }

    /* INTERNAL */

    private ShowErrorDialog(text: string): Promise<void> {
        return new Promise<void>((resolve) => {
            var builder = this.GetContext().GetDialogManager().CreateDialogBuilder();
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

    protected async OpenSelectedFile(writable: boolean): Promise<void> {
        //Open file
        var token: string;
        try {
            token = await this.GetManager().OpenFile(this.GetFilePath(), writable);
        } catch (e: any) {
            await this.ShowErrorDialog(e);
            return;
        }

        //Send out complete notification
        this.completeCallback(EagleWebFileBasePicker.WrapPickedFile(this, token));

        //Close the dialog
        this.CloseDialog();
    }

    private static WrapPickedFile(ctx: EagleWebFileBasePicker, token: string): IEaglePickedFile {
        return {
            GetName(): string {
                return ctx.GetFileName();
            },
            GetFullName(): string {
                return ctx.GetFilePath();
            },
            GetToken(): string {
                return token;
            }
        };
    }

    /* Implementations */

    protected OnFileHighlighted(file: IWebFsDirectoryQueryFile): void {
        //File selected with single click. Set the file name box
        this.SetFileName(file.name);
    }

    protected OnCancel(): void {
        //Send out cancel notification
        this.completeCallback(null);

        //Close the dialog
        this.CloseDialog();
    }

}