import EagleUtil from "../../../../lib/EagleUtil";

export default abstract class EagleCoreSidebarBtn {

    constructor(classname: string) {
        this.node = EagleUtil.CreateElement("div", "eagle_core_sidebar_btn");
        this.classname = classname;

        //Configure node
        this.node.classList.add(classname);
        this.node.addEventListener("click", (evt: MouseEvent) => {
            if (!this.isLoading) {
                this.SetLoading(true);
                this.HandleClick().then(() => {
                    this.SetLoading(false);
                });
            }
            evt.preventDefault();
        });
    }

    private node: HTMLElement;
    private classname: string;
    private isLoading: boolean = false;

    /* PUBLIC API */

    GetNode(): HTMLElement {
        return this.node;
    }

    /* PROTECTED API */

    protected ChangeCustomClassname(newClassname: string) {
        this.node.classList.remove(this.classname);
        this.classname = newClassname;
        this.node.classList.add(this.classname);
    }

    protected abstract HandleClick(): Promise<void>;

    /* PRIVATE */

    private SetLoading(isLoading: boolean) {
        this.isLoading = isLoading;
        if (this.isLoading)
            this.node.classList.add("eagle_core_sidebar_btn_loading");
        else
            this.node.classList.remove("eagle_core_sidebar_btn_loading");
    }

}