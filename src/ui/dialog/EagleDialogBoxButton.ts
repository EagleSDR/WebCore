import EagleUtil from "../../../lib/EagleUtil";

export default class EagleDialogBoxButton {

    constructor(name: string, style: string) {
        this.name = name;
        this.style = style;
        this.node = EagleUtil.CreateElement("div", "eagle_dialog_box_footer_btn");
        this.node.innerText = this.name;
        this.Enable();
    }

    private name: string;
    private style: string;
    private node: HTMLElement;

    Enable(): EagleDialogBoxButton {
        this.node.classList.remove("eagle_dialog_box_footer_btn_" + this.style + "_disabled");
        this.node.classList.add("eagle_dialog_box_footer_btn_" + this.style);
        return this;
    }

    Disable(): EagleDialogBoxButton {
        this.node.classList.add("eagle_dialog_box_footer_btn_" + this.style + "_disabled");
        this.node.classList.remove("eagle_dialog_box_footer_btn_" + this.style);
        return this;
    }

    GetElement(): HTMLElement {
        return this.node;
    }

}