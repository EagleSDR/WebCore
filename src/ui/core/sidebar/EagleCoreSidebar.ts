import EagleUtil from "../../../../lib/EagleUtil";
import EagleApp from "../../../EagleApp";
import EagleCoreSidebarBtn from "./EagleCoreSidebarBtn";
require('./sidebar.css');

export default class EagleCoreSidebar {

    constructor(app: EagleApp, container: HTMLElement) {
        this.app = app;
        this.node = EagleUtil.CreateElement("div", "eagle_core_sidebar", container);
        this.control = EagleUtil.CreateElement("div", "eagle_core_sidebar_control", this.node);
    }

    private app: EagleApp;
    private node: HTMLElement;
    private control: HTMLElement;

    AddButton(btn: EagleCoreSidebarBtn) {
        this.control.appendChild(btn.GetNode());
    }

}