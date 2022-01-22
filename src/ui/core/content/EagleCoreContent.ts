import EagleUtil from "../../../../lib/EagleUtil";
import EagleApp from "../../../EagleApp";
import EagleDockWindowLayer from "../../window/layers/EagleDockWindowLayer";
require("./content.css");

export default class EagleCoreContent extends EagleDockWindowLayer {

    constructor(app: EagleApp, container: HTMLElement) {
        super(EagleUtil.CreateElement("div", "eagle_core_content", container), app.windowManager);
        app.windowManager.RegisterLayer("EagleSDR.Content", this);
    }

}