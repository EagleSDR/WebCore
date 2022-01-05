import EagleUtil from "../../../lib/EagleUtil";
import EagleDialogBoxButton from "./EagleDialogBoxButton";

export default class EagleDialogBox {

    constructor(node: HTMLElement) {
        this.node = EagleUtil.CreateElement("div", "eagle_dialog_box");
        this.content = EagleUtil.CreateElement("div", "eagle_dialog_box_content", this.node);
        this.footer = EagleUtil.CreateElement("div", "eagle_dialog_box_footer", this.node);
        this.AddButton("OK", "blue");
        this.AddButton("Cancel", "minor");
    }

    private node: HTMLElement;
    private content: HTMLElement;
    private footer: HTMLElement;
    private buttons: EagleDialogBoxButton[] = [];

    Activate(): HTMLElement {
        return this.node;
    }

    Deactivate(): void {

    }

    AddButton(text: string, style: string): EagleDialogBoxButton {
        var b = new EagleDialogBoxButton(text, style);
        this.buttons.push(b);
        this.footer.appendChild(b.GetElement());
        return b;
    }

}