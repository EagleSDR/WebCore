import { EagleDialogButtonType } from "../../../../lib/ui/dialog/button/EagleDialogButtonType";
import IEagleDialogButton from "../../../../lib/ui/dialog/button/IEagleDialogButton";
import IEagleDialog from "../../../../lib/ui/dialog/IEagleDialog";
import IEagleDialogBuilder from "../../../../lib/ui/dialog/IEagleDialogBuilder";
import EagleDialogBox from "../EagleDialogBox";
import EagleDialogManager from "../EagleDialogManager";
import EagleDialogViewBuilder from "./EagleDialogViewBuilder";
require('./dialog_builder.css');

export default class EagleDialogBuilder extends EagleDialogViewBuilder implements IEagleDialogBuilder {

    constructor(manager: EagleDialogManager) {
        super();

        //Set
        this.manager = manager;

        //Create the dialog
        this.dialog = manager.CreateDialog();
        this.dialog.GetContent().appendChild(this.content);
    }

    private manager: EagleDialogManager;
    private shown: boolean = false;

    protected dialog: EagleDialogBox;

    AddButton(text: string, type: EagleDialogButtonType, callback: () => void): IEagleDialogButton {
        //Determine the real type
        var typeName: string;
        switch (type) {
            case EagleDialogButtonType.POSITIVE: typeName = "blue"; break;
            case EagleDialogButtonType.NEUTRAL: typeName = "minor"; break;
            case EagleDialogButtonType.NEGATIVE: typeName = "red"; break;
            default: throw Error("Unknown button type.");
        }

        //Create
        return this.dialog.AddButton(text, typeName, callback);
    }

    Show(): IEagleDialog {
        //Do some simple checking to make sure this dialog hasn't already been displayed
        if (this.shown)
            throw Error("This dialog has already been shown.");

        //Show
        this.dialog.Show();

        //Set flag
        this.shown = true;

        return this.dialog;
    }

}