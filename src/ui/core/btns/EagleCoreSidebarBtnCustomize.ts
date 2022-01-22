import EagleCoreCustomize from "../customize/EagleCoreCustomize";
import EagleCoreSidebarBtn from "../sidebar/EagleCoreSidebarBtn";
require('./btns.css');

export default class EagleCoreSidebarBtnCustomize extends EagleCoreSidebarBtn {

    constructor(customize: EagleCoreCustomize) {
        super("eagle_core_btns_customize");
        this.customize = customize;
    }

    private customize: EagleCoreCustomize;

    protected async HandleClick(): Promise<void> {
        this.customize.Show();
    }

}