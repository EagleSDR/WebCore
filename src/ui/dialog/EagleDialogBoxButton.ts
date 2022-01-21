import EagleUtil from "../../../lib/EagleUtil";
import IEagleDialogButton from "../../../lib/ui/dialog/button/IEagleDialogButton";

export default class EagleDialogBoxButton implements IEagleDialogButton {

    constructor(name: string, style: string, callback: () => void) {
        //Set
        this.name = name;
        this.style = style;
        this.callback = callback;

        //Create
        this.node = EagleUtil.CreateElement("div", "eagle_dialog_box_footer_btn");
        this.node.innerText = this.name;
        this.node.addEventListener("click", (evt: Event) => {
            if (this.enabled && !this.loading) {
                this.callback();
            }
            evt.preventDefault();
        });
        this.node.addEventListener("mousedown", (evt: Event) => {
            evt.preventDefault();
        });

        //Configure
        this.Enable();
    }

    private name: string;
    private style: string;
    private node: HTMLElement;
    private callback: () => void;

    private enabled: boolean = true;
    private loading: boolean = false;

    SetText(text: string): void {
        this.node.innerText = text;
    }

    Enable(): void {
        this.node.classList.remove("eagle_dialog_box_footer_btn_" + this.style + "_disabled");
        this.node.classList.add("eagle_dialog_box_footer_btn_" + this.style);
        this.enabled = true;
    }

    Disable(): void {
        this.node.classList.add("eagle_dialog_box_footer_btn_" + this.style + "_disabled");
        this.node.classList.remove("eagle_dialog_box_footer_btn_" + this.style);
        this.enabled = false;
    }

    SetLoading(loading: boolean): void {
        this.loading = loading;
        if (loading)
            this.node.classList.add("eagle_dialog_box_footer_btn_loading");
        else
            this.node.classList.remove("eagle_dialog_box_footer_btn_loading");
    }

    GetElement(): HTMLElement {
        return this.node;
    }

}