import EagleUtil from "../../../../lib/EagleUtil";
import IEagleDialogViewBuilder from "../../../../lib/ui/dialog/IEagleDialogViewBuilder";
import IEagleDialogTextBox from "../../../../lib/ui/dialog/text/IEagleDialogTextBox";
require('./dialog_view.css');

export default class EagleDialogViewBuilder implements IEagleDialogViewBuilder {

    constructor() {
        this.content = document.createElement('div');
    }

    protected content: HTMLElement;

    AddCustom(view: HTMLElement): void {
        this.content.appendChild(view);
    }

    AddTitle(text: string): IEagleDialogTextBox {
        return new ETextBox(this.content, "eagle_dialog_builder_title", text);
    }

    AddParagraph(text: string): IEagleDialogTextBox {
        return new ETextBox(this.content, "eagle_dialog_builder_paragraph", text);
    }

}

class ETextBox implements IEagleDialogTextBox {

    constructor(parent: HTMLElement, classname: string, text: string) {
        this.node = EagleUtil.CreateElement("div", classname, parent);
        this.SetText(text);
    }

    protected node: HTMLElement;

    SetText(text: string): void {
        this.node.innerText = text;
    }

    GetText(): string {
        return this.node.innerText;
    }

    Show(): void {
        this.node.style.display = null;
    }

    Hide(): void {
        this.node.style.display = "none";
    }

}