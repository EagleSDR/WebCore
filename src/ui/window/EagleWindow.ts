import EagleEventDispatcher from "../../../lib/EagleEventDispatcher";
import EagleUtil from "../../../lib/EagleUtil";
import IEagleEventDispatcherHandler from "../../../lib/IEagleEventDispatcherHandler";
import EagleWindowImplementation from "../../../lib/ui/window/EagleWindowImplementation";
import IEagleWindowButton from "../../../lib/ui/window/IEagleWindowButton";
import IEagleWindowContext from "../../../lib/ui/window/IEagleWindowContext";
import EagleWindowManager from "./EagleWindowManager";
import IEagleWindowContainer from "./IEagleWindowContainer";
import IEagleWindowDropMount from "./IEagleWindowDropMount";
import IEagleWindowRegistration from "./IEagleWindowRegistration";
import ISavedWindowData from "./misc/ISavedWindowData";
require("./window_main.css");

class EagleWindowFrame {

    constructor() {
        //Create window
        this.root = EagleUtil.CreateElement("div", "eagle_window_root");
        this.header = EagleUtil.CreateElement("div", "eagle_window_header", this.root);
        this.content = EagleUtil.CreateElement("div", "eagle_window_content", this.root);
        this.handle = EagleUtil.CreateElement("div", "eagle_window_handle", this.root);

        //Create header components
        this.title = EagleUtil.CreateElement("div", "eagle_window_header_title", this.header);
    }

    root: HTMLElement;
    header: HTMLElement;
    content: HTMLElement;
    handle: HTMLElement;

    title: HTMLElement;

}

class EagleWindowButton implements IEagleWindowButton {

    constructor(container: HTMLElement, classname: string) {
        //Set
        this.classname = classname;

        //Create button
        this.view = EagleUtil.CreateElement("div", "eagle_window_header_btn", container);
        this.view.classList.add(classname);
        this.view.addEventListener("click", (evt: MouseEvent) => {
            this.dispatcher.Send(this);
            evt.preventDefault();
            evt.stopPropagation();
        })
    }

    private view: HTMLElement;
    private classname: string;
    private dispatcher: EagleEventDispatcher<IEagleWindowButton> = new EagleEventDispatcher();

    SetClassName(classname: string): void {
        //Remove old
        this.view.classList.remove(this.classname);

        //Set
        this.classname = classname;

        //Add
        this.view.classList.add(this.classname);
    }

    SetVisible(visible: boolean): void {
        if (visible)
            this.view.classList.remove("eagle_window_header_btn_disabled");
        else
            this.view.classList.add("eagle_window_header_btn_disabled");
    }

    Bind(callback: IEagleEventDispatcherHandler<IEagleWindowButton>): void {
        this.dispatcher.Bind(callback);
    }

}

export default class EagleWindow implements IEagleWindowContext {

    constructor(manager: EagleWindowManager, factory: IEagleWindowRegistration, winClassname: string, winSettings: any) {
        //Set
        this.manager = manager;
        this.classname = winClassname;
        this.winSettings = winSettings;

        //Create frame
        this.frame = new EagleWindowFrame();

        //Create draggables
        this.frame.root.addEventListener("mousedown", (evt: MouseEvent) => {
            this.ActivateWindow();
        });
        this.frame.header.addEventListener("mousedown", (evt: MouseEvent) => {
            this.isMoving = true;
            evt.preventDefault();
        });
        this.frame.handle.addEventListener("mousedown", (evt: MouseEvent) => {
            this.isResizing = true;
            evt.preventDefault();
        });
        window.addEventListener("mousemove", (evt: MouseEvent) => {
            if (this.isMoving) { this.WindowMoveDrag(evt); }
            if (this.isResizing) { this.WindowResizeDrag(evt); }
            if (this.isMoving || this.isResizing)
                evt.preventDefault();
        });
        window.addEventListener("mouseup", (evt: MouseEvent) => {
            if (this.isMoving) { this.WindowMoveEnd(evt); }
            if (this.isResizing) { this.WindowResizeEnd(evt); }
            if (this.isMoving || this.isResizing) {
                evt.preventDefault();
                this.isMoving = false;
                this.isResizing = false;
            }
        });

        //Create close button
        this.closeBtn = this.CreateButton("eagle_window_header_closebtn");
        this.closeBtn.Bind({
            HandleEvent: () => {
                this.CloseWindow();
            }
        });

        //Set defaults
        this.SetTitle(factory.GetDisplayName());

        //Create the implementation
        this.implementation = factory.Construct(this);

        //Trigger window open
        this.implementation.OnOpened();
    }

    private manager: EagleWindowManager;
    private container: IEagleWindowContainer;
    private frame: EagleWindowFrame;
    private classname: string;
    private buttons: EagleWindowButton[] = [];
    private closeBtn: IEagleWindowButton;

    private title: string;
    private width: number;
    private height: number;

    private winSettings: any;
    private implementation: EagleWindowImplementation;

    private isMoving: boolean = false;
    private isResizing: boolean = false;

    Serialize(): ISavedWindowData {
        return {
            classname: this.classname,
            title: this.title,
            settings: this.winSettings
        }
    }

    MakeMouseDragging() {
        this.isMoving = true;
    }

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
        mount.appendChild(this.frame.root);

        //Configure with settings
        if (this.container.ShowWindowBorder())
            this.frame.root.classList.add("eagle_window_root_border");
        else
            this.frame.root.classList.remove("eagle_window_root_border");
    }

    SetSize(width: number, height: number) {
        //Copy
        this.width = width;
        this.height = height;

        //Apply to DOM
        this.frame.root.style.width = width + "px";
        this.frame.root.style.height = height + "px";

        //Apply to implementation
        this.implementation.OnResized();
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
        //Add class
        this.frame.root.classList.add("eagle_window_active");

        //Notify container
        if (this.container != null)
            this.container.WindowMadeActive();
    }

    WindowDeactivated(): void {
        //Remove class
        this.frame.root.classList.remove("eagle_window_active");

        //Notify container
        if (this.container != null)
            this.container.WindowMadeInactive();
    }

    GetBoundingClientRect(): DOMRect {
        return this.frame.root.getBoundingClientRect();
    }

    private ActivateWindow(): void {
        this.manager.ChangeActiveWindow(this);
    }

    private WindowMoveDrag(evt: MouseEvent) {
        //Change our state
        this.frame.root.classList.add("eagle_window_dragging");

        //Send to container
        if (this.container != null)
            this.container.WindowMoveRequested(evt.movementX, evt.movementY);
    }

    private WindowMoveEnd(evt: MouseEvent) {
        //Change our state
        this.frame.root.classList.remove("eagle_window_dragging");

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

    private GetContentPaddingTop(): number {
        return 30;
    }

    private GetContentPaddingLeft(): number {
        return 0;
    }

    private GetContentPaddingRight(): number {
        return 0;
    }

    private GetContentPaddingBottom(): number {
        return 0;
    }

    /* PUBLIC API */

    //Sets the current window title.
    SetTitle(title: string): void {
        this.title = title;
        this.frame.title.innerText = title;
    }

    //Sets new setting data that'll be recalled next time the window is created.
    SetSettings(data: any): void {
        this.winSettings = data;
        this.manager.SaveAll();
    }

    //Gets the window content. You should place your content in this.
    GetMount(): HTMLElement {
        return this.frame.content;
    }

    //Get the instance-specific settings.
    GetSettings(): any {
        return this.winSettings;
    }

    //Gets the width of the window content.
    GetWidth(): number {
        return Math.floor(this.width - this.GetContentPaddingLeft() - this.GetContentPaddingRight());
    }

    //Gets the height of the window content.
    GetHeight(): number {
        return Math.floor(this.height - this.GetContentPaddingTop() - this.GetContentPaddingBottom());
    }

    //Creates a button in the window header
    CreateButton(classname: string): IEagleWindowButton {
        var btn = new EagleWindowButton(this.frame.header, classname);
        this.buttons.push(btn);
        return btn;
    }

    //Closes the current window
    CloseWindow(): void {
        //Detach from container, if any
        if (this.container != null)
            this.container.Detach();

        //Save
        this.manager.SaveAll();
    }

}