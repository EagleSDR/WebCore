import EagleUtil from "../../../../lib/EagleUtil";
import EagleApp from "../../../EagleApp";
import EagleSidebarWindowLayer from "../../window/layers/EagleSidebarWindowLayer";
import EagleCoreSidebarBtn from "./EagleCoreSidebarBtn";
require('./sidebar.css');

export default class EagleCoreSidebar {

    constructor(app: EagleApp, container: HTMLElement) {
        this.app = app;
        this.node = EagleUtil.CreateElement("div", "eagle_core_sidebar", container);
        this.control = EagleUtil.CreateElement("div", "eagle_core_sidebar_control", this.node);
        this.content = new EagleSidebarWindowLayer(EagleUtil.CreateElement("div", "eagle_core_sidebar_content", this.node), app.windowManager);
        app.windowManager.RegisterLayer("EagleSDR.Sidebar", this.content);
    }

    private app: EagleApp;
    private node: HTMLElement;
    private control: HTMLElement;
    private content: EagleSidebarWindowLayer;

    AddButton(btn: EagleCoreSidebarBtn) {
        this.control.appendChild(btn.GetNode());
    }

}