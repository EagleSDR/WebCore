import IEagleWindowLayer from "../IEagleWindowLayer";
import EagleUtil from "../../../../lib/EagleUtil";
import EagleWindow from "../EagleWindow";
import IEagleWindowContainer from "../IEagleWindowContainer";
import EagleWindowManager from "../EagleWindowManager";

interface ISavedData {
    windows: ISavedDataWindow[];
}

interface ISavedDataWindow {
    width: number;
    height: number;
    x: number;
    y: number;
    window: any;
}

export default class EagleFloatingWindowLayer implements IEagleWindowLayer {

    constructor(mount: HTMLElement, manager: EagleWindowManager) {
        this.mount = mount;
        this.manager = manager;
    }

    private mount: HTMLElement;
    private manager: EagleWindowManager;
    private windows: EagleFloatingWindowContainer[] = [];
    private nextIndex: number = 1;

    GetWindowManager(): EagleWindowManager {
        return this.manager;
    }

    MakePopoutWindow(window: EagleWindow, width: number, height: number, posX: number, posY: number): IEagleWindowContainer {
        //Create container
        var e = EagleUtil.CreateElement("div", null, this.mount);
        e.style.position = "fixed";

        //Create data
        var mount = new EagleFloatingWindowContainer(
            this,
            e,
            window,
            width,
            height,
            posX,
            posY
        );
        mount.SetZIndex(this.nextIndex++);

        //Register
        this.windows.push(mount);

        return mount;
    }

    Save(): any {
        return {
            "windows": this.SaveWindows()
        };
    }

    Load(data: ISavedData) {
        for (var i = 0; i < data.windows.length; i++)
            this.MakePopoutWindow(
                this.manager.DeserializeWindow(data.windows[i].window),
                data.windows[i].width,
                data.windows[i].height,
                data.windows[i].x,
                data.windows[i].y
            );
    }

    InternalDismissWindow(window: EagleFloatingWindowContainer) {
        //Remove from list
        this.windows.splice(this.windows.indexOf(window), 1);
    }

    InternalWindowMadeActive(window: EagleFloatingWindowContainer) {
        window.SetZIndex(this.nextIndex++);
    }

    InternalWindowMadeInactive(window: EagleFloatingWindowContainer) {

    }

    private SaveWindows(): any[] {
        var arr = [];
        for (var i = 0; i < this.windows.length; i++)
            arr.push(this.windows[i].Save());
        return arr;
    }

}

class EagleFloatingWindowContainer implements IEagleWindowContainer {

    constructor(layer: EagleFloatingWindowLayer, container: HTMLElement, window: EagleWindow, width: number, height: number, posX: number, posY: number) {
        //Set
        this.layer = layer;
        this.container = container;
        this.window = window;
        this.width = width;
        this.height = height;
        this.posX = posX;
        this.posY = posY;

        //Change
        this.window.ChangeContainer(this, this.container);

        //Apply
        this.UpdatePos();
        this.UpdateSize();
    }

    private layer: EagleFloatingWindowLayer;
    private container: HTMLElement;
    private window: EagleWindow;
    private width: number = 200;
    private height: number = 200;
    private posX: number = 0;
    private posY: number = 0;
    private isMoving: boolean = false;
    private isResizing: boolean = false;

    SetZIndex(index: number) {
        this.container.style.zIndex = index.toString();
    }

    WindowMadeActive() {
        this.layer.InternalWindowMadeActive(this);
    }

    WindowMadeInactive() {
        this.layer.InternalWindowMadeInactive(this);
    }

    Save(): any {
        return {
            "width": this.width,
            "height": this.height,
            "x": this.posX,
            "y": this.posY,
            "window": this.window.Serialize()
        }
    }

    Detach(): void {
        this.layer.InternalDismissWindow(this);
        this.container.remove();
    }

    WindowMoveRequested(deltaX: number, deltaY: number): void {
        //Constrain values to prevent awkwardness next time user tries to move it. Only do this the first time.
        if (!this.isMoving) {
            this.isMoving = true;
            this.posX = this.GetConstrainedX();
            this.posY = this.GetConstrainedY();
        }

        //Update
        this.posX += deltaX;
        this.posY += deltaY;
        this.UpdatePos();

        //Set global state
        document.body.classList.add("eagle_state_window_dragging");
    }

    WindowMoveEnd(): void {
        //Change state
        this.isMoving = false;

        //Set global state
        document.body.classList.remove("eagle_state_window_dragging");

        //Save
        this.layer.GetWindowManager().SaveAll();
    }

    WindowResizeRequested(deltaX: number, deltaY: number): void {
        //Constrain values to prevent awkwardness next time user tries to resize it. Only do this the first time.
        if (!this.isResizing) {
            this.isResizing = true;
            this.width = this.GetConstrainedWidth();
            this.height = this.GetConstrainedHeight();
        }

        //Update
        this.width += deltaX;
        this.height += deltaY;
        this.UpdateSize();
    }

    WindowResizeEnd(): void {
        //Change state
        this.isResizing = false;

        //Save
        this.layer.GetWindowManager().SaveAll();
    }

    ShowWindowBorder(): boolean {
        return true;
    }

    private UpdatePos() {
        this.container.style.left = this.GetConstrainedX() + "px";
        this.container.style.top = this.GetConstrainedY() + "px";
    }

    private UpdateSize() {
        this.window.SetSize(
            this.GetConstrainedWidth(),
            this.GetConstrainedHeight()
        );
    }

    private GetConstrainedX(): number {
        return this.Constrain(this.posX, 0, window.innerWidth - this.GetConstrainedWidth());
    }

    private GetConstrainedY(): number {
        return this.Constrain(this.posY, 0, window.innerHeight - this.GetConstrainedHeight());
    }

    private GetConstrainedWidth(): number {
        return this.Constrain(this.width, this.window.GetMinWidth(), this.window.GetMaxWidth());
    }

    private GetConstrainedHeight(): number {
        return this.Constrain(this.height, this.window.GetMinHeight(), this.window.GetMaxHeight());
    }

    private Constrain(value: number, min: number, max: number): number {
        if (value > max)
            value = max;
        if (value < min)
            value = min;
        return value;
    }

}