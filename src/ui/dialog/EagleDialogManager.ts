import EagleUtil from "../../../lib/EagleUtil";
import EagleDialogBox from "./EagleDialogBox";
require("./dialog_main.css");

const ANIMATION_TIME: number = 200;

export default class EagleDialogManager {

    constructor(container: HTMLElement) {
        this.root = EagleUtil.CreateElement("div", "eagle_dialog_root", container);
        this.content = EagleUtil.CreateElement("div", "eagle_dialog_content", this.root);
        //this.ShowDialog(new EagleDialogBox(document.createElement("div")));
    }

    private root: HTMLElement;
    private content: HTMLElement;
    private current: EagleDialogBox;
    private stack: EagleDialogBox[] = [];
    private isUpdating: boolean = false;
    private updateWaiting: boolean = false;

    ShowDialog(dialog: EagleDialogBox) {
        this.stack.push(dialog);
        this.Update();
    }

    HideDialog(dialog: EagleDialogBox) {
        var index = this.stack.indexOf(dialog);
        if (index != -1) {
            this.stack.splice(index, 1);
            this.Update();
        }
    }

    private Update() {
        //If we're already in progress, abort
        if (this.isUpdating) {
            this.updateWaiting = true;
            return;
        }

        //Set state
        this.isUpdating = true;
        this.updateWaiting = false;

        //Check if we're going to activate or not
        if (this.stack.length == 0 && this.current == null) {
            //Do nothing
            this.isUpdating = false;
        }
        else if (this.stack.length == 0) {
            //Deactivate
            this.root.classList.remove("eagle_dialog_root_active");
            this.content.classList.remove("eagle_dialog_content_active");

            //Wait for the animation to finish
            setTimeout(() => {
                //Remove eixsting
                this.RemoveCurrent();

                //Set state
                this.isUpdating = false;
                if (this.updateWaiting)
                    this.Update();
            }, ANIMATION_TIME);            
        } else if (this.current != null) {
            //Activating; Switching item
            this.content.classList.remove("eagle_dialog_content_active");
            setTimeout(() => {
                //Remove existing
                this.RemoveCurrent();

                //Activate
                this.isUpdating = false;
                this.Update();
            }, ANIMATION_TIME);
        } else {
            //Activating, new item
            this.current = this.stack[this.stack.length - 1];
            this.content.appendChild(this.current.Activate());
            this.root.classList.add("eagle_dialog_root_active");
            this.content.classList.add("eagle_dialog_content_active");

            //Set timeout for animation
            setTimeout(() => {
                this.isUpdating = false;
                if (this.updateWaiting)
                    this.Update();
            }, ANIMATION_TIME);
        }
    }

    private RemoveCurrent() {
        //Remove
        EagleUtil.RemoveElementChildren(this.content);
        if (this.current != null)
            this.current.Deactivate();
        this.current = null;
    }

}