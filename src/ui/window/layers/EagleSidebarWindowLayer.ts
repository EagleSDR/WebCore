import EagleUtil from "../../../../lib/EagleUtil";
import EagleWindow from "../EagleWindow";
import EagleWindowManager from "../EagleWindowManager";
import IEagleWindowContainer from "../IEagleWindowContainer";
import IEagleWindowDropMount from "../IEagleWindowDropMount";
import IEagleWindowLayer from "../IEagleWindowLayer";
import ISavedWindowData from "../misc/ISavedWindowData";
require("./sidebar.css");

export default class EagleSidebarWindowLayer implements IEagleWindowLayer {

    constructor(mount: HTMLElement, manager: EagleWindowManager) {
        this.mount = mount;
        this.manager = manager;

        //Add a dummy window container
        this.dummy = new SidebarWindowContainerDummy(this);
        this.windows.push(this.dummy);
        this.mount.appendChild(this.dummy.GetNode());
    }

    private mount: HTMLElement;
    private manager: EagleWindowManager;
    private windows: SidebarWindowBaseContainer[] = [];
    private dummy: SidebarWindowContainerDummy;

    Save(): ISidebarWindowData {
        //Loop through active windows to compile list of them
        var serialized: ISidebarWindowItemData[] = [];
        for (var i = 0; i < this.windows.length; i++) {
            //Make sure it's active and serializable
            if (!this.windows[i].IsSerializable())
                continue;

            //Serialize and add
            serialized.push(this.windows[i].Serialize());
        }

        //Wrap in container
        return {
            items: serialized
        };
    }

    Load(data: ISidebarWindowData): void {
        //Load each window and inflate them
        for (var i = 0; i < data.items.length; i++) {
            //Create item at the end of the list
            var container = this.InsertEnd();

            //Inflate window
            var window = this.GetWindowManager().DeserializeWindow(data.items[i].window);

            //Attach
            container.AttachWindow(window, data.items[i].height);
        }
    }

    GetWindowManager(): EagleWindowManager {
        return this.manager;
    }

    GetWindowWidth() {
        return this.mount.clientWidth;
    }

    InsertBefore(ref: SidebarWindowBaseContainer): SidebarWindowContainer {
        //Create
        var o = new SidebarWindowContainer(this);

        //Get the list index
        var index = this.GetItemIndex(ref);

        //Insert into DOM
        this.mount.insertBefore(o.GetNode(), ref.GetNode());

        //Insert into list
        this.windows.splice(index, 0, o);

        return o;
    }

    InsertAfter(ref: SidebarWindowBaseContainer): SidebarWindowContainer {
        //Get the list index
        var index = this.GetItemIndex(ref);

        //Find the next valid index
        do {
            index++;
        } while (!this.windows[index].IsActive());

        //Just add before the next one
        return this.InsertBefore(this.windows[index]);
    }

    InsertEnd(): SidebarWindowContainer {
        return this.InsertBefore(this.dummy);
    }

    private GetItemIndex(ref: SidebarWindowBaseContainer): number {
        for (var i = 0; i < this.windows.length; i++) {
            if (this.windows[i] == ref)
                return i;
        }
        throw Error("Invalid item.");
    }

}

class SidebarWindowBaseContainer {

    constructor(controller: EagleSidebarWindowLayer) {
        //Set
        this.controller = controller;

        //Create container node
        this.node = EagleUtil.CreateElement("div", "eagle_window_layer_sidebar_container");
    }

    protected node: HTMLElement;
    protected controller: EagleSidebarWindowLayer;

    // Is it shown?
    IsActive(): boolean {
        return false;
    }

    // Can it be saved?
    IsSerializable(): boolean {
        return false;
    }

    GetNode(): HTMLElement {
        return this.node;
    }

    Serialize(): ISidebarWindowItemData {
        throw Error("Invalid window. This window is not serializable.");
    }

    protected CreateFlap(classname: string, callback: (window: EagleWindow) => void) {
        var root = EagleUtil.CreateElement("div", "eagle_window_layer_sidebar_flap", this.node);
        var light = EagleUtil.CreateElement("div", "eagle_window_layer_sidebar_light", root);
        root.classList.add(classname);
        (light as unknown as IEagleWindowDropMount).OnEagleWindowDropped = callback;
        (root as unknown as IEagleWindowDropMount).OnEagleWindowDropped = callback;
    }

}

class SidebarWindowContainerDummy extends SidebarWindowBaseContainer {

    constructor(controller: EagleSidebarWindowLayer) {
        super(controller);

        //Create the dummy
        this.CreateFlap("eagle_window_layer_sidebar_flap_dummy", (window: EagleWindow) => { this.controller.InsertBefore(this).AttachWindow(window); });

        //Force this to have a height
        this.node.style.height = "20px";
    }

    IsActive(): boolean {
        return true;
    }

}

class SidebarWindowContainer extends SidebarWindowBaseContainer implements IEagleWindowContainer {

    constructor(controller: EagleSidebarWindowLayer) {
        super(controller);

        //Create the "flaps" where windows should be dropped
        this.CreateFlap("eagle_window_layer_sidebar_flap_top", (window: EagleWindow) => { this.controller.InsertBefore(this).AttachWindow(window); });
        this.CreateFlap("eagle_window_layer_sidebar_flap_bottom", (window: EagleWindow) => { this.controller.InsertAfter(this).AttachWindow(window); });
    }

    private window: EagleWindow;
    private height: number;

    AttachWindow(window: EagleWindow, overrideHeight: number = -1) {
        //Set
        this.window = window;
        this.height = overrideHeight == -1 ? window.GetContainerHeight() : overrideHeight;

        //Move here
        window.ChangeContainer(this, this.node);

        //Resize horizontally
        window.SetSize(this.controller.GetWindowWidth(), this.height);

        //Save
        this.controller.GetWindowManager().SaveAll();
    }

    IsActive(): boolean {
        return this.window != null;
    }

    IsSerializable(): boolean {
        return this.IsActive();
    }

    Serialize(): ISidebarWindowItemData {
        if (this.IsActive()) {
            return {
                height: this.height,
                window: this.window.Serialize()
            };
        }
        return super.Serialize();
    }

    private GetConstrainedHeight(): number {
        var newHeight = this.height;
        if (newHeight > this.window.GetMaxHeight())
            newHeight = this.window.GetMaxHeight();
        if (newHeight < this.window.GetMinHeight())
            newHeight = this.window.GetMinHeight();
        return newHeight;
    }

    /* WINDOW CONTAINER */

    Detach(): void {
        //Delete the node
        this.node.remove();

        //Deactivate
        this.window = null;
    }

    ShowWindowBorder(): boolean {
        return false;
    }

    WindowMoveRequested(deltaX: number, deltaY: number): void {
        //Popout
        this.window.PopOutWindow(this.controller.GetWindowWidth(), this.window.GetHeight());
    }

    WindowMoveEnd(): void {
    }

    WindowResizeRequested(deltaX: number, deltaY: number): void {
        //Update vertically
        this.height += deltaY;
        this.window.SetSize(this.controller.GetWindowWidth(), this.GetConstrainedHeight());
    }

    WindowResizeEnd(): void {
        //Constrain internal height variable
        this.height = this.GetConstrainedHeight();

        //Save
        this.controller.GetWindowManager().SaveAll();
    }

    WindowMadeActive(): void {
        
    }

    WindowMadeInactive(): void {
        
    }

}

interface ISidebarWindowData {

    items: ISidebarWindowItemData[];

}

interface ISidebarWindowItemData {

    window: ISavedWindowData;
    height: number;

}