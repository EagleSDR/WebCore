import EagleUtil from "../../../../lib/EagleUtil";
import EagleApp from "../../../EagleApp";
import EagleWindowFactoryBar from "../../window/factory/EagleWindowFactoryBar";
require('./customize.css');

export default class EagleCoreCustomize extends EagleWindowFactoryBar {

    constructor(app: EagleApp, container: HTMLElement) {
        super(app.windowManager);
        this.app = app;
        this.node = EagleUtil.CreateElement("div", "eagle_core_customize", container);
        this.header = EagleUtil.CreateElement("div", "eagle_core_customize_header", this.node);
        this.content = EagleUtil.CreateElement("div", "eagle_core_customize_content", this.node);
        EagleUtil.CreateElement("div", "eagle_core_customize_header_text", this.header).innerText = "Customize";
        EagleUtil.CreateElement("div", "eagle_core_customize_header_close", this.header).addEventListener("click", (evt: MouseEvent) => {
            this.Hide();
            evt.preventDefault();
        });
    }

    private app: EagleApp;
    private node: HTMLElement;
    private header: HTMLElement;
    private content: HTMLElement;

    protected GetMount(): HTMLElement {
        return this.content;
    }

    Show() {
        this.node.classList.add("eagle_core_customize_active");
    }

    Hide() {
        this.node.classList.remove("eagle_core_customize_active");
    }

}