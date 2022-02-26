import EagleUtil from "../../../../lib/EagleUtil";
import EagleApp from "../../../EagleApp";
import EagleCreateFreqControl from "./freq/EagleFreqControl";
require("./header.css");

export default class EagleCoreHeader {

    constructor(app: EagleApp, container: HTMLElement) {
        this.app = app;
        this.node = EagleUtil.CreateElement("div", "eagle_core_header", container);
    }

    private app: EagleApp;
    private node: HTMLElement;

    Init() {
        EagleCreateFreqControl(this.app, this.node);
    }

}