import EagleUtil from "../../../../lib/EagleUtil";
import EagleApp from "../../../EagleApp";
require("./header.css");

export default class EagleCoreHeader {

    constructor(app: EagleApp, container: HTMLElement) {
        this.node = EagleUtil.CreateElement("div", "eagle_core_header", container);
    }

    private node: HTMLElement;

}