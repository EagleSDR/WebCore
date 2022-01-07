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
    }

    private mount: HTMLElement;
    private widget: HTMLElement;
    private widgetCore: HTMLElement;

    AddButton(gridX: number, gridY: number, classname: string, callback: (window: EagleWindow) => void): EagleWindowMountControl {
        //Make
        var b = EagleUtil.CreateElement("div", "eagle_mc_btn", this.widgetCore);
        b.classList.add(classname);
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