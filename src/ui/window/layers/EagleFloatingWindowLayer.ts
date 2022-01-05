import IEagleWindowLayer from "../IEagleWindowLayer";
import EagleUtil from "../../../../lib/EagleUtil";
import EagleWindow from "../EagleWindow";
import IEagleWindowContainer from "../IEagleWindowContainer";

export default class EagleFloatingWindowLayer {

    constructor(layer: IEagleWindowLayer) {
        this.layer = layer;
    }

    private layer: IEagleWindowLayer;

    MakePopoutWindow(window: EagleWindow, width: number, height: number, posX: number, posY: number): IEagleWindowContainer {
        return new EagleFloatingWindowContainer(
            this.layer,
            this.CreateContainer(),
            window,
            width,
            height,
            posX,
            posY
        );
    }

    private CreateContainer(): HTMLElement {
        var e = EagleUtil.CreateElement("div", null, this.layer.GetMount());
        e.style.position = "fixed";
        return e;
    }
}

class EagleFloatingWindowContainer implements IEagleWindowContainer {

    constructor(layer: IEagleWindowLayer, container: HTMLElement, window: EagleWindow, width: number, height: number, posX: number, posY: number) {
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

    private layer: IEagleWindowLayer;
    private container: HTMLElement;
    private window: EagleWindow;
    private width: number = 200;
    private height: number = 200;
    private posX: number = 0;
    private posY: number = 0;
    private isMoving: boolean = false;
    private isResizing: boolean = false;

    Detach(): void {
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