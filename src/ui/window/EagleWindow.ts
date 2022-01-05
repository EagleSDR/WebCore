import EagleUtil from "../../../lib/EagleUtil";
import EagleWindowManager from "./EagleWindowManager";
import IEagleWindowContainer from "./IEagleWindowContainer";
import IEagleWindowDropMount from "./IEagleWindowDropMount";
require("./window_main.css");

export default class EagleWindow {

    constructor(manager: EagleWindowManager) {
        this.manager = manager;
        this.root = EagleUtil.CreateElement("div", "eagle_window_root");
        this.header = EagleUtil.CreateElement("div", "eagle_window_header", this.root);
        this.content = EagleUtil.CreateElement("div", "eagle_window_content", this.root);
        this.handle = EagleUtil.CreateElement("div", "eagle_window_handle", this.root);

        //Create draggables
        EagleUtil.MakeElementDraggable(this.header, {
            DragBegin: (evt: MouseEvent) => { },
            DragMove: (evt: MouseEvent) => { this.WindowMoveDrag(evt); },
            DragEnd: (evt: MouseEvent) => { this.WindowMoveEnd(evt); }
        });
        EagleUtil.MakeElementDraggable(this.handle, {
            DragBegin: (evt: MouseEvent) => { },
            DragMove: (evt: MouseEvent) => { this.WindowResizeDrag(evt); },
            DragEnd: (evt: MouseEvent) => { this.WindowResizeEnd(evt); }
        });

        //Add events
        this.root.addEventListener("mousedown", () => this.ActivateWindow());

        //DEBUG
        this.content.style.backgroundColor = "rgb(" + Math.floor(Math.random() * 255) + "," + Math.floor(Math.random() * 255) + "," + Math.floor(Math.random() * 255) + ")";
    }

    private manager: EagleWindowManager;
    private container: IEagleWindowContainer;

    private title: string;
    private closeEnabled: boolean = true;

    private root: HTMLElement;
    private header: HTMLElement;
    private content: HTMLElement;
    private handle: HTMLElement;

    GetWindowManager(): EagleWindowManager {
        return this.manager;
    }

    PopOutWindow(width: number, height: number): void {
        this.manager.PopOutWindow(this, width, height);
    }

    ChangeContainer(container: IEagleWindowContainer, mount: HTMLElement) {
        //Detach from current
        if (this.container != null)
            this.container.Detach();

        //Attach
        this.container = container;
        mount.appendChild(this.root);

        //Configure with settings
        if (this.container.ShowWindowBorder())
            this.root.classList.add("eagle_window_root_border");
        else
            this.root.classList.remove("eagle_window_root_border");
    }

    SetSize(width: number, height: number) {
        this.root.style.width = width + "px";
        this.root.style.height = height + "px";
    }

    GetMinWidth(): number {
        return 100;
    }

    GetMinHeight(): number {
        return 100;
    }

    GetMaxWidth(): number {
        return 600;
    }

    GetMaxHeight(): number {
        return 600;
    }

    WindowActivated(): void {
        this.root.classList.add("eagle_window_active");
    }

    WindowDeactivated(): void {
        this.root.classList.remove("eagle_window_active");
    }

    GetBoundingClientRect(): DOMRect {
        return this.root.getBoundingClientRect();
    }

    private ActivateWindow(): void {
        this.manager.ChangeActiveWindow(this);
    }

    private WindowMoveDrag(evt: MouseEvent) {
        //Change our state
        this.root.classList.add("eagle_window_dragging");

        //Send to container
        if (this.container != null)
            this.container.WindowMoveRequested(evt.movementX, evt.movementY);
    }

    private WindowMoveEnd(evt: MouseEvent) {
        //Change our state
        this.root.classList.remove("eagle_window_dragging");

        //Send to container
        if (this.container != null)
            this.container.WindowMoveEnd();

        //Check if we were dropped on a drop mount
        var drop = evt.target as unknown as IEagleWindowDropMount;
        if (drop.OnEagleWindowDropped != null)
            drop.OnEagleWindowDropped(this);
    }

    private WindowResizeDrag(evt: MouseEvent) {
        //Send to container
        if (this.container != null)
            this.container.WindowResizeRequested(evt.movementX, evt.movementY);
    }

    private WindowResizeEnd(evt: MouseEvent) {
        //Send to container
        if (this.container != null)
            this.container.WindowResizeEnd();
    }

}