import EagleUtil from "../../../../lib/EagleUtil";
import EagleWindowManager from "../EagleWindowManager";
import IEagleWindowRegistration from "../IEagleWindowRegistration";
import IEagleWindowFactoryItem from "./IEagleWindowFactoryItem";
require("./factory.css");

export default class EagleWindowFactoryBar {

    constructor(mount: HTMLElement, manager: EagleWindowManager) {
        this.mount = mount;
        this.manager = manager;

        //Set up mount
        this.mount.classList.add("eagle_window_bar");
    }

    private mount: HTMLElement;
    private manager: EagleWindowManager;
    private items: BarItem[] = [];

    AddItem(item: IEagleWindowFactoryItem) {
        this.items.push(new BarItem(this.mount, this.manager, item));
    }

    RemoveItem(item: IEagleWindowFactoryItem): boolean {
        //Search
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i].GetRegistration() == item) {
                this.items.splice(i, 1);
                return true;
            }
        }

        //Failed
        return false;
    }

}

class BarItem {

    constructor(container: HTMLElement, manager: EagleWindowManager, reg: IEagleWindowFactoryItem) {
        //Set
        this.manager = manager;
        this.reg = reg;

        //Create item
        this.view = EagleUtil.CreateElement("div", "eagle_window_bar_item", container);
        this.preview = EagleUtil.CreateElement("div", "eagle_window_bar_item_preview", this.view);
        this.label = EagleUtil.CreateElement("div", "eagle_window_bar_item_label", this.view);

        //Set content
        this.preview.appendChild(reg.GetPreview());
        this.label.innerText = reg.GetDisplayName();

        //Add events
        this.view.addEventListener("mousedown", (evt: MouseEvent) => {
            this.manager.CreateWindowClassDragging(this.reg.GetRegistration(), this.reg.GetSettings(), 300, 200, evt);
            evt.preventDefault();
            evt.stopPropagation();
        });
    }

    private manager: EagleWindowManager;
    private reg: IEagleWindowFactoryItem;

    private view: HTMLElement;
    private label: HTMLElement;
    private preview: HTMLElement;

    GetRegistration(): IEagleWindowFactoryItem {
        return this.reg;
    }

    Remove() {
        this.view.remove();
    }

}