import IEaglePluginSource from "../../../lib/plugin/client/IEaglePluginSource";
import IEaglePluginSourceOption from "../../../lib/plugin/client/IEaglePluginSourceOption";
import { EagleDialogButtonType } from "../../../lib/ui/dialog/button/EagleDialogButtonType";
import IEagleDialog from "../../../lib/ui/dialog/IEagleDialog";
import IEagleDialogList from "../../../lib/ui/dialog/list/IEagleDialogList";
import EaglePluginContext from "../../core/plugin/EaglePluginContext";
import EagleApp from "../../EagleApp";
import EagleCoreSidebarBtnCustomize from "./btns/EagleCoreSidebarBtnCustomize";
import EagleCoreSidebarBtnPower from "./btns/EagleCoreSidebarBtnPower";
import EagleCoreCustomize from "./customize/EagleCoreCustomize";
import EagleCoreSidebar from "./sidebar/EagleCoreSidebar";

export default class EagleCoreInterface {

    constructor(app: EagleApp, container: HTMLElement) {
        this.app = app;

        //Create bits
        this.sidebar = new EagleCoreSidebar(app, container);
        this.customize = new EagleCoreCustomize(app, container);
    }

    private app: EagleApp;

    sidebar: EagleCoreSidebar;
    customize: EagleCoreCustomize;

    async Initialize() {
        //Add buttons
        this.sidebar.AddButton(new EagleCoreSidebarBtnPower(this.app));
        this.sidebar.AddButton(new EagleCoreSidebarBtnCustomize(this.customize));
    }

}