import EagleUtil from "../../../../lib/EagleUtil";
import EagleWindowManager from "../EagleWindowManager";
import IEagleWindowRegistration from "../IEagleWindowRegistration";
require("./factory.css");

export default class EagleWindowFactoryBar {

    constructor(mount: HTMLElement, manager: EagleWindowManager) {
        this.mount = mount;
        this.manager = manager;

        //Set up mount
        this.mount.classList.add("eagle_window_bar");

        //Bind
        this.manager.RegisterWindowBinding((classname: string, reg: IEagleWindowRegistration) => new BarItem(this.mount, this.manager, classname, reg));
    }

    private mount: HTMLElement;
    private manager: EagleWindowManager;

}

class BarItem {

    constructor(container: HTMLElement, manager: EagleWindowManager, classname: string, reg: IEagleWindowRegistration) {
        //Set
        this.manager = manager;
        this.classname = classname;
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
            this.manager.CreateWindowDragging(this.classname, {}, 300, 200, evt);
            evt.preventDefault();
            evt.stopPropagation();
        });
    }

    private manager: EagleWindowManager;
    private classname: string;
    private reg: IEagleWindowRegistration;

    private view: HTMLElement;
    private label: HTMLElement;
    private preview: HTMLElement;

}