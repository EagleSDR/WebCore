import EagleEventDispatcher from "../../../lib/EagleEventDispatcher";
import EagleUtil from "../../../lib/EagleUtil";
import IEagleEventDispatcherHandler from "../../../lib/IEagleEventDispatcherHandler";
import { EagleButtonType } from "../../../lib/ui/window/EagleButtonType";
import EagleWindowImplementation from "../../../lib/ui/window/EagleWindowImplementation";
import IEagleWindowButton from "../../../lib/ui/window/IEagleWindowButton";
import IEagleWindowContext from "../../../lib/ui/window/IEagleWindowContext";
import EagleWindowManager from "./EagleWindowManager";
import IEagleWindowContainer from "./IEagleWindowContainer";
import IEagleWindowDropMount from "./IEagleWindowDropMount";
import IEagleWindowRegistration from "./IEagleWindowRegistration";
import ISavedWindowData from "./misc/ISavedWindowData";
require("./window_main.css");
require("./button_classes.css");

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

const BUTTON_CLASS_PREFIX = "eagle_window_header_btn_";

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
        }, {
            capture: true
        });

        //Add mousedown event so we can't move the window around with the buttons
        this.view.addEventListener("mousedown", (evt: MouseEvent) => {
            evt.preventDefault();
            evt.stopPropagation();
        }, {
            capture: true
        });
    }

    private view: HTMLElement;
    private classname: string;
    private dispatcher: EagleEventDispatcher<IEagleWindowButton> = new EagleEventDispatcher();

    static ResolveType(type: EagleButtonType) {
        switch (type) {
            case EagleButtonType.CLOSE:     return BUTTON_CLASS_PREFIX + "close";
            case EagleButtonType.SETTINGS:  return BUTTON_CLASS_PREFIX + "settings";
            case EagleButtonType.ADD:       return BUTTON_CLASS_PREFIX + "add";
            case EagleButtonType.HELP:      return BUTTON_CLASS_PREFIX + "help";
            case EagleButtonType.SEARCH:    return BUTTON_CLASS_PREFIX + "search";
            case EagleButtonType.LAUNCH:    return BUTTON_CLASS_PREFIX + "launch";
            case EagleButtonType.RELOAD:    return BUTTON_CLASS_PREFIX + "reload";
            case EagleButtonType.ADDONS:    return BUTTON_CLASS_PREFIX + "addon";
            case EagleButtonType.SHARE:     return BUTTON_CLASS_PREFIX + "share";
            case EagleButtonType.SEND:      return BUTTON_CLASS_PREFIX + "send";
            case EagleButtonType.UNDO:      return BUTTON_CLASS_PREFIX + "undo";
            case EagleButtonType.RELOAD:    return BUTTON_CLASS_PREFIX + "redo";
            case EagleButtonType.CAPTURE:   return BUTTON_CLASS_PREFIX + "capture";
            case EagleButtonType.EDIT:      return BUTTON_CLASS_PREFIX + "edit";
            default: throw Error("Unknown button type.");
        }
    }

    SetOrder(order: number) {
        this.view.style.order = order.toString();
    }

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
        this.closeBtn = this.CreateButton(EagleButtonType.CLOSE);
        this.closeBtn.SetOrder(1000);
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
    private closeBtn: EagleWindowButton;

    private title: string;
    private width: number;
    private height: number;

    private minWidth: number = 100;
    private maxWidth: number = 600;
    private minHeight: number = 100;
    private maxHeight: number = 600;

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

    SetMinWidth(width: number): void {
        this.minWidth = width;
    }

    SetMaxWidth(width: number): void {
        this.maxWidth = width;
    }

    SetMinHeight(height: number): void {
        this.minHeight = height;
    }

    SetMaxHeight(height: number): void {
        this.maxHeight = height;
    }

    GetMinWidth(): number {
        return this.minWidth;
    }

    GetMinHeight(): number {
        return this.minHeight;
    }

    GetMaxWidth(): number {
        return this.maxWidth;
    }

    GetMaxHeight(): number {
        return this.maxHeight;
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

    GetContainerWidth(): number {
        return this.width;
    }

    GetContainerHeight(): number {
        return this.height;
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
        return Math.floor(this.GetContainerWidth() - this.GetContentPaddingLeft() - this.GetContentPaddingRight());
    }

    //Gets the height of the window content.
    GetHeight(): number {
        return Math.floor(this.GetContainerHeight() - this.GetContentPaddingTop() - this.GetContentPaddingBottom());
    }

    //Creates a button in the window header
    CreateButton(icon: EagleButtonType): EagleWindowButton {
        return this.CreateButtonCustom(EagleWindowButton.ResolveType(icon));
    }

    //Creates a custom button in the window header
    CreateButtonCustom(classname: string): EagleWindowButton {
        var btn = new EagleWindowButton(this.frame.header, classname);
        this.buttons.push(btn);
        return btn;
    }

    //Closes the current window
    CloseWindow(): void {
        //Detach from container, if any
        if (this.container != null)
            this.container.Detach();

        //Notify
        this.implementation.OnClosed();

        //Save
        this.manager.SaveAll();
    }

}