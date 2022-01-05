import EagleUtil from "../../../../lib/EagleUtil";
import EagleWindow from "../EagleWindow";
import IEagleWindowDropMount from "../IEagleWindowDropMount";

require("./mount_control.css");

const WIDGET_CELL_SIZE: number = 30;
const WIDGET_CELL_SPACING: number = 10;

export default class EagleWindowMountControl {

    constructor(container: HTMLElement) {
        this.mount = EagleUtil.CreateElement("div", "eagle_mc_container", container);
        this.widget = EagleUtil.CreateElement("div", "eagle_mc_widget", this.mount);
        this.widgetCore = EagleUtil.CreateElement("div", "eagle_mc_widget_core", this.widget);
        this.widget.style.width = this.CalculateSize(3) + "px";
        this.widget.style.height = this.CalculateSize(3) + "px";
    }

    private mount: HTMLElement;
    private widget: HTMLElement;
    private widgetCore: HTMLElement;

    AddButton(gridX: number, gridY: number, classname: string, callback: (window: EagleWindow) => void): EagleWindowMountControl {
        //Make
        var b = EagleUtil.CreateElement("div", "eagle_mc_btn", this.widgetCore);
        b.classList.add(classname);
        b.style.left = (gridX * (WIDGET_CELL_SIZE + WIDGET_CELL_SPACING)) + "px";
        b.style.top = (gridY * (WIDGET_CELL_SIZE + WIDGET_CELL_SPACING)) + "px";
        b.style.width = WIDGET_CELL_SIZE + "px";
        b.style.height = WIDGET_CELL_SIZE + "px";
        (b as unknown as IEagleWindowDropMount).OnEagleWindowDropped = callback;

        return this;
    }

    SetEnabled(enabled: boolean) {
        if (enabled)
            this.mount.classList.remove("eagle_mc_container_disabled");
        else
            this.mount.classList.add("eagle_mc_container_disabled");
    }

    private CalculateSize(count: number) {
        return (count * WIDGET_CELL_SIZE) + ((count - 1) * WIDGET_CELL_SPACING);
    }

}