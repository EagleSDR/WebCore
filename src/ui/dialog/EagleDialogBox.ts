import EagleUtil from "../../../lib/EagleUtil";
import IEagleDialog from "../../../lib/ui/dialog/IEagleDialog";
import EagleDialogBoxButton from "./EagleDialogBoxButton";

export default abstract class EagleDialogBox implements IEagleDialog {

    constructor() {
        this.node = EagleUtil.CreateElement("div", "eagle_dialog_box");
        this.content = EagleUtil.CreateElement("div", "eagle_dialog_box_content", this.node);
        this.footer = EagleUtil.CreateElement("div", "eagle_dialog_box_footer", this.node);
    }

    protected node: HTMLElement;
    protected content: HTMLElement;
    protected footer: HTMLElement;

    private buttons: EagleDialogBoxButton[] = [];

    GetContent(): HTMLElement {
        return this.content;
    }

    AddButton(text: string, style: string, callback: () => void): EagleDialogBoxButton {
        var b = new EagleDialogBoxButton(text, style, callback);
        this.buttons.push(b);
        this.footer.appendChild(b.GetElement());
        return b;
    }

    /* ABSTRACT */

    abstract Show(): void;
    abstract Hide(): void;
    abstract Remove(): void;

}